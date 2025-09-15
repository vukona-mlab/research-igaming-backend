const { firebaseDb } = require("../config/firebase");

// Get all users with the "client" role and support pagination
exports.getClients = async (req, res) => {
  try {
    // Get the page number and page size from query parameters (default pageSize to 30)
    const pageSize = parseInt(req.query.pageSize) || 30;
    const page = parseInt(req.query.page) || 1;

    // Calculate the starting point for the query
    let query = firebaseDb
      .collection("users")
      .where("roles", "array-contains", "client")
      .limit(pageSize);

    // If it's not the first page, fetch the last document of the previous page
    if (page > 1) {
      const lastVisibleDoc = await firebaseDb
        .collection("users")
        .orderBy("name") // Ensure you order by a field (for consistency)
        .limit(pageSize)
        .startAfter(pageSize * (page - 1) - 1) // Calculate where to start the next page
        .get();

      const lastDoc = lastVisibleDoc.docs[lastVisibleDoc.docs.length - 1];
      query = query.startAfter(lastDoc); // Start after the last document from the previous page
    }

    const clientsSnapshot = await query.get();

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
    res.status(500).json({ error: "An error occurred while fetching clients" });
  }
};

// Get clients and their associated projects with pagination
exports.getClientProjects = async (req, res) => {
  try {
    // Get the page number and page size from query parameters (default pageSize to 30)
    const pageSize = parseInt(req.query.pageSize) || 30;
    const page = parseInt(req.query.page) || 1;

    // Step 1: Get all clients with pagination
    let query = firebaseDb
      .collection("users")
      .where("roles", "array-contains", "client")
      .limit(pageSize);

    // If it's not the first page, fetch the last document of the previous page
    if (page > 1) {
      const lastVisibleDoc = await firebaseDb
        .collection("users")
        .orderBy("name") // Ensure you order by a field (for consistency)
        .limit(pageSize)
        .startAfter(pageSize * (page - 1) - 1) // Calculate where to start the next page
        .get();

      const lastDoc = lastVisibleDoc.docs[lastVisibleDoc.docs.length - 1];
      query = query.startAfter(lastDoc); // Start after the last document from the previous page
    }

    const clientsSnapshot = await query.get();

    if (clientsSnapshot.empty) {
      return res.status(404).json({ message: "No clients found" });
    }

    // Step 2: Extract client data and ensure uid is included
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
      projects: projects.filter((project) => project.clientId === client.id),
    }));

    res.status(200).json({ clients: result });
  } catch (error) {
    console.error("Error fetching clients and their projects:", error);
    res.status(500).json({ error: "An error occurred while fetching clients" });
  }
};
