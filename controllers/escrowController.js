const { firebaseDb } = require("../config/firebase");

// Create a new escrow transaction
exports.createEscrow = async (req, res) => {
    const { freelancerId, clientId, amount } = req.body;

    if (!freelancerId || !clientId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate a unique project ID (you can customize this logic)
    const projectId = `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
        const escrowRef = await firebaseDb.collection("escrows").add({
            freelancerId,
            clientId,
            amount,
            projectId, // Include the generated project ID
            status: "pending", // Initial status
            createdAt: new Date(),
        });

        res.status(201).json({ message: "Escrow created successfully", escrowId: escrowRef.id, projectId });
    } catch (error) {
        console.error("Error creating escrow:", error);
        res.status(500).json({ error: "An error occurred while creating the escrow" });
    }
};

// Release funds from escrow
exports.releaseFunds = async (req, res) => {
    const { escrowId } = req.params;

    try {
        const escrowRef = firebaseDb.collection("escrows").doc(escrowId);
        const escrowDoc = await escrowRef.get();

        if (!escrowDoc.exists) {
            return res.status(404).json({ error: "Escrow not found" });
        }

        await escrowRef.update({ status: "completed" });
        // Logic to transfer funds to freelancer would go here

        res.status(200).json({ message: "Funds released successfully" });
    } catch (error) {
        console.error("Error releasing funds:", error);
        res.status(500).json({ error: "An error occurred while releasing funds" });
    }
};

// Cancel escrow
exports.cancelEscrow = async (req, res) => {
    const { escrowId } = req.params;

    try {
        const escrowRef = firebaseDb.collection("escrows").doc(escrowId);
        const escrowDoc = await escrowRef.get();

        if (!escrowDoc.exists) {
            return res.status(404).json({ error: "Escrow not found" });
        }

        await escrowRef.update({ status: "canceled" });
        res.status(200).json({ message: "Escrow canceled successfully" });
    } catch (error) {
        console.error("Error canceling escrow:", error);
        res.status(500).json({ error: "An error occurred while canceling the escrow" });
    }
};

// Get escrow details
exports.getEscrow = async (req, res) => {
    const { escrowId } = req.params;

    try {
        const escrowRef = firebaseDb.collection("escrows").doc(escrowId);
        const escrowDoc = await escrowRef.get();

        if (!escrowDoc.exists) {
            return res.status(404).json({ error: "Escrow not found" });
        }

        res.status(200).json({ escrow: escrowDoc.data() });
    } catch (error) {
        console.error("Error fetching escrow:", error);
        res.status(500).json({ error: "An error occurred while fetching the escrow" });
    }
};
