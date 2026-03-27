const axios = require("../config/axiosConfig");

async function fetchGFG(username) {
  const result = { solved: 0, rating: 0 };
  
  try {
    // Official GFG API endpoint - returns clean JSON data
    const apiUrl = `https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${username}&article_count=false&redirect=true`;
    
    console.log(`🔍 GFG: Fetching ${username} via official API...`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // The API returns data directly in response.data
    const data = response.data;
    
    if (data) {
      // Extract solved problems count
      if (data.solved_problem_count) {
        result.solved = parseInt(data.solved_problem_count);
      }
      
      // Extract score/rating (the API returns it as "score")
      if (data.score) {
        result.rating = parseInt(data.score);
      }
      
      console.log(`✅ GFG API: Solved ${result.solved}, Score ${result.rating}`);
    } else {
      console.log('⚠️ GFG API returned empty data');
    }
    
  } catch (error) {
    console.log(`❌ GFG API failed: ${error.message}`);
    
    // Optional: Add your old puppeteer fallback here if needed
    // but the API should work consistently
  }
  
  return result;
}

module.exports = fetchGFG;