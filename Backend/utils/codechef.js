const axios = require("axios");
const redisClient = require("../config/redis");
const cheerio = require("cheerio");
const { chromium } = require("playwright");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

let playwrightBrowser;
let puppeteerBrowser;

/* ================= BROWSER HELPERS ================= */

async function getPlaywright() {
  if (!playwrightBrowser) {
    playwrightBrowser = await chromium.launch({ headless: true });
  }
  return playwrightBrowser;
}

async function getPuppeteer() {
  if (!puppeteerBrowser) {
    puppeteerBrowser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return puppeteerBrowser;
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

async function fetchCodeChef(user) {
  const result = { solved: 0, rating: 0 };
  const url = `https://www.codechef.com/users/${user}`;
  const cacheKey = `codechef:${user}`;

  /* ================= CACHE CHECK ================= */

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.log("⚡ CodeChef served from cache");
    return JSON.parse(cached);
  }

  console.log(`🔍 CODECHEF: Attempting for ${user}...`);

  /* =====================================================
     STRATEGY 1: AXIOS + CHEERIO
  ===================================================== */

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(res.data);

    const ratingText = $(".rating-number").first().text().trim();
    if (ratingText) result.rating = parseInt(ratingText);

    const solvedText = $("body").text();
    const match =
      solvedText.match(/Total Problems Solved:\s*(\d+)/i) ||
      solvedText.match(/Fully Solved\s*\((\d+)\)/i);

    if (match) result.solved = parseInt(match[1]);

    if (result.rating > 0 || result.solved > 0) {
      console.log("✅ CODECHEF (Axios success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("Codechef ⚠️ Axios failed, trying Playwright...");
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

    await page.waitForTimeout(4000);

    const content = await page.content();
    const $ = cheerio.load(content);

    const ratingText = $(".rating-number").first().text().trim();
    if (ratingText) result.rating = parseInt(ratingText);

    const solvedText = $("body").text();
    const match =
      solvedText.match(/Total Problems Solved:\s*(\d+)/i) ||
      solvedText.match(/Fully Solved\s*\((\d+)\)/i);

    if (match) result.solved = parseInt(match[1]);

    await page.close();

    if (result.rating > 0 || result.solved > 0) {
      console.log("✅ CODECHEF (Playwright success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("Codechef ⚠️ Playwright failed, trying Puppeteer...");
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

    await page.waitForTimeout(4000);

    const content = await page.content();
    const $ = cheerio.load(content);

    const ratingText = $(".rating-number").first().text().trim();
    if (ratingText) result.rating = parseInt(ratingText);

    const solvedText = $("body").text();
    const match =
      solvedText.match(/Total Problems Solved:\s*(\d+)/i) ||
      solvedText.match(/Fully Solved\s*\((\d+)\)/i);

    if (match) result.solved = parseInt(match[1]);

    await page.close();

    if (result.rating > 0 || result.solved > 0) {
      console.log("✅ CODECHEF (Puppeteer success)");
      return await saveAndReturn(cacheKey, result);
    }
  } catch (err) {
    console.log("❌ Codechef Puppeteer failed");
  }

  console.log("❌ Codechef All strategies failed");
  return result;
}

module.exports = fetchCodeChef;