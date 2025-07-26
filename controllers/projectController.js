const { firebaseDb, firebaseBucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

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
      inPlatform,
      link,
    } = req.body;

    // Validate required fields
    if (inPlatform) {
      if (
        !title ||
        !description ||
        !budget ||
        !deadline ||
        !clientId ||
        !category ||
        !chatId
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }
    } else {
      if (!title || !description || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }
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
      status: !inPlatform ? "approved" : "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      milestones: [],
      deliverables: [],
      reviews: {
        client: null,
        freelancer: null,
      },
      transactionId: null,
      paymentStatus: "pending",
      chatId: chatId || "",
      payments: [],
      link: link || "",
      inPlatform: inPlatform,
    };

    const projectRef = await firebaseDb.collection("projects").add(newProject);

    if (freelancerId) {
      const escrowAccount = {
        projectId: projectRef.id,
        clientId,
        freelancerId,
        amount: budget,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: [],
      };

      const escrowRef = await firebaseDb
        .collection("escrow")
        .add(escrowAccount);
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
    console.log({ clientId });

    // Apply filters if provided
    if (status) query = query.where("status", "==", status);
    if (category) query = query.where("category", "==", category);
    if (clientId) query = query.where("clientId", "==", clientId);
    if (freelancerId) query = query.where("freelancerId", "==", freelancerId);

    const snapshot = await query.get();
    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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
    const projectDoc = await firebaseDb
      .collection("projects")
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({
      project: {
        id: projectDoc.id,
        ...projectDoc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};
exports.getClientProjects = async (req, res) => {
  try {
    const { clientId } = req.params;
    const projectsSnapshot = await firebaseDb
      .collection("projects")
      .where("clientId", "==", clientId)
      .get();
    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    const userId = req.user.uid;
    const files = req.files;

    const projectDoc = await firebaseDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();

    if (
      project.inPlatform &&
      project.clientId !== userId &&
      project.freelancerId !== userId
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this project" });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.clientId;
    delete updateData.reviews;
    delete updateData.transactionId;
    delete updateData.payments;

    // Handle file uploads if any
    if (files && files.length > 0) {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `projects/${projectId}/${uuidv4()}.${fileExtension}`;

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

    await firebaseDb
      .collection("projects")
      .doc(projectId)
      .update({
        ...updateData,
        updatedAt: new Date(),
      });

    res.status(200).json({
      message: "Project updated successfully",
      projectId,
      updatedFiles: updateData.files,
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
    const projectDoc = await firebaseDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();

    // Only allow client to delete their own projects
    if (project.clientId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this project" });
    }

    // Check if project can be deleted (e.g., not already active)
    if (project.status !== "pending") {
      return res.status(400).json({
        error: "Cannot delete project that is already active or completed",
      });
    }

    await firebaseDb.collection("projects").doc(projectId).delete();

    res.status(200).json({
      message: "Project deleted successfully",
      projectId,
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
      updatedAt: new Date(),
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
        error: "Can only review completed projects",
      });
    }

    const review = {
      rating,
      comment,
      userId,
      createdAt: new Date(),
    };

    await projectRef.update({
      [`reviews.${reviewerType}`]: review,
      updatedAt: new Date(),
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
      return res
        .status(404)
        .json({ message: "No project found for this chat" });
    }

    const projectDoc = projectsSnapshot.docs[0];
    const project = {
      id: projectDoc.id,
      ...projectDoc.data(),
    };

    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project by chat ID:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Add this function to projectController.js
exports.getProjectCountsByStatus = async (req, res) => {
  try {
    const projectsSnapshot = await firebaseDb.collection("projects").get();

    let counts = {
      pending: 0,
      rejected: 0,
      completed: 0,
    };

    projectsSnapshot.forEach((doc) => {
      const projectData = doc.data();
      const status = projectData.status;

      if (status === "pending") counts.pending++;
      if (status === "rejected") counts.rejected++;
      if (status === "completed") counts.completed++;
    });

    res.status(200).json(counts);
  } catch (error) {
    console.error("Error fetching project counts by status:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching project counts" });
  }
};

exports.addProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    const userId = req.user.uid;
    const files = req.files;

    const projectDoc = await firebaseDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();

    if (project.clientId !== userId && project.freelancerId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this project" });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.clientId;
    delete updateData.reviews;
    delete updateData.transactionId;
    delete updateData.payments;

    // Handle file uploads if any
    if (files && files.length > 0) {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `projects/${projectId}/${uuidv4()}.${fileExtension}`;

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
      if (!updateData.docs) {
        if (!project.docs) {
          updateData.docs = [];
        } else {
          updateData.docs = [...project.docs];
        }
      }
      updateData.docs = [...updateData.docs, ...uploadedFiles];
    }

    await firebaseDb
      .collection("projects")
      .doc(projectId)
      .update({
        ...updateData,
        updatedAt: new Date(),
      });

    res.status(200).json({
      message: "Project updated successfully",
      projectId,
      updatedDocs: updateData.docs,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

exports.uploadProjectPicture = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;
    const files = req.files;

    const projectDoc = await firebaseDb
      .collection("projects")
      .doc(projectId)
      .get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    let project = projectDoc.data();

    if (project.clientId !== userId && project.freelancerId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this project" });
    }

    // Handle file uploads if any
    if (files && files.length > 0) {
      const uploadedFiles = [];

      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `projects/${projectId}/${projectId}.${fileExtension}`;

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

            project.projectPicture = publicUrl;
            resolve();
          });

          blobStream.end(file.buffer);
        });
      }
    }

    await firebaseDb
      .collection("projects")
      .doc(projectId)
      .update({
        ...project,
        updatedAt: new Date(),
      });

    res.status(200).json({
      message: "Project updated successfully",
      projectId,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};
