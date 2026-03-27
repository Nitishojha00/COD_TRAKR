const axios = require("axios");

// 🔥 Create axios instance
const axiosInstance = axios.create({
  timeout: 20000, // default timeout
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://leetcode.com",
    "Origin": "https://leetcode.com",
  },
});

// 🔁 Optional: Request interceptor (for logging/debug)
axiosInstance.interceptors.request.use(
  (config) => {
    // console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔁 Optional: Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("❌ Axios Error:", error.message);
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;