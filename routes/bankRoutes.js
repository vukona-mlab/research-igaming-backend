const { Router } = require("express");
const passport = require("passport");

const bankRoutes = Router();
const {
  getBanks,
} = require("../controllers/bankController");

bankRoutes.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getBanks
);

module.exports = bankRoutes