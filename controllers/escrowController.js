const { firebaseDb } = require("../config/firebase");
const { FieldValue } = require('firebase-admin/firestore');
const paymentController = require('../controllers/paymentController');

exports.createEscrowAccount = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.uid;

    // Get project details
    const projectDoc = await firebaseDb.collection("projects").doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectDoc.data();
    
    // Verify user is the client
    if (project.clientId !== userId) {
      return res.status(403).json({ error: "Only project client can create escrow" });
    }

    // Create escrow account
    const escrowAccount = {
      projectId,
      clientId: project.clientId,
      freelancerId: project.freelancerId,
      amount: project.budget,
      status: 'pending', // pending, funded, released, refunded
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: []
    };

    const escrowRef = await firebaseDb.collection("escrow").add(escrowAccount);

    // Update project with escrow reference
    await projectDoc.ref.update({
      escrowId: escrowRef.id,
      updatedAt: new Date()
    });

    res.status(201).json({
      message: "Escrow account created successfully",
      escrowId: escrowRef.id
    });
  } catch (error) {
    console.error("Error creating escrow account:", error);
    res.status(500).json({ error: "Failed to create escrow account" });
  }
};

exports.fundEscrow = async (req, res) => {
  try {
    const { cardId } = req.body;
    const { escrowId } = req.params;  // Get from URL params instead of body
    const userId = req.user.uid;

    console.log('Funding escrow:', { escrowId, cardId, userId }); // Debug log

    // Validate escrowId
    if (!escrowId) {
      return res.status(400).json({ error: "Escrow ID is required" });
    }

    // Get escrow details
    const escrowDoc = await firebaseDb.collection("escrow").doc(escrowId).get();
    
    if (!escrowDoc.exists) {
      return res.status(404).json({ error: "Escrow account not found" });
    }

    const escrow = escrowDoc.data();
    if (escrow.clientId !== userId) {
      return res.status(403).json({ error: "Unauthorized to fund this escrow" });
    }

    if (escrow.status !== 'pending') {
      return res.status(400).json({ error: "Escrow is not in pending state" });
    }

    // Get project details for payment description
    const projectDoc = await firebaseDb.collection("projects").doc(escrow.projectId).get();
    const project = projectDoc.data();

    // Create payment order using existing payment controller
    const paymentData = {
      amount: escrow.amount,
      cardId,
      projectId: escrow.projectId,
      freelancerId: escrow.freelancerId,
      escrowId: escrowId
    };

    // Forward to payment controller
    req.body = paymentData;
    return paymentController.createOrder(req, res);

  } catch (error) {
    console.error("Error funding escrow:", error);
    res.status(500).json({ error: "Failed to fund escrow" });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const userId = req.user.uid;

    const escrowDoc = await firebaseDb.collection("escrow").doc(escrowId).get();
    if (!escrowDoc.exists) {
      return res.status(404).json({ error: "Escrow account not found" });
    }

    const escrow = escrowDoc.data();
    if (escrow.clientId !== userId) {
      return res.status(403).json({ error: "Unauthorized to release this escrow" });
    }

    if (escrow.status !== 'funded') {
      return res.status(400).json({ error: "Escrow must be funded before release" });
    }

    // Update escrow status
    await escrowDoc.ref.update({
      status: 'released',
      updatedAt: new Date(),
      transactions: FieldValue.arrayUnion({
        type: 'release',
        amount: escrow.amount,
        timestamp: new Date()
      })
    });

    // Update project status
    await firebaseDb.collection("projects").doc(escrow.projectId).update({
      status: 'completed',
      updatedAt: new Date()
    });

    res.status(200).json({ message: "Escrow released successfully" });
  } catch (error) {
    console.error("Error releasing escrow:", error);
    res.status(500).json({ error: "Failed to release escrow" });
  }
};

exports.getEscrowDetails = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const userId = req.user.uid;

    const escrowDoc = await firebaseDb.collection("escrow").doc(escrowId).get();
    if (!escrowDoc.exists) {
      return res.status(404).json({ error: "Escrow account not found" });
    }

    const escrow = escrowDoc.data();
    if (escrow.clientId !== userId && escrow.freelancerId !== userId) {
      return res.status(403).json({ error: "Unauthorized to view this escrow" });
    }

    res.status(200).json({ escrow: { id: escrowDoc.id, ...escrow } });
  } catch (error) {
    console.error("Error getting escrow details:", error);
    res.status(500).json({ error: "Failed to get escrow details" });
  }
};