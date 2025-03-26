// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const reviewController = require("../controllers/reviewController");

// Define the route for getting reviews
router.get("/reviews", reviewController.getReviews);
router.post(
  "/reviews",
  passport.authenticate("jwt", { session: false }),
  reviewController.createReview
);

module.exports = router;
