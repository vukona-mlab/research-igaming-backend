const express = require("express");
const router = express.Router();
const chatsController = require("../controllers/chatsController");
const passport = require("passport");
const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory as a buffer
const upload = multer({ storage });

//route to create chats
router.post(
  "/create-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.createChat
);

//route to delete a chat
router.delete(
  "/chats/:chatId/delete-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.deleteChat
);

// View messages route
router.get("/chats/:chatId/messages", chatsController.viewMessages);

router.post(
  "/chats/send-image",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  chatsController.sendChatImage
);

// Route to send a chat message with an attachment
router.post(
  "/chats/send-attachment",
  passport.authenticate("jwt", { session: false }),
  upload.single("attachment"),
  chatsController.sendChatAttachment
);

module.exports = router;
