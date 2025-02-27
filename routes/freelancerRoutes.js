const express = require("express");
const router = express.Router();
const freelancerController = require("../controllers/freelancerController");

// Route to get freelancers and their projects
router.get("/freelancers/projects", freelancerController.getFreelancerProjects);

// Route to get all projects
router.get("/projects", freelancerController.getAllProjects);

//route to create chats
router.post("/create-chat", freelancerController.createChat);

//route to delete a chat
router.delete("delete-chat", freelancerController.deleteChat);

module.exports = router;
