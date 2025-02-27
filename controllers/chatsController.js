const { firebaseDb } = require("../config/firebase");

// Create or update chat with messages
exports.createChat = async (req, res) => {
  try {
    const { freelancerId, clientId, senderId, message } = req.body;

    if (!freelancerId || !clientId || !senderId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
            message,
            timestamp: moment().format("ddd, h:mm A"),
          }),
          updatedAt: new Date(),
        });

      return res
        .status(200)
        .json({ chatId: chatDoc.id, message: "Message sent" });
    } else {
      // Create new chat
      const newChat = await firebaseDb.collection("chats").add({
        participants: [freelancerId, clientId],
        messages: [
          {
            senderId,
            message,
            timestamp: moment().format("ddd, h:mm A"),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res
        .status(201)
        .json({ chatId: newChat.id, message: "Chat created and message sent" });
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
    const userId = req.user.id; // Assuming the user is authenticated with passport

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
