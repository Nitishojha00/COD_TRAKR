const axios = require("axios");

async function fetchCodeforces(username) {
  const result = { solved: 0, rating: 0, rank: 0, contests: 0 };

  try {
    // ✅ 1. User Info
    const info = await axios.get(
      `https://codeforces.com/api/user.info?handles=${username}`
    );

    if (info.data.status === "OK") {
      result.rating = info.data.result[0].rating || 0;
      result.rank = info.data.result[0].maxRank || 0;
    }

    // ✅ 2. Contest count (🔥 NEW FIX)
    const rating = await axios.get(
      `https://codeforces.com/api/user.rating?handle=${username}`
    );

    if (rating.data.status === "OK") {
      result.contests = rating.data.result.length; // 🔥 KEY LINE
    }

    // ✅ 3. Solved problems
    const status = await axios.get(
      `https://codeforces.com/api/user.status?handle=${username}`
    );

    if (status.data.status === "OK") {
      const solvedSet = new Set();

      status.data.result.forEach((x) => {
        if (x.verdict === "OK") {
          solvedSet.add(`${x.problem.contestId}-${x.problem.index}`);
        }
      });

      result.solved = solvedSet.size;
    }
  } catch {
    console.log("❌ Codeforces fetch failed");
  }

  return result;
}

module.exports = fetchCodeforces;