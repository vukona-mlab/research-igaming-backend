const express = require("express");
const router = express.Router();
const chatsController = require("../controllers/chatsController");
const passport = require("passport");
const projectFileUpload = require("../middleware/projectFileUpload");

// Get all chats for the authenticated user
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  chatsController.getUserChats
);

// Create new chat
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  chatsController.createChat
);

// Get messages for a specific chat
router.get(
  "/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  chatsController.viewMessages
);

// Send a message in a chat
router.post(
  "/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  chatsController.sendMessage
);
// Send a message in a chat
router.post(
  "/:chatId/upload",
  passport.authenticate("jwt", { session: false }),
  projectFileUpload.array("files", 1),
  chatsController.uploadImage
);
//route to delete a chat
router.delete(
  "/:chatId/delete-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.deleteChat
);

// Get a single chat
router.get(
  "/:chatId",
  passport.authenticate("jwt", { session: false }),
  chatsController.getChat
);

module.exports = router;
