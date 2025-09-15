const { Router } = require("express");
const passport = require("passport");
const checkProfileCompleted = require("../middleware/checkProfileCompleted");

const bankRoutes = Router();
const {
  getBanks,
} = require("../controllers/bankController");

bankRoutes.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  checkProfileCompleted,
  getBanks
);

module.exports = bankRoutes