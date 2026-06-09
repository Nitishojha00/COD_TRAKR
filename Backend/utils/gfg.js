const axios = require("../config/axiosConfig");
const redisClient = require("../config/redis");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { chromium } = require("playwright");

puppeteer.use(StealthPlugin());

let puppeteerBrowser;
let playwrightBrowser;

/* ================= BROWSER HELPERS ================= */

async function getPuppeteer() {
  if (!puppeteerBrowser) {
    puppeteerBrowser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return puppeteerBrowser;
}

async function getPlaywright() {
  if (!playwrightBrowser) {
    playwrightBrowser = await chromium.launch({
      headless: true,
    });
  }
  return playwrightBrowser;
}

/* ================= CACHE HELPER ================= */

async function saveAndReturn(cacheKey, result) {
  await redisClient.setEx(
    cacheKey,
    86400, // 1 day
    JSON.stringify(result)
  );

  return result;
}

/* ================= MAIN FUNCTION ================= */

async function fetchGFG(username) {
  const result = { solved: 0, rating: 0 };
  const cacheKey = `gfg:${username}`;
  const url = `https://www.geeksforgeeks.org/profile/${username}/?tab=activity`;

  /* ================= CACHE CHECK ================= */

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.log("⚡ GFG served from cache");
    return JSON.parse(cached);
  }

  console.log(`🔍 GFG: Attempting for ${username}...`);

  /* =====================================================
     STRATEGY 1: AXIOS + CHEERIO (FASTEST)
  ===================================================== */

  try {
    const res = await axios.get(url, { timeout: 10000 });

    const $ = cheerio.load(res.data);
    const text = $("body").text();

    const solvedMatch = text.match(/Problems\s*Solved\s*(\d+)/i);
    const scoreMatch = text.match(/Coding\s*Score\s*(\d+)/i);

    if (solvedMatch) result.solved = parseInt(solvedMatch[1]);
    if (scoreMatch) result.rating = parseInt(scoreMatch[1]);

    if (result.solved > 0) {
      console.log("✅ GFG (Cheerio success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("GFG ⚠️ Cheerio failed");
  }

  /* =====================================================
     STRATEGY 2: PLAYWRIGHT
  ===================================================== */

  try {
    const browser = await getPlaywright();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    const content = await page.content();

    const $ = cheerio.load(content);
    const text = $("body").text();

    const solvedMatch = text.match(/Problems\s*Solved\s*(\d+)/i);
    const scoreMatch = text.match(/Coding\s*Score\s*(\d+)/i);

    if (solvedMatch) result.solved = parseInt(solvedMatch[1]);
    if (scoreMatch) result.rating = parseInt(scoreMatch[1]);

    await page.close();

    if (result.solved > 0) {
      console.log("✅ GFG (Playwright success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("GFG ⚠️ Playwright failed");
  }

  /* =====================================================
     STRATEGY 3: PUPPETEER STEALTH
  ===================================================== */

  try {
    const browser = await getPuppeteer();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    const content = await page.content();

    const $ = cheerio.load(content);
    const text = $("body").text();

    const solvedMatch = text.match(/Problems\s*Solved\s*(\d+)/i);
    const scoreMatch = text.match(/Coding\s*Score\s*(\d+)/i);

    if (solvedMatch) result.solved = parseInt(solvedMatch[1]);
    if (scoreMatch) result.rating = parseInt(scoreMatch[1]);

    await page.close();

    if (result.solved > 0) {
      console.log("✅ GFG (Puppeteer success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("GFG ❌ Puppeteer failed");
  }

  console.log("GFG ❌ All strategies failed");
  return result;
}

module.exports = fetchGFG;