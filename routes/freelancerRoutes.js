const express = require("express");
const router = express.Router();
const freelancerController = require("../controllers/freelancerController");

// Route to get freelancers and their projects
router.get("/freelancers/projects", freelancerController.getFreelancerProjects);

// Route to get all projects
router.get("/projects", freelancerController.getAllProjects);

module.exports = router;
