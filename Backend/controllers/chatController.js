const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ================= SYSTEM PROMPT BUILDER ================= */
function buildSystemPrompt(user, stats) {
  const platforms = stats?.platforms || {};

  const platformDetails = Object.entries(platforms)
    .filter(([, p]) => p?.username)
    .map(([name, p]) => {
      return `  - ${name}: username="${p.username}", solved=${p.solved ?? 0}, rating=${p.rating ?? 0}, contests=${p.contests ?? 0}, rank=${p.rank ?? 0}`;
    })
    .join("\n");

  return `You are an expert competitive programming coach and mentor integrated into COD TRAKR — a platform that tracks a coder's performance across LeetCode, Codeforces, CodeChef, and GeeksForGeeks.

The user you are helping is:
  Name: ${user.name || "Coder"}
  Email: ${user.email}

Their current coding stats across platforms:
${platformDetails || "  No platforms linked yet."}

Aggregated Stats:
  - Total Problems Solved: ${stats?.totalSolved ?? 0}
  - Total Contests Participated: ${stats?.totalContests ?? 0}
  - Best Rating: ${stats?.bestRating ?? 0}
  - Active Platforms: ${stats?.platformCount ?? 0}

Your role:
1. Analyze their current performance based on the stats above.
2. Ask them about their easy/medium/hard split if not provided, and use that to personalize advice.
3. Give specific, actionable improvement plans (topics to study, problem counts, contest frequency).
4. Recommend specific LeetCode patterns (sliding window, DP, graphs, etc.) based on their level.
5. Be encouraging but realistic. Use data to back your recommendations.
6. Keep responses concise and structured (use bullet points and headings where helpful).
7. If they ask unrelated questions, politely redirect to coding improvement topics.

Start by greeting them and asking a key question to understand their current weak areas.`;
}

/* ================= GET CHAT HISTORY ================= */
const getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    let chat = await Chat.findOne({ userId });

    if (!chat) {
      return res.json({ history: [], statsSnapshot: null });
    }

    res.json({
      history: chat.history,
      statsSnapshot: chat.statsSnapshot,
    });
  } catch (err) {
    console.error("getChatHistory Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ================= SEND MESSAGE ================= */
const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Fetch user data
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get cached dashboard stats for context
    const cachedData = await redisClient.get(`dashboard:data:${userId}`);
    const stats = cachedData ? JSON.parse(cachedData) : null;

    // Find or create chat document
    let chat = await Chat.findOne({ userId });

    if (!chat) {
      // First message — save a stats snapshot
      chat = new Chat({
        userId,
        statsSnapshot: stats
          ? {
              totalSolved: stats.totalSolved,
              totalContests: stats.totalContests,
              bestRating: stats.bestRating,
              platforms: stats.platforms,
            }
          : {},
        history: [],
      });
    }

    // Build Gemini model with system instruction
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: buildSystemPrompt(user, stats),
        });

    // Start chat with existing history
    const geminiChat = model.startChat({
      history: chat.history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      })),
    });

    // Send new message
    const result = await geminiChat.sendMessage(message);
    const responseText = result.response.text();

    // Append both user and model messages to history
    chat.history.push({
      role: "user",
      parts: [{ text: message }],
    });

    chat.history.push({
      role: "model",
      parts: [{ text: responseText }],
    });

    // Keep history max 50 messages to avoid context bloat
    if (chat.history.length > 50) {
      chat.history = chat.history.slice(chat.history.length - 50);
    }

    await chat.save();

    res.json({
      reply: responseText,
      history: chat.history,
    });
  } catch (err) {
    console.error("sendMessage Error:", err);
    res.status(500).json({ message: "AI service error. Please try again." });
  }
};

/* ================= CLEAR CHAT ================= */
const clearChat = async (req, res) => {
  try {
    const userId = req.userId;
    await Chat.findOneAndDelete({ userId });
    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("clearChat Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  clearChat,
};