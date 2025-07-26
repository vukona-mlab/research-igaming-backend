const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const passport = require("passport");
const projectFileUpload = require("../middleware/projectFileUpload");

// Protect all routes with JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// Move the chat route before the generic routes with :projectId parameter
router.get("/chat/:chatId", projectController.getProjectByChatId);

// CRUD Routes
router.post("/", projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/:clientId", projectController.getClientProjects);
router.get("/:projectId", projectController.getProject);
router.put(
  "/:projectId",
  projectFileUpload.array("files", 10),
  projectController.updateProject
);
router.put(
  "/:projectId/docs",
  projectFileUpload.array("docs", 10),
  projectController.addProjectDocuments
);
router.put(
  "/:projectId/picture",
  projectFileUpload.array("picture", 1),
  projectController.uploadProjectPicture
);
router.delete("/:projectId", projectController.deleteProject);

// Additional Routes
router.put("/:projectId/status", projectController.updateProjectStatus);
router.post("/:projectId/reviews", projectController.addReview);

// New route for project counts by status
router.get("/status-counts", projectController.getProjectCountsByStatus);

module.exports = router;
