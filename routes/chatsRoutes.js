const express = require("express");
const router = express.Router();
const chatsController = require("../controllers/chatsController");
const passport = require("passport");

// Get all chats for the authenticated user
router.get(
  "/chats",
  passport.authenticate("jwt", { session: false }),
  chatsController.getUserChats
);

// Create new chat
router.post(
  "/create-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.createChat
);

// Get messages for a specific chat
router.get(
  "/chats/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  chatsController.viewMessages
);

// Send a message in a chat
router.post(
  "/chats/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  chatsController.sendMessage
);

//route to delete a chat
router.delete(
  "/chats/:chatId/delete-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.deleteChat
);

// Get a single chat
router.get(
  "/chats/:chatId",
  passport.authenticate("jwt", { session: false }),
  chatsController.getChat
);

module.exports = router;
