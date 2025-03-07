const express = require("express");
const passport = require("passport");
const escrowController = require("../controllers/escrowController");

const router = express.Router();

// Create a new escrow transaction
router.post(
    "/escrows",
    passport.authenticate("jwt", { session: false }),
    escrowController.createEscrow
);

// Release funds from escrow
router.post(
    "/escrows/:escrowId/release",
    passport.authenticate("jwt", { session: false }),
    escrowController.releaseFunds
);

// Cancel escrow
router.delete(
    "/escrows/:escrowId",
    passport.authenticate("jwt", { session: false }),
    escrowController.cancelEscrow
);

// Get escrow details
router.get(
    "/escrows/:escrowId",
    passport.authenticate("jwt", { session: false }),
    escrowController.getEscrow
);

module.exports = router;
