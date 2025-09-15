const express = require("express");
const {
  getTestimonials,
  addTestimonial,
} = require("../controllers/testimonialController");

const router = express.Router();

router.get("/", getTestimonials);
router.post("/", addTestimonial);

module.exports = router;
