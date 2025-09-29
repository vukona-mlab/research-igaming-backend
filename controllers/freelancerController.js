const { firebaseDb } = require("../config/firebase");

exports.getFreelancer = async (req, res) => {
  const { freelancerId } = req.params;
  console.log({ freelancerId });
  try {
    const query = firebaseDb.collection("users").doc(freelancerId);

    const freelancer = (await query.get()).data();
    res.status(200).json({ freelancer });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users with the "freelancer" role and support pagination
exports.getFreelancers = async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 30;
    const page = parseInt(req.query.page) || 1;
    const { search } = req.query;

    let query = firebaseDb
      .collection("users")
      .where("roles", "array-contains", "freelancer");

    // Pagination setup
    let freelancersSnapshot;

    if (page === 1) {
      freelancersSnapshot = await query.get();
    } else {
      // Firestore pagination using startAfter
      const lastVisibleDoc = await query
        .orderBy("displayName") // orderBy required for startAfter
        .limit(pageSize * (page - 1))
        .get();

      const lastDoc = lastVisibleDoc.docs[lastVisibleDoc.docs.length - 1];
      query = query.orderBy("displayName").startAfter(lastDoc);
      freelancersSnapshot = await query.limit(pageSize).get();
    }

    if (freelancersSnapshot.empty) {
      return res.status(404).json({ message: "No freelancers found" });
    }

    let freelancers = freelancersSnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
    }));

    // Apply keyword search filter
    if (search && search.trim() !== "") {
      const lowerSearch = search.toLowerCase();
      freelancers = freelancers.filter((f) => {
        return (
          f.displayName?.toLowerCase().includes(lowerSearch) ||
          f.jobTitle?.toLowerCase().includes(lowerSearch) ||
          f.skills?.some((skill) => skill.toLowerCase().includes(lowerSearch))
        );
      });
    }

    // Slice to pageSize in case keyword filtering reduced the results
    freelancers = freelancers.slice(0, pageSize);

    res.status(200).json({ freelancers, totalCount: freelancers.length });
  } catch (error) {
    console.error("Error fetching freelancers:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching freelancers" });
  }
};

exports.getFreelancerProjects = async (req, res) => {
  console.log("in freelancer projects");

  const { freelancerId } = req.params;
  console.log({ freelancerId });

  const query = firebaseDb
    .collection("projects")
    .where("freelancerId", "==", freelancerId);

  const result = await query.get();
  const freelancerProjects = result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    uid: doc.id,
  }));
  res.status(200).json({ projects: freelancerProjects });
};
// Get freelancers and their associated projects with pagination
exports.getFreelancersProjects = async (req, res) => {
  console.log("n freelancers projects");

  const { freelancerId } = req.params;
  console.log({ freelancerId });

  try {
    // Get the page number and page size from query parameters (default pageSize to 30)
    const pageSize = parseInt(req.query.pageSize) || 30;
    const page = parseInt(req.query.page) || 1;

    // Step 1: Get all freelancers with pagination
    let query = firebaseDb
      .collection("users")
      .where("roles", "array-contains", "freelancer")
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

    const freelancersSnapshot = await query.get();

    if (freelancersSnapshot.empty) {
      return res.status(404).json({ message: "No freelancers found" });
    }

    // Step 2: Extract freelancer data and ensure uid is included
    const freelancers = freelancersSnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.id,
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
    console.error("Error fetching freelancers and their projects:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching freelancers" });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  const { freelancerId, clientId } = req.params;
  console.log({ freelancerId, clientId });
  console.log("getting projects");

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
