const { firebaseDb } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const { v4: uuidv4 } = require("uuid");

// Create or get admin chat
exports.createAdminChat = async (req, res) => {
  try {
    const {
      targetId,
      chatType,
      category,
      priority,
      tags,
      initialMessage,
      chatReportId,
    } = req.body;
    const initiatorId = req.user.uid;
    const timestamp = new Date();

    console.log("Auth Debug - User:", {
      uid: req.user.uid,
      email: req.user.email,
      customClaims: req.user.customClaims,
      roles: req.user.roles,
    });

    // Verify initiator is an admin (must be in admins collection)

    let initiatorAdmin;
    if (chatType === "admin-admin" || chatType === "admin-client") {
      initiatorAdmin = await firebaseDb
        .collection("admins")
        .doc(initiatorId)
        .get();
    } else {
      initiatorAdmin = await firebaseDb
        .collection("users")
        .doc(initiatorId)
        .get();
    }
    if (!initiatorAdmin.exists) {
      console.log(
        "Auth Debug - Initiator not found in admins or users collection"
      );
      return res
        .status(403)
        .json({ error: "Unauthorized - Admin access only" });
    }

    // Validate chat type
    if (!["admin-admin", "admin-client", "client-admin"].includes(chatType)) {
      return res.status(400).json({ error: "Invalid chat type" });
    }

    // Check target user based on chat type
    let targetUser;
    if (chatType === "admin-admin" || chatType === "client-admin") {
      // For admin-admin chat, target must be in admins collection
      targetUser = await firebaseDb.collection("admins").doc(targetId).get();
      if (!targetUser.exists) {
        return res.status(404).json({ error: "Target admin not found" });
      }
    } else if (chatType === "admin-client") {
      // For admin-client chat, target must be in users collection
      targetUser = await firebaseDb.collection("users").doc(targetId).get();
      if (!targetUser.exists) {
        return res.status(404).json({ error: "Target client not found" });
      }
    }

    // Check if chat already exists
    const existingChats = await firebaseDb
      .collection("adminChats")
      .where("participants", "array-contains", initiatorId)
      .get();

    let existingChat = null;
    existingChats.forEach((doc) => {
      const data = doc.data();
      if (
        data.participants.includes(targetId) &&
        data.chatType === chatType &&
        data.tags[0] == tags[0]
      ) {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) {
      return res.status(200).json({
        chatId: existingChat.id,
        message: "Existing chat found",
        chat: existingChat,
      });
    }
    //store chats in the reports if it is a report
    if (tags && tags.length > 0 && tags[0] === "report") {
      const chatRef = firebaseDb.collection("chats").doc(chatReportId);
      const chat = await chatRef.get();

      if (!chat.exists) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const chatData = chat.data();
      const newReport = await firebaseDb.collection("Reports").add({
        participants: [initiatorId, targetId],
        chatHistory: chatData.messages || [],
        createdAt: timestamp,
        updatedAt: timestamp,
        tags: tags || [],
        reason: initialMessage,
        status: "active",
      });
    }
    // Create new chat in adminChats collection
    const newChat = await firebaseDb.collection("adminChats").add({
      participants: [initiatorId, targetId],
      messages: [
        {
          text:
            initialMessage ||
            `Chat initiated by ${
              initiatorAdmin.data().displayName || initiatorAdmin.data().email
            }`,
          senderId: initiatorId,
          type: "system",
          createdAt: timestamp,
          readBy: [initiatorId],
        },
      ],
      chatType,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "active",
      category: category || "general",
      priority: priority || "normal",
      tags: tags || [],
      unreadCount: 1,
      metadata: {
        initiator: {
          id: initiatorId,
          name:
            initiatorAdmin.data().displayName || initiatorAdmin.data().email,
          email: initiatorAdmin.data().email,
          role: "admin",
        },
        target: {
          id: targetId,
          name: targetUser.data().displayName || targetUser.data().email,
          email: targetUser.data().email,
          role: chatType === "admin-admin" ? "admin" : "client",
        },
      },
      stats: {
        totalMessages: 1,
        lastActivity: timestamp,
      },
    });

    // Emit socket event for real-time updates
    req.app
      .get("io")
      .to(`admin-chat-${newChat.id}`)
      .emit("admin-chat-created", {
        chatId: newChat.id,
        participants: [initiatorId, targetId],
        chatType,
        metadata: {
          category,
          priority,
          tags,
        },
      });

    return res.status(201).json({
      chatId: newChat.id,
      message: "Chat created successfully",
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

// Get all chats for a user (admin or client)
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      status,
      priority,
      category,
      chatType,
      searchTerm,
      tags,
      startDate,
      endDate,
      sortBy = "updatedAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    let query = firebaseDb
      .collection("adminChats")
      .where("participants", "array-contains", userId);

    // Apply filters
    if (chatType) query = query.where("chatType", "==", chatType);
    if (status) query = query.where("status", "==", status);
    if (priority) query = query.where("priority", "==", priority);
    if (category) query = query.where("category", "==", category);
    if (tags)
      query = query.where("tags", "array-contains-any", tags.split(","));

    // Get the filtered chats
    const chatsSnapshot = await query.get();
    let chats = [];

    for (const doc of chatsSnapshot.docs) {
      const chatData = doc.data();
      const otherParticipantId = chatData.participants.find(
        (id) => id !== userId
      );

      // Get other participant's data
      const otherParticipantDoc = await firebaseDb
        .collection("users")
        .doc(otherParticipantId)
        .get();

      const otherParticipantData = otherParticipantDoc.data() || {};

      // Apply date range filter if provided
      if (startDate && endDate) {
        const chatDate = chatData.updatedAt.toDate();
        if (chatDate < new Date(startDate) || chatDate > new Date(endDate)) {
          continue;
        }
      }

      // Apply search term filter if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          chatData.messages.some((msg) =>
            msg.text.toLowerCase().includes(searchLower)
          ) ||
          otherParticipantData.displayName
            ?.toLowerCase()
            .includes(searchLower) ||
          otherParticipantData.email?.toLowerCase().includes(searchLower) ||
          chatData.category?.toLowerCase().includes(searchLower) ||
          chatData.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) continue;
      }

      chats.push({
        id: doc.id,
        ...chatData,
        otherParticipant: {
          id: otherParticipantId,
          name: otherParticipantData.displayName || "Anonymous",
          email: otherParticipantData.email,
          photoURL: otherParticipantData.profilePicture,
          role: chatData.chatType === "admin-admin" ? "admin" : "client",
          lastSeen: otherParticipantData.lastSeen,
        },
      });
    }

    // Apply sorting
    chats.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (sortOrder === "desc") {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedChats = chats.slice(startIndex, endIndex);

    // Calculate total pages
    const totalChats = chats.length;
    const totalPages = Math.ceil(totalChats / limit);

    res.status(200).json({
      chats: paginatedChats,
      pagination: {
        currentPage: page,
        totalPages,
        totalChats,
        hasMore: endIndex < totalChats,
      },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

// Update admin chat status
exports.updateAdminChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status, priority, category } = req.body;
    const adminId = req.user.uid;

    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.data().participants.includes(adminId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await chatRef.update({
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "Chat updated successfully" });
  } catch (error) {
    console.error("Error updating admin chat:", error);
    res.status(500).json({ error: "Failed to update admin chat" });
  }
};

// Send message in admin chat
exports.sendAdminMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const {
      message,
      type,
      metadata,
      senderId,
      attachments,
      senderName,
      isAdminChat,
      senderRole,
    } = req.body;
    const timestamp = new Date();

    console.log("Debug - Message Request:", {
      chatId,
      senderId,
      senderName,
      isAdminChat,
      senderRole,
    });

    // Verify sender exists and is authorized

    // Get chat details
    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      console.error("Debug - Chat not found:", chatId);
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chat.data();
    console.log("Debug - Chat Data:", {
      participants: chatData.participants,
      chatType: chatData.chatType,
      metadata: chatData.metadata,
    });

    if (!chatData.participants.includes(senderId)) {
      console.error("Debug - Sender not in chat participants:", senderId);
      return res
        .status(403)
        .json({ error: "Unauthorized access to this chat" });
    }

    let senderDoc;
    console.log({ chatData });
    if (chatData.chatType === "admin-admin") {
      senderDoc = await firebaseDb.collection("admins").doc(senderId).get();
    } else {
      if (isAdminChat) {
        senderDoc = await firebaseDb.collection("admins").doc(senderId).get();
      } else {
        senderDoc = await firebaseDb.collection("users").doc(senderId).get();
      }
    }

    if (!senderDoc.exists) {
      console.error("Debug - Sender not found in admins collection:", senderId);
      return res
        .status(403)
        .json({ error: "Unauthorized - Admin access only" });
    }

    // Support different message types
    const validTypes = [
      "text",
      "system",
      "action",
      "note",
      "warning",
      "document",
      "user_action",
    ];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid message type" });
    }

    // Get recipient details based on chat type
    const recipientId = chatData.participants.find((id) => id !== senderId);
    if (!recipientId) {
      console.error(
        "Debug - No recipient found in participants:",
        chatData.participants
      );
      return res
        .status(404)
        .json({ error: "Recipient not found in chat participants" });
    }

    let recipientDoc;

    if (chatData.chatType === "admin-admin") {
      recipientDoc = await firebaseDb
        .collection("admins")
        .doc(recipientId)
        .get();
    } else {
      if (isAdminChat) {
        recipientDoc = await firebaseDb
          .collection("users")
          .doc(recipientId)
          .get();
      } else {
        recipientDoc = await firebaseDb
          .collection("admins")
          .doc(recipientId)
          .get();
      }
    }
    if (!recipientDoc.exists) {
      console.error("Debug - Recipient document not found:", {
        recipientId,
        collection: chatData.chatType === "admin-admin" ? "admins" : "users",
      });
      return res.status(404).json({ error: "Recipient not found" });
    }

    const newMessage = {
      text: message,
      senderId,
      senderName:
        senderName || senderDoc.data().displayName || senderDoc.data().email,
      type: type || "text",
      createdAt: timestamp,
      status: "sent",
      metadata: metadata || {},
      readBy: [senderId],
    };

    // Update chat with new message
    await chatRef.update({
      messages: FieldValue.arrayUnion(newMessage),
      attachments,
      lastMessage: message,
      lastMessageType: type || "text",
      lastMessageSenderId: senderId,
      updatedAt: timestamp,
      "stats.totalMessages": FieldValue.increment(1),
      "stats.lastActivity": timestamp,
      [`unreadCount.${recipientId}`]: FieldValue.increment(1),
    });

    // Emit socket event with recipient type

    if (
      chatData.chatType === "admin-client" ||
      chatData.chatType === "client-admin"
    ) {
      req.app
        .get("io")
        .to(chatId)
        .emit("new-message", {
          chatId,
          message: {
            ...newMessage,
            createdAt: timestamp, // Ensure timestamp is included in socket emission
          },
        });
      req.app
        .get("io")
        .to(`admin-chat-${chatId}`)
        .emit("new-admin-message", {
          chatId,
          message: {
            ...newMessage,
            createdAt: timestamp, // Ensure timestamp is included in socket emission
          },
          chatType: chatData.chatType,
          recipientId,
          recipientType:
            chatData.chatType === "admin-admin" ? "admin" : "client",
        });
    } else if (chatData.chatType === "admin-admin") {
      req.app
        .get("io")
        .to(`admin-chat-${chatId}`)
        .emit("new-admin-message", {
          chatId,
          message: {
            ...newMessage,
            createdAt: timestamp, // Ensure timestamp is included in socket emission
          },
          chatType: chatData.chatType,
          recipientId,
          recipientType:
            chatData.chatType === "admin-admin" ? "admin" : "client",
        });
    }

    res.status(200).json({
      message: "Message sent successfully",
      messageData: {
        ...newMessage,
        createdAt: timestamp, // Ensure timestamp is included in response
      },
    });
  } catch (error) {
    console.error("Error sending admin message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Add message read status tracking
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.uid;
    const timestamp = new Date();

    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chat.data();
    if (!chatData.participants.includes(userId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Update readBy array for each unread message
    const updatedMessages = chatData.messages.map((msg) => {
      if (!msg.readBy.includes(userId)) {
        return {
          ...msg,
          readBy: [...msg.readBy, userId],
        };
      }
      return msg;
    });

    await chatRef.update({
      messages: updatedMessages,
      [`unreadCount.${userId}`]: 0,
      lastReadAt: timestamp,
    });

    // Emit socket event for real-time read status
    req.app.get("io").to(`admin-chat-${chatId}`).emit("messages-read", {
      chatId,
      userId,
      timestamp,
    });

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

// Add chat archiving functionality
exports.archiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const adminId = req.user.uid;
    const timestamp = new Date();

    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.data().participants.includes(adminId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await chatRef.update({
      status: "archived",
      archivedAt: timestamp,
      archivedBy: adminId,
      updatedAt: timestamp,
    });

    // Emit socket event for chat archive
    req.app.get("io").to(`admin-chat-${chatId}`).emit("chat-archived", {
      chatId,
      archivedBy: adminId,
      timestamp,
    });

    res.status(200).json({ message: "Chat archived successfully" });
  } catch (error) {
    console.error("Error archiving chat:", error);
    res.status(500).json({ error: "Failed to archive chat" });
  }
};

// Add user action tracking
exports.logUserAction = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { action, targetUserId, details } = req.body;
    const adminId = req.user.uid;
    const timestamp = new Date();

    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.data().participants.includes(adminId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const actionMessage = {
      text: `Admin action: ${action}`,
      senderId: adminId,
      type: "user_action",
      createdAt: timestamp,
      metadata: {
        action,
        targetUserId,
        details,
        performedBy: adminId,
      },
    };

    await chatRef.update({
      messages: FieldValue.arrayUnion(actionMessage),
      lastAction: action,
      lastActionTimestamp: timestamp,
      updatedAt: timestamp,
    });

    res.status(200).json({
      message: "User action logged successfully",
      actionData: actionMessage,
    });
  } catch (error) {
    console.error("Error logging user action:", error);
    res.status(500).json({ error: "Failed to log user action" });
  }
};

// Get messages for a specific chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.uid;

    // Get chat details
    const chatRef = firebaseDb.collection("adminChats").doc(chatId);
    const chat = await chatRef.get();

    if (!chat.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chat.data();

    // Verify user is a participant
    if (!chatData.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this chat" });
    }

    // Get messages with pagination
    const messages = chatData.messages || [];
    const totalMessages = messages.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Sort messages by createdAt in descending order (newest first)
    const sortedMessages = messages.sort(
      (a, b) => b.createdAt.toDate() - a.createdAt.toDate()
    );

    const paginatedMessages = sortedMessages.slice(startIndex, endIndex);

    // Get participant details
    const participantDetails = await Promise.all(
      chatData.participants.map(async (participantId) => {
        const collection =
          chatData.chatType === "admin-admin" || participantId === userId
            ? "admins"
            : "users";

        const participantDoc = await firebaseDb
          .collection(collection)
          .doc(participantId)
          .get();

        const participantData = participantDoc.data() || {};

        return {
          id: participantId,
          name: participantData.displayName || participantData.email,
          email: participantData.email,
          role: collection === "admins" ? "admin" : "client",
          activeStatus: participantData.activeStatus,
          lastSeen: participantData.lastSeen,
        };
      })
    );

    res.status(200).json({
      messages: paginatedMessages,
      participants: participantDetails,
      chatType: chatData.chatType,
      metadata: chatData.metadata,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: endIndex < totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
};
exports.uploadImage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const updateData = req.body;

    const userId = req.user.uid;
    const files = req.files;
    if (files && files.length > 0) {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();

        const fileName = `chat-attachments/${chatId}/${uuidv4()}.${fileExtension}`;

        // Create a new blob in the bucket
        const blob = firebaseBucket.file(fileName);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        // Handle errors during upload
        await new Promise((resolve, reject) => {
          blobStream.on("error", (error) => {
            reject(error);
          });

          blobStream.on("finish", async () => {
            // Make the file public
            await blob.makePublic();

            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${firebaseBucket.name}/${fileName}`;

            uploadedFiles.push({
              url: publicUrl,
              name: file.originalname,
              type: file.mimetype,
              size: file.size,
              uploadedAt: new Date(),
            });

            resolve();
          });

          blobStream.end(file.buffer);
        });
      }

      // Add uploaded files to project data
      if (!updateData.files) {
        updateData.files = [];
      }
      updateData.files = [...updateData.files, ...uploadedFiles];
    }

    res.status(200).json({
      message: "Images updated successfully",
      updatedFiles: updateData.files,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ error: "Failed to update image" });
  }
};
