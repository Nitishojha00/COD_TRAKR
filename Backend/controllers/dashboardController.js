const User = require("../models/User");
const fetchLeetCode = require("../utils/leetcode");
const fetchCodeforces = require("../utils/codeforces");
const fetchCodeChef = require("../utils/codechef");
const fetchGFG = require("../utils/gfg");

/* ================= FETCH PLATFORM STATS ================= */

async function fetchRealTimeStats(platforms) {
  try {
    const stats = JSON.parse(JSON.stringify(platforms));
    const tasks = [];

    if (stats.LeetCode?.username) {
      tasks.push(
        fetchLeetCode(stats.LeetCode.username)
          .then((res) => Object.assign(stats.LeetCode, res))
          .catch((err) =>
            console.error("LeetCode Error:", err.message)
          )
      );
    }

    if (stats.Codeforces?.username) {
      tasks.push(
        fetchCodeforces(stats.Codeforces.username)
          .then((res) => Object.assign(stats.Codeforces, res))
          .catch((err) =>
            console.error("Codeforces Error:", err.message)
          )
      );
    }

    if (stats.CodeChef?.username) {
      tasks.push(
        fetchCodeChef(stats.CodeChef.username)
          .then((res) => {
            stats.CodeChef.solved = res.solved || 0;
            stats.CodeChef.rating = res.rating || 0;
          })
          .catch((err) =>
            console.error("CodeChef Error:", err.message)
          )
      );
    }

    if (stats.GFG?.username) {
      tasks.push(
        fetchGFG(stats.GFG.username)
          .then((res) => Object.assign(stats.GFG, res))
          .catch((err) =>
            console.error("GFG Error:", err.message)
          )
      );
    }

    await Promise.allSettled(tasks);
    return stats;

  } catch (error) {
    console.error(
      "fetchRealTimeStats Fatal Error:",
      error.message
    );

    return platforms;
  }
}

/* ================= AGGREGATION ================= */

function buildDashboardResponse(platforms) {
  try {
    let totalSolved = 0;
    let totalContests = 0;
    let bestRating = 0;
    let platformCount = 0;

    for (const key in platforms) {
      const platform = platforms[key];

      if (!platform?.username) continue;

      platformCount++;

      totalSolved += Number(platform.solved || 0);
      totalContests += Number(platform.contests || 0);

      const rating = Number(platform.rating || 0);

      if (!isNaN(rating)) {
        bestRating = Math.max(bestRating, rating);
      }
    }

    return {
      platforms,
      totalSolved,
      totalContests,
      bestRating,
      platformCount,
    };

  } catch (error) {
    console.error(
      "buildDashboardResponse Error:",
      error.message
    );

    return {
      platforms,
      totalSolved: 0,
      totalContests: 0,
      bestRating: 0,
      platformCount: 0,
    };
  }
}

/* ================= CONTROLLERS ================= */

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password");

    res.json(user);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const saveAccounts = async (req, res) => {
  try {
    const { platforms } = req.body;

    await User.findByIdAndUpdate(
      req.userId,
      { platforms },
      { returnDocument: "after" }
    );

    res.json({
      message: "Saved",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const livePlatforms = await fetchRealTimeStats(
      user.platforms
    );

    const responseData =
      buildDashboardResponse(livePlatforms);

    res.json(responseData);

  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/* ================= EXPORTS ================= */

module.exports = {
  getMe,
  saveAccounts,
  getDashboard,
};