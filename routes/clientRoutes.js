const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const passport = require("passport");

// Protect all routes with JWT authentication
router.use(passport.authenticate("jwt", { session: false }));

// Route to get all projects
router.get("/projects", clientController.getClientProjects);
router.get("/clients", clientController.getClients);

module.exports = router;
