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
  deleteDocument,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  adminLogin,
  initializeSuperAdmin,
  getAdminProfile,
  updateAdminProfile,
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
router.delete(
  "/users/:userId/documents/delete",
  passport.authenticate("jwt", { session: false }),
  deleteDocument
);
router.put(
  "/users/:userId/upload",
  uploadArray.array("documents", 6),
  passport.authenticate("jwt", { session: false }),
  uploadDocuments
);

router.post("/reset-password", resetPassword);

router.delete(
  "/:id/delete",
  passport.authenticate("jwt", { session: false }),
  deleteAccount
);

// Admin routes
router.post('/admin/login', adminLogin);

router.post(
  '/admin/create',
  passport.authenticate('jwt', { session: false }),
  createAdmin
);

router.get(
  '/admin/all',
  passport.authenticate('jwt', { session: false }),
  getAllAdmins
);

router.put(
  '/admin/:adminId',
  passport.authenticate('jwt', { session: false }),
  updateAdmin
);

router.delete(
  '/admin/:adminId',
  passport.authenticate('jwt', { session: false }),
  deleteAdmin
);

// Initialize super admin (one-time setup)
router.post('/admin/initialize', initializeSuperAdmin);

router.get(
  '/admin/profile/:adminId',
  passport.authenticate('jwt', { session: false }),
  getAdminProfile
);

router.put(
  '/admin/profile/:adminId',
  passport.authenticate('jwt', { session: false }),
  updateAdminProfile
);

module.exports = router;
