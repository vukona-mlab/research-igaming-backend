const { Router } = require("express");
const transactionRoutes = Router();
const passport = require("passport");

const {
  createTransaction,
  verifyPayment,
  releaseFunds,
} = require("../controllers/transactionController");

transactionRoutes.post(
  "/transaction",
  passport.authenticate("jwt", { session: false }),
  createTransaction
);

transactionRoutes.post(
  "/payment/verify",
  passport.authenticate("jwt", { session: false }),
  verifyPayment
);

transactionRoutes.post(
  "/transaction/release",
  passport.authenticate("jwt", { session: false }),
  releaseFunds
);

module.exports = transactionRoutes;
