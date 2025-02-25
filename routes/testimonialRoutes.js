const express = require("express");
const {
  getTestimonials,
  addTestimonial,
} = require("../controllers/testimonialController");

const router = express.Router();

router.get("/testimonials", getTestimonials);
router.post("/testimonials", addTestimonial);

module.exports = router;
