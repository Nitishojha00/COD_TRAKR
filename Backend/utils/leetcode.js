const axios = require("../config/axiosConfig");
const redisClient = require("../config/redis"); // your redis connection

async function fetchLeetCode(username) {
  const result = { solved: 0, rating: 0, rank: 0, contests: 0 };

  try {
    const cacheKey = `leetcode:${username}`;

    // ✅ 1. Check Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ LeetCode served from cache");
      return JSON.parse(cached);
    }

    // ✅ 2. Fetch from public stats API (Less blocked than GraphQL)
    const response = await axios.get(
      `https://leetcode-stats-api.herokuapp.com/${username}`,
      {
        timeout: 10000,
      }
    );

    const data = response.data;

    if (!data || data.status === "error") {
      console.log("❌ Invalid LeetCode username or API error");
      return result;
    }

    result.solved = data.totalSolved || 0;
    result.rating = Math.floor(data.rating || 0);
    result.rank = data.ranking || 0;
    result.contests = data.attendedContestsCount || 0;

    // ✅ 3. Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(result));

    console.log("✅ LeetCode fetched & cached");

  } catch (err) {
    console.log("❌ LeetCode fetch failed:", err.message);
  }

  return result;
}

module.exports = fetchLeetCode;
