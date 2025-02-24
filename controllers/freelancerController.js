const { firebaseDb } = require("../config/firebase");

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
