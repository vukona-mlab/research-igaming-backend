const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register,
  login,
  updateRole,
  getProfile,
  update,
  googleSignIn,
  resetPassword,
  deleteAccount,
  uploadDocuments,
} = require("../controllers/authController");
const upload = require("../middleware/multerUpload");
const uploadArray = require("../middleware/multerArrayUpload");

require("../passport");

router.post("/register", register);
router.post("/login", login);
// Google Sign-In endpoint
// Handles the ID token verification and user creation/authentication

router.post("/google", googleSignIn);

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
  "/users/:userId/update",
  upload,
  passport.authenticate("jwt", { session: false }),
  update
);
router.put(
  "/users/:userId/upload",
  uploadArray("documents", 6),
  passport.authenticate("jwt", { session: false }),
  uploadDocuments
);

router.post("/reset-password", resetPassword);

router.delete(
  "/:id/delete",
  passport.authenticate("jwt", { session: false }),
  deleteAccount
);

module.exports = router;
