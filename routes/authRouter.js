const express = require("express");
const router = express.Router();
const { register, login, updateRole, getProfile } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.put("/users/:userId/roles", updateRole);
router.get("/users/:userId", getProfile);

module.exports = router;
