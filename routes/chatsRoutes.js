const express = require("express");
const router = express.Router();
const chatsController = require("../controllers/chatsController");
const passport = require("passport");

//route to create chats
router.post(
  "/create-chat",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    console.log('Auth middleware passed, user:', req.user);
    next();
  },
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

module.exports = router;
