const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  reportChat,
  contactUs
} = require("../controllers/supportController");
const upload = require("../middleware/multerUpload");
const uploadArray = require("../middleware/multerArrayUpload");

require("../passport");


router.post("/report-chat",passport.authenticate('jwt', { session: false }), reportChat);
router.post("/contact-us", contactUs)


module.exports = router;
