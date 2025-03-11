const express = require('express');
const router = express.Router();
const passport = require('passport');
const cardController = require('../controllers/cardController');
const { firebaseDb } = require("../config/firebase");

// Test route to verify database connection
router.get('/cards/test-connection', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('Testing connection for user:', userId);
    
    // Try to access the user's cards collection
    const cardsRef = firebaseDb
      .collection('users')
      .doc(userId)
      .collection('cards');
    
    const snapshot = await cardsRef.limit(1).get();
    
    res.status(200).json({
      message: 'Database connection successful',
      hasCards: !snapshot.empty,
      userId: userId
    });
  } catch (error) {
    console.error('Database connection test error:', error);
    res.status(500).json({
      error: 'Database connection test failed',
      details: error.message
    });
  }
});

// All routes require authentication
router.use(passport.authenticate('jwt', { session: false }));

// CRUD routes for cards
router.post('/cards', cardController.addCard);
router.get('/cards', cardController.getCards);
router.put('/cards/:cardId', cardController.updateCard);
router.delete('/cards/:cardId', cardController.deleteCard);

module.exports = router; 