const express = require("express");
const router = express.Router();
const chatsController = require("../controllers/chatsController");
const passport = require("passport");

//route to create chats
router.post("/create-chat", chatsController.createChat);

//route to delete a chat
router.delete(
  "/chats/:chatId/delete-chat",
  passport.authenticate("jwt", { session: false }),
  chatsController.deleteChat
);

// View messages route
router.get("/chats/:chatId/messages", chatsController.viewMessages);
router.get(
  "/chats/:freelancerId/allChats",
  chatsController.getFreelancersChats
);
router.post("/freelancer/create-chat", chatsController.createChatFreelancer);

module.exports = router;
