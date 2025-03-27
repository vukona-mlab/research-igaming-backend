const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const passport = require("passport");
const projectFileUpload = require("../middleware/projectFileUpload");

// Protect all routes with JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// Move the chat route before the generic routes with :projectId parameter
router.get("/projects/chat/:chatId", projectController.getProjectByChatId);

// CRUD Routes
router.post("/projects", projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:projectId", projectController.getProject);
router.put(
  "/projects/:projectId",
  projectFileUpload.array("files", 10),
  projectController.updateProject
);
router.put(
  "/projects/:projectId/docs",
  projectFileUpload.array("docs", 10),
  projectController.addProjectDocuments
);
router.delete("/projects/:projectId", projectController.deleteProject);

// Additional Routes
router.put(
  "/projects/:projectId/status",
  projectController.updateProjectStatus
);
router.post("/projects/:projectId/reviews", projectController.addReview);

// New route for project counts by status
router.get(
  "/projects/status-counts",
  projectController.getProjectCountsByStatus
);

module.exports = router;
