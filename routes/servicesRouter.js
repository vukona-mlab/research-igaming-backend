const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();
const db = admin.firestore(); 

// Get all services
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("services").get();
    const services = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});



module.exports = router;
