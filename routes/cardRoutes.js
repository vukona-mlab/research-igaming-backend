const express = require('express');
const router = express.Router();
const passport = require('passport');
const cardController = require('../controllers/cardController');

// All routes require authentication
router.use(passport.authenticate('jwt', { session: false }));

// CRUD routes for cards
router.post('/cards', cardController.addCard);
router.get('/cards', cardController.getCards);
router.put('/cards/:cardId', cardController.updateCard);
router.delete('/cards/:cardId', cardController.deleteCard);

module.exports = router; 