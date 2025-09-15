const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const passport = require("passport");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),

  notificationsController.getAdminNotifications
);
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  notificationsController.sendNotification
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  notificationsController.deleteNotification
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  notificationsController.updateReadStatus
);

module.exports = router;
