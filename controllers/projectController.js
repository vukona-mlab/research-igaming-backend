const { firebaseDb } = require("../config/firebase");

// Create Project
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      clientId,
      freelancerId,
      category,
      requirements,
      chatId,
    } = req.body;

    // Validate required fields
    if (!title || !description || !budget || !deadline || !clientId || !category || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newProject = {
      title,
      description,
      budget,
      deadline,
      clientId,
      freelancerId: freelancerId || null,
      category,
      requirements: requirements || [],
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      milestones: [],
      deliverables: [],
      reviews: {
        client: null,
        freelancer: null,
      },
      transactionId: null,
      paymentStatus: 'pending',
      chatId,
      payments: [],
    };

    const projectRef = await firebaseDb.collection("projects").add(newProject);

    if (freelancerId) {
      const escrowAccount = {
        projectId: projectRef.id,
        clientId,
        freelancerId,
        amount: budget,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: []
      };

      const escrowRef = await firebaseDb.collection("escrow").add(escrowAccount);
      await projectRef.update({ transactionId: escrowRef.id });
      newProject.transactionId = escrowRef.id;
    }

    res.status(201).json({
      message: "Project created successfully",
      project: { id: projectRef.id, ...newProject },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Read - Get All Projects (with optional filters)
exports.getAllProjects = async (req, res) => {
  try {
    const { status, category, clientId, freelancerId } = req.query;
    let query = firebaseDb.collection("projects");

    // Apply filters if provided
    if (status) query = query.where("status", "==", status);
    if (category) query = query.where("category", "==", category);
    if (clientId) query = query.where("clientId", "==", clientId);
    if (freelancerId) query = query.where("freelancerId", "==", freelancerId);

    const snapshot = await query.get();
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Read - Get Single Project
exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDoc = await firebaseDb.collection("projects").doc(projectId).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ 
      project: { 
        id: projectDoc.id, 
        ...projectDoc.data() 
      } 
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    const userId = req.user.uid;

    const projectDoc = await firebaseDb.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();

    if (project.clientId !== userId && project.freelancerId !== userId) {
      return res.status(403).json({ error: "Unauthorized to update this project" });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.clientId;
    delete updateData.reviews;
    delete updateData.transactionId;
    delete updateData.payments;

    await firebaseDb.collection("projects").doc(projectId).update({
      ...updateData,
      updatedAt: new Date()
    });

    res.status(200).json({ 
      message: "Project updated successfully",
      projectId
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;

    // Get project data
    const projectDoc = await firebaseDb.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();

    // Only allow client to delete their own projects
    if (project.clientId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this project" });
    }

    // Check if project can be deleted (e.g., not already active)
    if (project.status !== "pending") {
      return res.status(400).json({ 
        error: "Cannot delete project that is already active or completed" 
      });
    }

    await firebaseDb.collection("projects").doc(projectId).delete();

    res.status(200).json({ 
      message: "Project deleted successfully",
      projectId 
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

// Update Project Status
exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate that status is one of the allowed values
    const allowedStatuses = ["pending", "approved", "rejected", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const projectRef = firebaseDb.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    await projectRef.update({
      status,
      updatedAt: new Date()
    });

    res.status(200).json({ message: "Project status updated successfully" });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ error: "Failed to update project status" });
  }
};

// Add Review
exports.addReview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rating, comment, reviewerType } = req.body;
    const userId = req.user.uid;

    if (!["client", "freelancer"].includes(reviewerType)) {
      return res.status(400).json({ error: "Invalid reviewer type" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const projectRef = firebaseDb.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();
    
    // Verify user has permission and project is completed
    if (
      (reviewerType === "client" && project.clientId !== userId) ||
      (reviewerType === "freelancer" && project.freelancerId !== userId)
    ) {
      return res.status(403).json({ error: "Unauthorized to add review" });
    }

    if (project.status !== "completed") {
      return res.status(400).json({ 
        error: "Can only review completed projects" 
      });
    }

    const review = {
      rating,
      comment,
      userId,
      createdAt: new Date()
    };

    await projectRef.update({
      [`reviews.${reviewerType}`]: review,
      updatedAt: new Date()
    });

    res.status(200).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
};

// Add this new endpoint to get project by chat ID
exports.getProjectByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Query projects collection for a project with matching chatId
    const projectsSnapshot = await firebaseDb
      .collection("projects")
      .where("chatId", "==", chatId)
      .limit(1)
      .get();

    if (projectsSnapshot.empty) {
      return res.status(404).json({ message: "No project found for this chat" });
    }

    const projectDoc = projectsSnapshot.docs[0];
    const project = {
      id: projectDoc.id,
      ...projectDoc.data()
    };

    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project by chat ID:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
}; 