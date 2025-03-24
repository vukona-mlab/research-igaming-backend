const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const passport = require("passport");

router.get(
  "/admin-notifications",
  passport.authenticate("jwt", { session: false }),

  notificationsController.getAdminNotifications
);
router.post(
  "/admin-notifications",
  passport.authenticate("jwt", { session: false }),
  notificationsController.sendNotification
);

router.delete(
  "/admin-notifications/:id",
  passport.authenticate("jwt", { session: false }),
  notificationsController.deleteNotification
);

module.exports = router;
