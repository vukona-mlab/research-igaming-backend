const { Router } = require("express");
const bankAccountRoutes = Router();
const passport = require("passport");

const {
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  updateBankAccount,
} = require("../controllers/bankAccountController");

bankAccountRoutes.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  addBankAccount
);
bankAccountRoutes.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getBankAccounts
);
bankAccountRoutes.delete(
  "/:accId",
  passport.authenticate("jwt", { session: false }),
  deleteBankAccount
);
bankAccountRoutes.put(
  "/:accId",
  passport.authenticate("jwt", { session: false }),
  updateBankAccount
);

module.exports = bankAccountRoutes;
