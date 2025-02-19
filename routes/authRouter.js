const express = require("express");
const router = express.Router();
const { register, login, update } = require("../controllers/authController");
const upload = require("../middleware/multerUpload");

router.post("/register", register);
router.post("/login", login);
router.put("/:id/update", upload, update);

module.exports = router;
