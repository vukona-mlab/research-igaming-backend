const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const passport = require("passport");

// Protect all routes with JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// Route to get user statistics
router.get("/stats", statsController.getUserStats);

// Route to get daily active users
router.get("/daily-active-users", statsController.getDailyActiveUsers);

// Route to manually record daily stats (protected, admin only)
router.post("/record-daily-stats", async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('super_admin')) {
      return res.status(403).json({ error: "Only admins can record daily stats" });
    }

    const stats = await statsController.recordDailyActiveUsers();
    res.status(200).json({ message: "Daily stats recorded successfully", stats });
  } catch (error) {
    console.error("Error recording daily stats:", error);
    res.status(500).json({ error: "Failed to record daily stats" });
  }
});

// Route to get project statistics
router.get("/project-stats", statsController.getProjectStats);

module.exports = router; 