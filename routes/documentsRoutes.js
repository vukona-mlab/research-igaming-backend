const express = require("express");
const router = express.Router();
const passport = require("passport");
const documentsController = require("../controllers/documentsController");

router.get(
  "/documents",
  passport.authenticate("jwt", { session: false }),
  documentsController.getAllDocuments
);
router.put(
  "/documents/:userId/update-status",
  passport.authenticate("jwt", { session: false }),
  documentsController.updateStatus
);

module.exports = router;
