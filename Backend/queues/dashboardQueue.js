const { Queue, Worker } = require("bullmq");
const redis = require("../config/redis"); // your ioredis client
const User = require("../models/User");
const fetchRealTimeStats = require("../utils/fetchRealTimeStats"); // your existing helper
const buildDashboardResponse = require("../utils/buildDashboardResponse"); // extract helper
const CACHE_TTL = 86400; // 24 hours

// Create a queue instance
const dashboardQueue = new Queue("dashboard-refresh", { connection: redis });

// Worker that processes the jobs
const worker = new Worker(
  "dashboard-refresh",
  async (job) => {
    const { userId } = job.data;
    console.log(`🔄 Refreshing dashboard for user ${userId} (attempt ${job.attemptsMade + 1})`);

    // Fetch fresh data
    const user = await User.findById(userId);
    if (!user) return;

    const livePlatforms = await fetchRealTimeStats(user.platforms);
    const responseData = buildDashboardResponse(livePlatforms);

    // Update Redis cache
    const dataKey = `dashboard:data:${userId}`;
    const timeKey = `dashboard:time:${userId}`;

    await redis.set(dataKey, JSON.stringify(responseData), "EX", CACHE_TTL);
    await redis.set(timeKey, String(Date.now()), "EX", CACHE_TTL);

    console.log(`✅ Dashboard refreshed for user ${userId}`);
  },
  { connection: redis }
);

// Handle worker errors
worker.on("failed", (job, err) => {
  console.error(`❌ Refresh job failed for user ${job.data.userId}:`, err.message);
});

module.exports = { dashboardQueue, worker };