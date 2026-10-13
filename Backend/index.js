
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const main = require("./config/db");
const redisClient = require("./config/redis");

const authRoute = require("./routes/authRoute");
const dashRouter = require("./routes/dashRoute");
const noteRouter = require("./routes/notesRoutes");
const chatRoute = require("./routes/chatRoute");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://codtrakr.nitishojha.in",
    "http://127.0.0.1:5500",
    "https://cod-trakr.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoute);
app.use("/api/dashboard", dashRouter);
app.use("/api/notes", noteRouter);
app.use("/api/chat", chatRoute);

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// Health check for UptimeRobot
app.get("/health", async (req, res) => {
  const status = {
    server: "ok",
    mongodb: "unknown",
    redis: "unknown",
    timestamp: new Date().toISOString()
  };

  try {
    const mongoose = require("mongoose");

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      status.mongodb = "ok";
    } else {
      status.mongodb = "disconnected";
    }
  } catch (err) {
    status.mongodb = "error";
  }

  try {
    if (redisClient.isReady) {
      await redisClient.ping();
      status.redis = "ok";
    } else {
      status.redis = "disconnected";
    }
  } catch (err) {
    status.redis = "error";
  }

  const healthy =
    status.mongodb === "ok" &&
    status.redis === "ok";

  res.status(healthy ? 200 : 503).json(status);
});

const InitializeConnection = async () => {
  try {
    await main();
    console.log("MongoDB Connected");

    // Redis is optional; the server can still start without it.
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      console.log("Redis Connected");
    } catch (redisErr) {
      console.error("Redis connection failed:", redisErr.message);
    }

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Critical startup error:", err);
    process.exit(1);
  }
};

InitializeConnection();
