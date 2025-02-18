const express = require("express");
const router = express.Router();
const { register, login, update } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/id/update", update);

module.exports = router;
