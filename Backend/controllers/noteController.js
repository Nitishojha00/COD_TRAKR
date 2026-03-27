const mongoose = require("mongoose");
const Note = require("../models/Note");
const redisClient = require("../config/redis");

/* ==================================================
   🔥 HELPER: SAFE NOTES CACHE INVALIDATION (FIXED)
================================================== */
const clearUserCache = async (userId) => {
  try {
    if (!userId) return;

    let cursor = "0";
    const keysToDelete = [];

    do {
      const result = await redisClient.scan(
        cursor,
        "MATCH",
        `note*:${userId}:*`,
        "COUNT",
        100
      );

      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        keysToDelete.push(...keys);
      }

    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await redisClient.del(...keysToDelete);
    }

  } catch (err) {
    console.error("Redis Clear Error:", err);
  }
};

/* ==================================================
   🧠 HELPER: FETCH & CACHE
================================================== */
async function fetchAndCacheNotes(query, userId, page, limit, cacheKey) {
  try {
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ problemId: 1 })
        .select("problemId problemName tags problemLink stars")
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(query)
    ]);

    const response = {
      success: true,
      page,
      totalProblems: total,
      totalPages: Math.ceil(total / limit),
      count: notes.length,
      data: notes
    };

    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 86400);

    return response;
  } catch (error) {
    console.error("fetchAndCacheNotes Error:", error.message);

    return {
      success: false,
      page,
      totalProblems: 0,
      totalPages: 0,
      count: 0,
      data: [],
      error: error.message
    };
  }
}

/* ================= CONTROLLERS ================= */

/* 1️⃣ CREATE */
exports.createProblem = async (req, res) => {
  try {
    const userId = req.userId;
    let problemName = req.body.problemName?.trim().toLowerCase();

    const existing = await Note.findOne({ problemName, user: userId });
    if (existing) return res.status(409).json({ success: false, message: "Problem already exists" });

    const lastProblem = await Note.findOne({ user: userId })
      .sort({ problemId: -1 })
      .select("problemId");

    const currentMaxId = lastProblem ? lastProblem.problemId : 0;

    if (currentMaxId >= 50) {
      return res.status(409).json({ success: false, message: "Limit reached (50)" });
    }

    const note = await Note.create({
      ...req.body,
      problemName,
      problemId: currentMaxId + 1,
      user: userId
    });

    await clearUserCache(userId);

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* 2️⃣ GET ALL */
exports.getAllProblem = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;

    const cacheKey = `notes:all:${userId}:${page}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const query = { user: userId };
    const data = await fetchAndCacheNotes(query, userId, page, limit, cacheKey);

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* 3️⃣ GET SINGLE */
exports.getSingleProblem = async (req, res) => {
  try {
    const userId = req.userId;
    const problemId = Number(req.params.problemId);

    if (isNaN(problemId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const cacheKey = `note:${userId}:${problemId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached) });
    }

    const note = await Note.findOne({ user: userId, problemId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    await redisClient.set(cacheKey, JSON.stringify(note), "EX", 86400);

    res.status(200).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* 4️⃣ UPDATE */
exports.updateProblem = async (req, res) => {
  try {
    const userId = req.userId;
    const problemId = Number(req.params.problemId);

    if (isNaN(problemId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const updated = await Note.findOneAndUpdate(
      { user: userId, problemId },
      req.body,
      { returnDocument: "after", runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    await clearUserCache(userId);

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* 5️⃣ DELETE */
exports.deleteProblem = async (req, res) => {
  try {
    const userId = req.userId;
    const problemId = Number(req.params.problemId);

    if (isNaN(problemId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const deleted = await Note.findOneAndDelete({ user: userId, problemId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    await clearUserCache(userId);

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* 6️⃣ IMPORTANCE */
exports.getElementByImportance = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;

    const cacheKey = `notes:importance:${userId}:${page}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      Note.find({ user: userId })
        .sort({ stars: -1, problemId: 1 })
        .select("problemId problemName stars tags problemLink")
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments({ user: userId })
    ]);

    const response = {
      success: true,
      page,
      totalProblems: total,
      totalPages: Math.ceil(total / limit),
      count: notes.length,
      data: notes
    };

    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 86400);

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* 7️⃣ TAG */
exports.getElementByTag = async (req, res) => {
  try {
    const userId = req.userId;
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const cacheKey = `notes:tag:${userId}:${tag}:${page}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const query = { tags: { $in: [tag] }, user: userId };

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ stars: -1, problemId: 1 })
        .select("problemId problemName stars tags problemLink")
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(query)
    ]);

    const response = {
      success: true,
      page,
      totalProblems: total,
      totalPages: Math.ceil(total / limit),
      count: notes.length,
      data: notes
    };

    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 86400);

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* 8️⃣ STARS */
exports.getElementBySpecificStar = async (req, res) => {
  try {
    const userId = req.userId;
    const stars = parseInt(req.params.stars);
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const cacheKey = `notes:stars:${userId}:${stars}:${page}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const query = { stars, user: userId };

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ updatedAt: -1 })
        .select("problemId problemName stars tags problemLink")
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(query)
    ]);

    const response = {
      success: true,
      page,
      totalProblems: total,
      totalPages: Math.ceil(total / limit),
      count: notes.length,
      data: notes
    };

    await redisClient.set(cacheKey, JSON.stringify(response), "EX", 86400);

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};