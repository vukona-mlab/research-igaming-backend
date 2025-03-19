const { firebaseDb } = require("../config/firebase");

// Get all users with the "freelancer" role
exports.getClients = async (req, res) => {
  try {
    const clientsSnapshot = await firebaseDb
      .collection("users")
      .where("roles", "array-contains", "client")
      .get();

    if (clientsSnapshot.empty) {
      return res.status(404).json({ message: "No clients found" });
    }

    // Map the results into an array of user objects
    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching clients" });
  }
};

// Get clients and their associated projects
exports.getClientProjects = async (req, res) => {
  try {
    // Step 1: Get all clients
    const clientsSnapshot = await firebaseDb
      .collection("users")
      .where("roles", "array-contains", "client")
      .get();

    if (clientsSnapshot.empty) {
      return res.status(404).json({ message: "No clients found" });
    }

    // Step 2: Extract client data
    const clients = clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
    }));
    const clientIds = clients.map((c) => c.id);

    // Step 3: Get projects where clientId matches any of the client IDs
    const projectsSnapshot = await firebaseDb
      .collection("projects")
      .where("clientId", "in", clientIds)
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Step 4: Attach projects to respective clients
    const result = clients.map((client) => ({
      ...client,
      uid: client.id,
      projects: projects.filter(
        (project) => project.clientId === client.id
      ),
    }));

    res.status(200).json({ clients: result });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching clients" });
  }
};
