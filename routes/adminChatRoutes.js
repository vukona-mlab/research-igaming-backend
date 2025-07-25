const express = require("express");
const router = express.Router();
const adminChatController = require("../controllers/adminChatController");
const passport = require("passport");

// Debug middleware
const authDebugMiddleware = (req, res, next) => {
  console.log('Auth Debug - Headers:', {
    authorization: req.headers.authorization,
    contentType: req.headers['content-type']
  });
  
  if (!req.headers.authorization) {
    return res.status(401).json({ 
      error: "No authorization header",
      message: "Please provide a valid authentication token" 
    });
  }

  // Extract token and verify format
  const token = req.headers.authorization;
  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: "Invalid token format",
      message: "Token must start with 'Bearer '" 
    });
  }

  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    console.log('Auth Debug - Passport Result:', {
      error: err,
      user: user ? {
        uid: user.uid,
        email: user.email,
        roles: user.roles
      } : null,
      info
    });

    if (err) {
      return res.status(500).json({ 
        error: "Authentication error", 
        details: err.message 
      });
    }
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication failed", 
        details: info?.message || "Invalid or expired token" 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Create new chat (admin-admin or admin-client)
router.post(
  "/",
  authDebugMiddleware,
  adminChatController.createAdminChat
);

// Get all chats for the authenticated user
router.get(
  "/",
  authDebugMiddleware,
  adminChatController.getChats
);

// Update chat
router.put(
  "/:chatId",
  authDebugMiddleware,
  adminChatController.updateAdminChat
);

// Send message in chat
router.post(
  "/:chatId/messages",
  authDebugMiddleware,
  adminChatController.sendAdminMessage
);

// Mark messages as read
router.put(
  "/:chatId/read",
  authDebugMiddleware,
  adminChatController.markMessagesAsRead
);

// Archive chat
router.put(
  "/:chatId/archive",
  authDebugMiddleware,
  adminChatController.archiveChat
);

// Log user action in chat
router.post(
  "/:chatId/actions",
  authDebugMiddleware,
  adminChatController.logUserAction
);

// Get messages for a specific chat
router.get(
  "/:chatId/messages",
  authDebugMiddleware,
  adminChatController.getChatMessages
);

module.exports = router; 