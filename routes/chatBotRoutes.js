const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Universal endpoints (role-based) - handle both authenticated and guest users
router.post('/questions', chatbotController.getQuestions);
router.post('/response', chatbotController.getResponse);
router.post('/sessions', chatbotController.saveChatSession);

// Guest-specific endpoints (if you want separate handling)
router.post('/guest/questions', chatbotController.getGuestQuestions);
router.post('/guest/response', chatbotController.getGuestResponse);
router.post('/guest/sessions', chatbotController.saveGuestChatSession);

// Authenticated user only endpoints
router.get('/user-data/:userId', chatbotController.getUserChatbotData);

// Legacy endpoints for compatibility
router.post('/responses', chatbotController.getResponse);

router.post('/send-to-admin', chatbotController.sendOverallChatToAdmin);
router.get('/sent-to-admin', chatbotController.getChatsSentToAdmin)

module.exports = router;