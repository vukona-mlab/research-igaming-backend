const {
  firebaseDb,
  firebaseStorage,
  firebaseAuth,
  FieldValue,
} = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

// Create or update chat with messages

exports.createChat = async (req, res) => {
  try {
    const { freelancerId, clientId, message } = req.body;
    const senderId = req.user ? req.user.uid : "UNKNOWN_USER"; // Add fallback for missing senderId

    if (!freelancerId || !clientId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if a chat exists between the freelancer and the client
    const chatQuery = await firebaseDb
      .collection("chats")
      .where("participants", "array-contains", freelancerId)
      .get();

    let chatDoc = null;

    chatQuery.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(clientId)) {
        chatDoc = doc;
      }
    });

    if (chatDoc) {
      // Chat exists, update messages
      await firebaseDb
        .collection("chats")
        .doc(chatDoc.id)
        .update({
          messages: FieldValue.arrayUnion({
            senderId: senderId, // Ensure this is never undefined
            message: message,
            timestamp: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        });

      return res
        .status(200)
        .json({ chatId: chatDoc.uid, message: "Message sent" });
    } else {
      // Create new chat
      const newChat = await firebaseDb.collection("chats").add({
        participants: [freelancerId, clientId],
        messages: [
          {
            senderId,
            message,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        chatId: newChat.uid,
        message: "Chat created and message sent",
      });
    }
  } catch (error) {
    console.error("Error creating/updating chat:", error);
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

// Send a chat message with an image
exports.sendChatImage = async (req, res) => {
  try {
    const { freelancerId, clientId } = req.body;
    const senderId = req.user ? req.user.id : null; // Extract senderId from authenticated user

    if (!freelancerId || !clientId || !req.file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageFile = req.file;
    const fileName = `chats/${uuidv4()}_${imageFile.originalname}`;
    const storageRef = firebaseStorage.bucket().file(fileName);

    // Upload the image to Firebase Storage
    await storageRef.save(imageFile.buffer, {
      metadata: { contentType: imageFile.mimetype },
    });

    // Get the public URL of the uploaded image
    const imageUrl = `https://storage.googleapis.com/${
      firebaseStorage.bucket().name
    }/${fileName}`;

    // Check if a chat already exists between the freelancer and the client
    const chatQuery = await firebaseDb
      .collection("chats")
      .where("participants", "array-contains", freelancerId)
      .get();

    let chatDoc = null;

    chatQuery.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(clientId)) {
        chatDoc = doc;
      }
    });

    if (chatDoc) {
      // Chat exists, update messages
      await firebaseDb
        .collection("chats")
        .doc(chatDoc.id)
        .update({
          messages: firebaseDb.FieldValue.arrayUnion({
            senderId,
            imageUrl,
            timestamp: moment().format("ddd, h:mm A"),
          }),
          updatedAt: new Date(),
        });

      return res
        .status(200)
        .json({ chatId: chatDoc.id, message: "Image sent" });
    } else {
      // Create new chat with the image
      const newChat = await firebaseDb.collection("chats").add({
        participants: [freelancerId, clientId],
        messages: [
          {
            senderId: senderId,
            imageUrl,
            timestamp: moment().format("ddd, h:mm A"),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res
        .status(201)
        .json({ chatId: newChat.id, message: "Chat created with image" });
    }
  } catch (error) {
    console.error("Error sending chat image:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the image" });
  }
};

/// Send a chat message with an attachment
exports.sendChatAttachment = async (req, res) => {
  try {
    const { freelancerId, clientId } = req.body;
    const senderId = req.user ? req.user.id : null; // Extract senderId from authenticated user

    if (!freelancerId || !clientId || !req.file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attachmentFile = req.file;
    const fileName = `attachments/${uuidv4()}_${attachmentFile.originalname}`;
    const storageRef = firebaseStorage.bucket().file(fileName);

    // Upload the attachment to Firebase Storage
    await storageRef.save(attachmentFile.buffer, {
      metadata: { contentType: attachmentFile.mimetype },
    });

    // Get the public URL of the uploaded attachment
    const attachmentUrl = `https://storage.googleapis.com/${
      firebaseStorage.bucket().name
    }/${fileName}`;

    // Check if a chat already exists between the freelancer and the client
    const chatQuery = await firebaseDb
      .collection("chats")
      .where("participants", "array-contains", freelancerId)
      .get();

    let chatDoc = null;

    chatQuery.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(clientId)) {
        chatDoc = doc;
      }
    });

    if (chatDoc) {
      // Chat exists, update messages with the attachment
      await firebaseDb
        .collection("chats")
        .doc(chatDoc.id)
        .update({
          messages: firebaseDb.FieldValue.arrayUnion({
            senderId,
            attachmentUrl,
            fileName: attachmentFile.originalname,
            timestamp: moment().format("ddd, h:mm A"),
          }),
          updatedAt: new Date(),
        });

      return res
        .status(200)
        .json({ chatId: chatDoc.id, message: "Attachment sent" });
    } else {
      // Create new chat with the attachment
      const newChat = await firebaseDb.collection("chats").add({
        participants: [freelancerId, clientId],
        messages: [
          {
            senderId,
            attachmentUrl,
            fileName: attachmentFile.originalname,
            timestamp: moment().format("ddd, h:mm A"),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res
        .status(201)
        .json({ chatId: newChat.id, message: "Chat created with attachment" });
    }
  } catch (error) {
    console.error("Error sending chat attachment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the attachment" });
  }
};
