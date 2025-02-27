const express = require("express");
const router = express.Router();
const freelancerController = require("../controllers/freelancerController");

// Route to get freelancers and their projects
router.get("/freelancers/projects", freelancerController.getFreelancerProjects);

// Route to get all projects
router.get("/projects", freelancerController.getAllProjects);

//route to create chats
router.get("/create-chat", freelancerController.createChat);

module.exports = router;
