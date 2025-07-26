// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const reviewController = require("../controllers/reviewController");

// Define the route for getting reviews
router.get("/", reviewController.getReviews);

// Protected routes
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  reviewController.createReview
);

router.patch(
  "/status",
  passport.authenticate("jwt", { session: false }),
  reviewController.updateReviewStatus
);

module.exports = router;
