const { firebaseDb } = require("../config/firebase");
const moment = require("moment");

// Get all users with the "freelancer" role
exports.getFreelancers = async (req, res) => {
  try {
    // Query Firestore for users with the role "freelancer"
    const freelancersSnapshot = await firebaseDb
      .collection("users")
      .where("roles", "array-contains", "freelancer")
      .get();

    if (freelancersSnapshot.empty) {
      return res.status(404).json({ message: "No freelancers found" });
    }

    // Map the results into an array of user objects
    const freelancers = freelancersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ freelancers });
  } catch (error) {
    console.error("Error fetching freelancers:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching freelancers" });
  }
};

// Get freelancers and their associated projects
exports.getFreelancerProjects = async (req, res) => {
  try {
    // Step 1: Get all freelancers
    const freelancersSnapshot = await firebaseDb
      .collection("users")
      .where("roles", "array-contains", "freelancer")
      .get();

    if (freelancersSnapshot.empty) {
      return res.status(404).json({ message: "No freelancers found" });
    }

    // Step 2: Extract freelancer IDs
    const freelancers = freelancersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const freelancerIds = freelancers.map((f) => f.id);

    // Step 3: Get projects where freelancerId matches any of the freelancer IDs
    const projectsSnapshot = await firebaseDb
      .collection("projects")
      .where("freelancerId", "in", freelancerIds)
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Step 4: Attach projects to respective freelancers
    const result = freelancers.map((freelancer) => ({
      ...freelancer,
      projects: projects.filter(
        (project) => project.freelancerId === freelancer.id
      ),
    }));

    res.status(200).json({ freelancers: result });
  } catch (error) {
    console.error("Error fetching freelancer projects:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching freelancer projects" });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projectsSnapshot = await firebaseDb.collection("projects").get();

    if (projectsSnapshot.empty) {
      return res.status(404).json({ message: "No projects found" });
    }

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching projects" });
  }
};

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
