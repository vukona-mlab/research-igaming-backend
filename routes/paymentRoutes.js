const express = require('express');
const router = express.Router();
const passport = require('passport');
const paymentController = require('../controllers/paymentController');

// All routes require authentication except PayPal return
router.use('/process-payment', passport.authenticate('jwt', { session: false }));
router.use('/payment-history', passport.authenticate('jwt', { session: false }));

// Payment routes
router.post('/process-payment', paymentController.createOrder);
router.get('/payment-history', paymentController.getPaymentHistory);
router.get('/paypal-return', paymentController.handlePayPalReturn); // New route for PayPal return

module.exports = router; 