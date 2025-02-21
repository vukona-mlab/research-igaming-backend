const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register,
  login,
  updateRole,
  getProfile,
  update,
  deleteAccount,
} = require("../controllers/authController");
const upload = require("../middleware/multerUpload");

require("../passport");

router.post("/register", register);
router.post("/login", login);
router.put(
  "/users/:userId/roles",
  passport.authenticate("jwt", { session: false }),
  updateRole
);
router.get(
  "/users/:userId",
  passport.authenticate("jwt", { session: false }),
  getProfile
);
router.put(
  "/:id/update",
  upload,
  passport.authenticate("jwt", { session: false }),
  update
);

router.delete(
  "/:id/delete",
  passport.authenticate("jwt", { session: false }),
  deleteAccount
);

module.exports = router;
