const axios = require("../config/axiosConfig");
const redisClient = require("../config/redis");

// 🔁 Retry helper
async function withRetry(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.log("🔁 Retrying...");
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

// ✅ GraphQL
async function fetchFromGraphQL(username) {
  const response = await axios.post(
    "https://leetcode.com/graphql",
    {
      query: `
        query combinedData($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
          }
        }
      `,
      variables: { username },
    }
  );

  const user = response.data?.data?.matchedUser;
  const contest = response.data?.data?.userContestRanking;

  if (!user) throw new Error("User not found");

  const stats = user.submitStats.acSubmissionNum;

  return {
    solved: stats.find((x) => x.difficulty === "All")?.count || 0,

    // ✅ FIXED (real contest data)
    rating: Math.floor(contest?.rating || 0),
    rank: contest?.globalRanking || 0,
    contests: contest?.attendedContestsCount || 0,
  };
}

// ✅ Fallback
async function fetchFromFallback(username) {
  const response = await axios.get(
    `https://leetcode-stats-api.herokuapp.com/${username}`
  );

  const data = response.data;

  if (!data || data.status === "error") {
    throw new Error("Fallback API failed");
  }

  return {
    solved: data.totalSolved || 0,
    rating: Math.floor(data.rating || 0),
    rank: data.ranking || 0,
    contests: data.attendedContestsCount || 0,
  };
}

// 🧠 MAIN FUNCTION
async function fetchLeetCode(username) {
  const result = { solved: 0, rating: 0, rank: 0, contests: 0 };

  try {
    const cacheKey = `leetcode:${username}`;

    // ✅ 1. Cache check
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ Cache hit");
      return JSON.parse(cached);
    }

    let data = null;

    // 🚀 GraphQL first
    try {
      console.log("🚀 Trying GraphQL...");
      data = await withRetry(() => fetchFromGraphQL(username));
    } catch (err) {
      console.log("⚠️ GraphQL failed:", err.message);
    }

    // 🔄 Fallback
    if (!data) {
      try {
        console.log("🔄 Using fallback...");
        data = await fetchFromFallback(username);
      } catch (err) {
        console.log("❌ Fallback failed:", err.message);
        return result;
      }
    }

    // ✅ 2. Cache set (ioredis syntax 🔥)
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 900);

    console.log("✅ Cached successfully");

    return data;
  } catch (err) {
    console.log("❌ Error:", err.message);
    return result;
  }
}

module.exports = fetchLeetCode;