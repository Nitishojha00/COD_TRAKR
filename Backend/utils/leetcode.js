const axios = require("../config/axiosConfig");
const redisClient = require("../config/redis");

async function fetchLeetCode(username) {
  const result = {
    solved: 0,
    rating: 0,
    rank: 0,
    contests: 0,
  };

  try {
    const cacheKey = `leetcode:${username}`;

    // Cache Check
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("⚡ LeetCode served from cache");
      return JSON.parse(cached);
    }

    const query = `
      query getUser($username:String!){
        matchedUser(username:$username){
          profile{
            ranking
          }
          submitStats{
            acSubmissionNum{
              difficulty
              count
            }
          }
        }
        userContestRanking(username:$username){
          rating
          attendedContestsCount
        }
      }
    `;

    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { username },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const user = data?.data?.matchedUser;
    const contest = data?.data?.userContestRanking;

    if (!user) {
      console.log("❌ Invalid LeetCode username");
      return result;
    }

    const allSolved =
      user.submitStats?.acSubmissionNum?.find(
        (item) => item.difficulty === "All"
      );

    result.solved = allSolved?.count || 0;
    result.rank = user.profile?.ranking || 0;
    result.rating = Math.floor(contest?.rating || 0);
    result.contests =
      contest?.attendedContestsCount || 0;

    // Cache for 24 hours
    await redisClient.setEx(
      cacheKey,
      86400,
      JSON.stringify(result)
    );

    console.log("✅ LeetCode fetched & cached");

    return result;
  } catch (err) {
    console.log(
      "❌ LeetCode fetch failed:",
      err.response?.data || err.message
    );

    return result;
  }
}

module.exports = fetchLeetCode;