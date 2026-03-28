# 🚀 Cod_Trakr – Competitive Programming Tracker

**Track your journey. Level up with AI-powered guidance.**

Cod_Trakr is a full-stack platform designed to help competitive programmers monitor their performance across multiple coding platforms, organize their learning with personal notes, and receive intelligent, personalized problem recommendations through an integrated engine API.

Whether you’re just starting out or aiming for the top, Cod_Trakr gives you the tools to understand where you stand and what to do next.

---

## 🎯 Project Vision & Goal

The core goal behind building Cod_Trakr was not just to aggregate data, but to create a **complete competitive programming companion** that helps users grow consistently and intelligently.

While most platforms show isolated stats, Cod_Trakr aims to solve a deeper problem:

> **“How can a programmer understand their real progress and improve in a structured way?”**

### 💡 What I Wanted to Build

* Track entire coding journey from **day one**

* Unified dashboard showing:

  * Current level
  * Strengths & weaknesses
  * Platform-wise performance

* AI-powered recommendation engine:

  * Suggest next problems based on skill
  * Detect weak topics
  * Guide structured improvement

* Personal learning system:

  * Notes for problems
  * Important question tracking
  * Custom learning path

---

## 🚀 Long-Term Vision

Cod_Trakr is not just a tracker — it is a **smart learning engine**.

Future goals:

* Personalized recommendations (like a coding mentor)
* Smart difficulty progression
* Real-time analytics
* Community features
* More platform integrations

---

## 🎯 Final Aim

> Any user — beginner to advanced — can track, understand, and improve their coding journey with the right guidance.

Transforming **data → direction 🚀**

---

## ✨ Current Features

### 📊 Multi-Platform Data Aggregation

* Fetches stats from LeetCode, Codeforces, CodeChef, GFG
* Unified dashboard for solved problems, ratings, contests

### 🔐 Secure Authentication (OTP)

* AWS SES email verification
* OTP stored in Redis (120s TTL)
* Rate limit: 30 OTP / 1 hours (Depend On Number Of Users)

### 🧠 Intelligent Caching

* Dashboard cached (24h TTL)
* Background refresh after 30 mins
* Redis locking prevents duplicate jobs

### 📝 Notes & Progress Tracking

* CRUD notes (problemId, tags, stars, link)
* Filters: tag, stars, importance
* Redis cache invalidation on updates

### 🤖 AI Roadmap

* Analyzes performance
* Generates learning plan
* Base for recommendation engine

### 📱 Dashboard

* Solved problems, ratings, contests
* Fast UI (Vanilla JS)

### 🔒 Security

* JWT in HTTP-only cookies
* Input validation
* bcrypt hashing

---

## 🛠️ Tech Stack (Production-Level)

### 🚀 Backend

* **Node.js + Express.js** – RESTful API server (modular & scalable architecture)
* **MongoDB + Mongoose** – Schema-based data modeling for users & notes
* **Redis (ioredis)** – Caching, OTP storage, and rate limiting

---

### 🔐 Authentication & Security

* **JWT (jsonwebtoken)** – Secure authentication via HTTP-only cookies
* **bcrypt & bcryptjs** – Password hashing with salt rounds
* **validator** – Input validation (email, password, sanitization)
* **cookie-parser & CORS** – Secure cookie handling and cross-origin setup

---

### 📧 Email & Communication

* **AWS SES (@aws-sdk/client-ses)** – OTP email delivery
* **Nodemailer / Brevo SDK** – Backup email service & flexibility (Brevo -> 300 mail/day free but slow)

---

### 🧠 Data Fetching & Scraping

* **Puppeteer + puppeteer-extra (stealth plugins)** – Scraping dynamic platforms
* **Playwright** – Alternative headless browser for reliability
* **Cheerio** – Fast HTML parsing for lightweight scraping
* **Axios** – HTTP client for API-based data fetching

---

### ⚡ Performance & Optimization

* **Redis TTL caching** – 24h cache + smart invalidation
* **Rate limiting (Redis counters)** – Prevent OTP abuse

---

### 🧩 DevOps & Utilities

* **dotenv** – Environment variable management
* **Nodemon** – Development auto-reload
* **User-Agent rotation** – Avoid scraping detection

---

### 🌐 Frontend

* **HTML5, CSS3, Vanilla JavaScript** – Lightweight & fast UI
* **Axios** – API communication
* **LocalStorage** – Theme persistence (dark/light mode)

---

### 🧱 Architecture Style

* REST API (feature-based routing: auth, dashboard, notes)
* Cache-first strategy with background refresh
* Scalable design ready for microservices (future engine API)


---

## 🏗️ Architecture

Frontend ⇄ Backend (Express API)
Backend ⇄ MongoDB + Redis + AWS SES

---

## 🔐 Authentication Flow

1. User signup → OTP generated
2. OTP stored in Redis (2 min)
3. Email sent via SES
4. OTP verified → user created
5. JWT cookie issued

---

## ⚡ Caching System

### Dashboard

* First request → fetch + cache
* Next → serve cache
* If stale → background refresh

### Notes

* Cached per user
* Cleared on create/update/delete

---

## 🚦 Rate Limiting

* 3 OTP per email / 3 hours
* Redis counter + expiry

---

## 📦 Setup Instructions

### Prerequisites

* Node.js (v18+)
* MongoDB
* Redis
* AWS SES

---

### 1. Clone

```bash
git clone https://github.com/yourusername/cod_trakr.git
cd cod_trakr
```

### 2. Install

```bash
cd Backend
npm install
```

### 3. Environment Variables (.env)

```env
PORT=4000
MONGO_URI=your_mongodb_uri
JWT_KEY=your_secret
NODE_ENV=production

REDIS_USER_NAME=default
REDIS_USER_PASS=your_password
REDIS_USER_HOST=your_host
REDIS_USER_PORT=your_port

AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
AWS_REGION=your_region

API_URI=your_backend_url
```

### 4. Run Backend

```bash
cd backend
npx nodemon index.js
```

### 5. Run Frontend

```bash
cd frontend
Use Live Server to Open .html file
```

---

## 📡 API Endpoints 

### 🔐 Authentication

* POST `/api/auth/login`
* POST `/api/auth/signup-generate-otp`
* POST `/api/auth/signup-verify-otp`
* POST `/logout`

---

### 👤 User & Dashboard

* GET `/api/dashboard/me` → Get current user + platforms
* POST `/api/dashboard/accounts` → Save/update platform usernames
* GET `/api/dashboard/dashboard` → Get aggregated stats

---

### 📝 Notes (Problem Tracker)

#### Create / Update / Delete

* POST `/api/notes/new` → Create problem
* PUT `/api/notes/problem/:id` → Update problem
* DELETE `/api/notes/problem/:id` → Delete problem

#### Fetch

* GET `/api/notes/problem` → Get all problems (paginated)
* GET `/api/notes/problemById/:id` → Get single problem
* GET `/api/notes/problemByImportance` → Get by importance
* GET `/api/notes/tag/:tag` → Get by tag
* GET `/api/notes/stars/:stars` → Get by stars

---

### ⚙️ Query Params

* `?page=1` → Pagination supported on list endpoints

---

### 📌 Notes

* All protected routes require authentication (JWT via cookies)
* `withCredentials: true` is required on frontend
* Base URL:

```
https://codolio-clone.onrender.com
```

---

## 🔍 Key Implementation

### OTP System

* Redis TTL (2 min)
* Rate limiting (1hr window)

### Dashboard Refresh

* Cache + background job
* Redis lock

### Scrapers

* Per-platform modules
* Fault-tolerant

### Cache Invalidation

* Redis SCAN + delete

### Security

* HTTP-only cookies
* Validation + hashing

---

## 🚧 Future Enhancements

* Recommendation Engine API
* More platforms (AtCoder, HackerRank)
* WebSockets (real-time updates)
* Analytics charts
* Goal tracking
* React frontend
* Testing

---

## 📄 License

MIT License

---

## 🙏 Acknowledgements

* Competitive programming platforms
* Redis Cloud
* AWS SES

---

## ❤️ Built with Love

**Nitish Ojha**
