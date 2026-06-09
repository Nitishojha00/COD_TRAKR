const express = require("express");
const router = express.Router();
const { getChatHistory, sendMessage, clearChat } = require("../controllers/chatController");
const auth = require("../middlewares/auth"); 

// All routes are protected
router.use(auth);

// GET  /api/chat/history  → load previous conversation
router.get("/history", getChatHistory);

// POST /api/chat/send     → send a message and get AI reply
router.post("/send", sendMessage);

// DELETE /api/chat/clear  → clear conversation history
router.delete("/clear", clearChat);

module.exports = router;