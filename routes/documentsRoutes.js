const express = require("express");
const router = express.Router();
const passport = require("passport");
const documentsController = require("../controllers/documentsController");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  documentsController.getAllDocuments
);
router.put(
  "/:userId/update-status",
  passport.authenticate("jwt", { session: false }),
  documentsController.updateStatus
);

module.exports = router;
