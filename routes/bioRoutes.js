const express = require("express");
const router = express.Router();
const {
  createBio,
  getBio,
  updateBio,
  deleteBio,
  getOwnBio,
} = require("../controllers/bioController");

// Bio CRUD routes (authentication is handled in the controller middleware)
router.post("/user/bio", createBio); // Create bio
router.get("/user/bio", getOwnBio); // Get own bio
router.get("/user/:id/bio", getBio); // Get specific user's bio
router.put("/user/bio", updateBio); // Update bio
router.delete("/user/bio", deleteBio); // Delete bio

module.exports = router; 