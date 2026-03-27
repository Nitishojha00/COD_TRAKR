const axios = require("axios");
const puppeteer = require("puppeteer");

async function fetchCodeChef(username) {
  const result = {
    username,
    rating: 0,
    stars: "N/A",
    solved: 0,
    contests: 0,
  };

  try {
    const url = `https://www.codechef.com/users/${username}`;

    // ✅ 1. FAST PART (Axios)
    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000,
      });

      const html = response.data;

      // Rating + Stars
      const ratingMatch = html.match(/rating-number[^>]*>(\d+)</);
      const starsMatch = html.match(/rating-star[^>]*>([^<]+)</);

      if (ratingMatch) {
        result.rating = parseInt(ratingMatch[1]);
      }

      if (starsMatch) {
        result.stars = starsMatch[1].trim();
      }

      // Solved Problems
      const patterns = [
        /Fully Solved\s*\(?(\d+)\)?/i,
        /Total Problems Solved:\s*(\d+)/i,
        /Problems Solved\s*:?(\d+)/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          result.solved = parseInt(match[1]);
          break;
        }
      }

    } catch (err) {
      console.log("⚠️ Axios failed, continuing...");
    }

    // ✅ 2. CONTESTS (Puppeteer only if needed)
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"],
      });

      const page = await browser.newPage();

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await page.waitForSelector("body", { timeout: 10000 });

      const contests = await page.evaluate(() => {
        const text = document.body.innerText;

        const patterns = [
          /(\d+)\s+Contests/i,
          /Contests\s*Participated\s*:?(\d+)/i,
          /(\d+)\s+contests\s+attended/i,
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) return parseInt(match[1]);
        }

        // 🔥 fallback: graph points
        const graphPoints = document.querySelectorAll("circle");
        if (graphPoints.length > 0) {
          return graphPoints.length;
        }

        return 0;
      });

      result.contests = contests;

      await browser.close();

    } catch (err) {
      console.log("⚠️ Puppeteer contest fetch failed:", err.message);
    }

    return result;

  } catch (err) {
    console.log("❌ CodeChef fetch failed:", err.message);
    return result;
  }
}

module.exports = fetchCodeChef;