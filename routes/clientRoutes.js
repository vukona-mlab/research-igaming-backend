const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

// Route to get all projects
router.get("/projects", clientController.getClientProjects);

router.get("/clients", clientController.getClients);

module.exports = router;
