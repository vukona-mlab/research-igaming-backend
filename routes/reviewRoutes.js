// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const reviewController = require("../controllers/reviewController");

// Define the route for getting reviews
router.get("/reviews", reviewController.getReviews);

// Protected routes
router.post(
  "/reviews",
  passport.authenticate("jwt", { session: false }),
  reviewController.createReview
);

router.patch(
  "/reviews/status",
  passport.authenticate("jwt", { session: false }),
  reviewController.updateReviewStatus
);

module.exports = router;
