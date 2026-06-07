const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    parts: [
      {
        text: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Snapshot of user's coding stats at the time the chat was initiated
    // so Gemini has context about their progress
    statsSnapshot: {
      totalSolved: { type: Number, default: 0 },
      totalContests: { type: Number, default: 0 },
      bestRating: { type: Number, default: 0 },
      platforms: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    // The full conversation history in Gemini's format
    history: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);