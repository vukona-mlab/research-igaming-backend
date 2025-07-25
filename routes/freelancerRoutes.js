const express = require("express");
const router = express.Router();
const freelancerController = require("../controllers/freelancerController");

router.get("/freelancers/projects/:freelancerId", freelancerController.getFreelancerProjects)

// Route to get freelancers and their projects
router.get("/freelancers/projects", freelancerController.getFreelancersProjects);

// Route to get freelancers
router.get("/freelancers/:freelancerId", freelancerController.getFreelancer);

router.get("/freelancers", freelancerController.getFreelancers);

// Route to get all projects
router.get("/projects", freelancerController.getAllProjects);

module.exports = router;
