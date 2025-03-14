const express = require('express');
const router = express.Router();
const passport = require('passport');
const escrowController = require('../controllers/escrowController');

// All routes require authentication
router.use(passport.authenticate('jwt', { session: false }));

router.post('/escrow', escrowController.createEscrowAccount);
router.put('/escrow/:escrowId', escrowController.updateEscrowAccount);
router.post('/escrow/:escrowId/fund', escrowController.fundEscrow);
router.post('/escrow/:escrowId/release', escrowController.releaseEscrow);
router.get('/escrow/:escrowId', escrowController.getEscrowDetails);

module.exports = router;