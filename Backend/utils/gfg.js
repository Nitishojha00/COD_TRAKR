const puppeteer = require("puppeteer");

async function fetchGFG(username) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    const url = `https://www.geeksforgeeks.org/profile/${username}?tab=activity`;

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 🔥 IMPORTANT FIX (give time for React to render)
    await new Promise((res) => setTimeout(res, 3000));

    const data = await page.evaluate(() => {
      const text = document.body.innerText;

      const getNumber = (regex) => {
        const match = text.match(regex);
        return match ? parseInt(match[1]) : 0;
      };

      return {
        solved: getNumber(/Problems Solved\s*:?(\d+)/i),
        rating: getNumber(/Coding Score\s*:?(\d+)/i),
        rank: getNumber(/Institute Rank\s*:?(\d+)/i),
        contests: 0,
      };
    });

    return {
      username,
      ...data,
    };

  } catch (err) {
    console.log("❌ GFG Error:", err.message);
    return {
      username,
      solved: 0,
      rating: 0,
      rank: 0,
      contests: 0,
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = fetchGFG;