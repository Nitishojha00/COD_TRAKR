## Project structure

```
cod-trakr/
├── public/
│   └── index.html
├── src/
│   ├── api.js                   # axios instance (baseURL + withCredentials)
│   ├── App.jsx                  # router + routes
│   ├── index.js                 # ReactDOM entry
│   ├── styles/
│   │   └── global.css           # all styles (dark theme, layout, components)
│   ├── components/
│   │   └── Layout.jsx           # Sidebar + AppShell shared layout
│   └── pages/
│       ├── LoginPage.jsx
│       ├── SignupPage.jsx
│       ├── DashboardPage.jsx    # platform stats + link accounts
│       ├── NotesPage.jsx        # problem table + modals
│       └── AICoachPage.jsx      # chat UI + history + clear
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start
```

App runs on http://localhost:3000

## Routes

| Path         | Page            |
|--------------|-----------------|
| `/login`     | Login           |
| `/signup`    | Sign up         |
| `/dashboard` | Dashboard       |
| `/notes`     | Notes/Problems  |
| `/ai-coach`  | AI Coach        |

## What's preserved from original

- All API endpoints and payloads identical
- `withCredentials: true` on every request (cookie-based auth)
- Same navigation flow: login → dashboard, signup → dashboard
- Notes: create, edit, delete, view detail, paginate, filter by importance/stars/tag
- Dashboard: link accounts (LeetCode, Codeforces, CodeChef, GFG), show aggregated stats
- AI Coach: send messages, load history on mount, clear chat, markdown rendering

## Upgraded To React

- Pure React (no plain HTML/JS files)
- React Router for navigation — no page reloads between pages
- CSS variables for dark theme, auto light/dark via system preference
- Sidebar shared across all protected pages
- Mobile: sidebar slides in as a drawer with overlay
