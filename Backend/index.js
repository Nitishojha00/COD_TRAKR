/* ================= UPDATED APP.JS ================= */
const express = require('express');
const app = express();
const cors = require("cors");
const main = require('./config/db');
const redisClient = require('./config/redis'); // ensure this file handles errors too
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");
const authRoute = require('./routes/authRoute');
const dashRouter = require('./routes/dashRoute');
const noteRouter = require('./routes/notesRoutes');
const chatRoute = require("./routes/chatRoute");

dotenv.config();

// 1. FIX CORS: Add 5500 (Live Server default)
app.use(cors({
  origin: ["http://127.0.0.1:3000","https://codtrakr.nitishojha.in" , "http://127.0.0.1:5500"], 
  credentials: true 
}));

// app.js
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoute);
app.use("/api/dashboard", dashRouter);
app.use("/api/notes", noteRouter);
app.use("/api/chat", chatRoute);

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// 2. BETTER SERVER STARTUP
const InitializeConnection = async () => {
    try {
        // Connect to MongoDB
        await main();
        console.log("✅ MongoDB Connected");

        // Try connecting to Redis, but don't crash if it fails (optional safety)
        try {
            await redisClient.connect();
            console.log("✅ Redis Connected");
        } catch (redisErr) {
            console.error("⚠️ Redis failed to connect (Server will still start):", redisErr.message);
        }

        // Start Server
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`🚀 Server listening at http://127.0.0.1:${PORT}`);
        });

    } catch (err) {
        console.error("❌ CRITICAL DB ERROR:", err);
    }
};

InitializeConnection();