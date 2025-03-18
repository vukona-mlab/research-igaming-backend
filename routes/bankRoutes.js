const { Router } = require("express");
const bankRoutes = Router();
const passport = require("passport");

const {
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  updateBankAccount,
  getBanks,
} = require("../controllers/bankController");

bankRoutes.post(
  "/bank-accounts",
  passport.authenticate("jwt", { session: false }),
  addBankAccount
);
bankRoutes.get(
  "/bank-accounts",
  passport.authenticate("jwt", { session: false }),
  getBankAccounts
);
bankRoutes.delete(
  "/bank-accounts/:accId",
  passport.authenticate("jwt", { session: false }),
  deleteBankAccount
);
bankRoutes.put(
  "/bank-accounts/:accId",
  passport.authenticate("jwt", { session: false }),
  updateBankAccount
);
bankRoutes.get(
  "/banks",
  passport.authenticate("jwt", { session: false }),
  getBanks
);
module.exports = bankRoutes;
