const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const passport = require("passport");

// Protect all routes with JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// CRUD Routes
router.post("/projects", projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:projectId", projectController.getProject);
router.put("/projects/:projectId", projectController.updateProject);
router.delete("/projects/:projectId", projectController.deleteProject);

// Additional Routes
router.put("/projects/:projectId/status", projectController.updateProjectStatus);
router.post("/projects/:projectId/reviews", projectController.addReview);

module.exports = router; 