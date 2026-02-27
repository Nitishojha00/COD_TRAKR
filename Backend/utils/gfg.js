const axios = require("../config/axiosConfig");
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

/* ================= MAIN FUNCTION ================= */

async function fetchGFG(username) {
  const result = { solved: 0, rating: 0 };
  const url = `https://www.geeksforgeeks.org/profile/${username}/?tab=activity`;

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
      return result;
    }
  } catch (err) {
    console.log("⚠️ Cheerio failed");
  }

  /* =====================================================
     STRATEGY 2: PLAYWRIGHT (MORE STABLE THAN PUPPETEER)
  ===================================================== */
  try {
    const browser = await getPlaywright();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(5000); // allow dynamic content

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
      return result;
    }
  } catch (err) {
    console.log("⚠️ Playwright failed");
  }

  /* =====================================================
     STRATEGY 3: PUPPETEER STEALTH (LAST RESORT)
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
      return result;
    }
  } catch (err) {
    console.log("❌ Puppeteer failed");
  }

  console.log("❌ All strategies failed");
  return result;
}

module.exports = fetchGFG;