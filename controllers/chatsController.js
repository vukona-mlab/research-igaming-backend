const { firebaseDb, firebaseBucket } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const { sendNewMessageNotification } = require("../utils/notification-util");

// Create or update chat with messages
exports.createChat = async (req, res) => {
  try {
    const { freelancerId, clientId, senderId, message } = req.body;
    const timestamp = new Date();

    if (!freelancerId || !clientId || !senderId) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    if (freelancerId == clientId) {
      return res.status(400).json({
        error: "Cannot send message to yourself.",
      });
    }
    // Check if chat exists
    const existingChats = await firebaseDb
      .collection("chats")
      .where("participants", "array-contains", freelancerId)
      .get();

    let existingChat = null;
    existingChats.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(clientId)) {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) {
      return res.status(200).json({
        chatId: existingChat.id,
        message: "Existing chat found",
      });
    }

    // Create new chat with messages array
    const newChat = await firebaseDb.collection("chats").add({
      participants: [freelancerId, clientId],
      messages: [
        {
          id: Date.now().toString(),
          text: message || "Chat started",
          senderId: senderId,
          createdAt: timestamp,
          type: "text",
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessage: message || "Chat started",
    });
    if(freelancerId) {
      setImmediate(() => {
        sendNewMessageNotification(freelancerId)
      })
    }

    return res.status(201).json({
      chatId: newChat.id,
      message: "Chat created successfully",
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chat" });
  }
};

//Delete chat BY chatId
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.uid; // Assuming the user is authenticated with passport

    // Reference to the chat document in Firestore
    const chatRef = firebaseDb.collection("chats").doc(chatId);

    // Check if the chat exists
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if the user is part of the chat (either freelancer or client)
    const chatData = chatDoc.data();
    console.log({ userId, chatData });
    if (!chatData.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this chat" });
    }

    // Delete the chat document
    await chatRef.delete();

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the chat" });
  }
};

// View messages for a specific chat by chatId
exports.viewMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Reference to the chat document in Firestore
    const chatRef = firebaseDb.collection("chats").doc(chatId);

    // Fetch the chat document
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Get the messages from the chat document
    const chatData = chatDoc.data();
    const messages = chatData.messages || [];

    // Return the messages
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error viewing messages:", error);
    res.status(500).json({ error: "An error occurred while viewing messages" });
  }
};

// Add this new method to get user chats
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log("Fetching chats for user:", userId);

    const chatsSnapshot = await firebaseDb
      .collection("chats")
      .where("participants", "array-contains", userId)
      .get();
    const adminChats = await firebaseDb
      .collection("adminChats")
      .where("participants", "array-contains", userId)
      .get();

    if (chatsSnapshot.empty && adminChats.empty) {
      return res.status(200).json({ chats: [] });
    }

    const chats = [];
    if (!chatsSnapshot.empty) {
      for (const doc of chatsSnapshot.docs) {
        const chatData = doc.data();
        const otherParticipantId = chatData.participants.find(
          (id) => id !== userId
        );

        // Get other participant's data
        const userDoc = await firebaseDb
          .collection("users")
          .doc(otherParticipantId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const lastMessageTimestamp =
            chatData.lastMessageTimestamp ||
            chatData.updatedAt ||
            chatData.createdAt;

          chats.push({
            id: doc.id,
            ...chatData,
            participants: [
              {
                uid: userId,
              },
              {
                uid: otherParticipantId,
                name: userData.displayName || "Anonymous",
                photoURL: userData.profilePicture || null,
                email: userData.email,
                activeStatus: userData.activeStatus || false,
                lastSeen: userData.lastSeen || new Date(),
              },
            ],
            lastMessage: chatData.lastMessage || "",
            updatedAt: lastMessageTimestamp,
            timestamp:
              lastMessageTimestamp?._seconds ||
              Math.floor(lastMessageTimestamp?.getTime() / 1000) ||
              Math.floor(Date.now() / 1000),
          });
        }
      }
    }
    if (!adminChats.empty) {
      for (const doc of adminChats.docs) {
        const chatData = doc.data();
        const otherParticipantId = chatData.participants.find(
          (id) => id !== userId
        );

        // Get other participant's data
        const userDoc = await firebaseDb
          .collection("admins")
          .doc(otherParticipantId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const lastMessageTimestamp =
            chatData.lastMessageTimestamp ||
            chatData.updatedAt ||
            chatData.createdAt;

          chats.push({
            id: doc.id,
            ...chatData,
            participants: [
              {
                uid: userId,
              },
              {
                uid: otherParticipantId,
                name: userData.displayName || "Anonymous",
                photoURL: userData.profilePicture || null,
                email: userData.email,
                activeStatus: userData.activeStatus || false,
                lastSeen: userData.lastSeen || new Date(),
              },
            ],
            lastMessage: chatData.lastMessage || "",
            updatedAt: lastMessageTimestamp,
            timestamp:
              lastMessageTimestamp?._seconds ||
              Math.floor(lastMessageTimestamp?.getTime() / 1000) ||
              Math.floor(Date.now() / 1000),
          });
        }
      }
    }
    // Sort chats by updatedAt timestamp
    chats.sort((a, b) => {
      const timestampA = a.timestamp;
      const timestampB = b.timestamp;
      return timestampB - timestampA;
    });

    res.status(200).json({ chats });
  } catch (error) {
    console.error("Error getting user chats:", error);
    res.status(500).json({ error: "An error occurred while fetching chats" });
  }
};

// Add this new method for sending messages
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, senderId, attachments, type, meetingDetails } = req.body;
    const timestamp = new Date();

    // Get the chat document
    const chatRef = firebaseDb.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify sender is a participant
    const chatData = chatDoc.data();
    const [recipientId] = chatData.participants.filter(id => id !== senderId)
    console.log({ recipientId });
    if (recipientId) {
      setImmediate(() => {
        sendNewMessageNotification(recipientId)
      })
    }



    if (!chatData.participants.includes(senderId)) {
      return res
        .status(403)
        .json({ error: "User is not a participant in this chat" });
    }

    // Create new message object based on type
    const newMessage = {
      text: message,
      senderId,
      createdAt: timestamp,
      type: type || "text",
      attachments: attachments || [],
    };

    console.log({ newMessage });

    // Add meeting details if it's a zoom meeting message
    if (type === "zoom-meeting" && meetingDetails) {
      newMessage.meetingDetails = meetingDetails;
    }

    // Update the chat document with server timestamp
    await chatRef.update({
      messages: [...chatData.messages, newMessage],
      lastMessage: message,
      updatedAt: timestamp,
      lastMessageTimestamp: timestamp, // Add explicit timestamp for last message
    });

    // Emit socket event for real-time updates
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

    res.status(200).json({
      message: "Message sent successfully",
      messageData: {
        ...newMessage,
        createdAt: timestamp, // Ensure timestamp is included in response
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the message" });
  }
};
exports.uploadImage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const updateData = req.body;

    const userId = req.user.uid;
    const files = req.files;
    console.log("KDJS", { files });
    if (files && files.length > 0) {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();

        const fileName = `chat-attachments/${chatId}/${uuidv4()}.${fileExtension}`;

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
// Add this new method to get a single chat
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.uid;

    const chatRef = firebaseDb.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chatData = chatDoc.data();

    // Verify user is a participant
    if (!chatData.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "User is not a participant in this chat" });
    }

    // Get other participant's data
    const otherParticipantId = chatData.participants.find(
      (id) => id !== userId
    );
    const userDoc = await firebaseDb
      .collection("users")
      .doc(otherParticipantId)
      .get();

    const chat = {
      id: chatDoc.id,
      ...chatData,
      participants: [
        { uid: userId },
        {
          uid: otherParticipantId,
          name: userDoc.data()?.displayName || "Anonymous",
          photoURL: userDoc.data()?.profilePicture || null,
          email: userDoc.data()?.email,
        },
      ],
    };

    res.status(200).json({ chat });
  } catch (error) {
    console.error("Error getting chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the chat" });
  }
};
