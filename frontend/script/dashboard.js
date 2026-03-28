

  const API = "http://127.0.0.1:4000";
  axios.defaults.baseURL = API;
  axios.defaults.withCredentials = true;

  const totalSolvedEl = document.getElementById("totalSolved");
  const totalContestsEl = document.getElementById("totalContests");
  const bestRatingEl = document.getElementById("bestRating");
  const platformCountEl = document.getElementById("platformCount");
  const platformStats = document.getElementById("platformStats");

  const lcInput = document.getElementById("lc");
  const cfInput = document.getElementById("cf");
  const ccInput = document.getElementById("cc");
  const gfgInput = document.getElementById("gfg");

  async function loadUser() {
    try {
      const res = await axios.get("/api/dashboard/me");
      document.getElementById("user").innerText = res.data.name;

      const p = res.data.platforms || {};
      lcInput.value = p.LeetCode?.username || "";
      cfInput.value = p.Codeforces?.username || "";
      ccInput.value = p.CodeChef?.username || "";
      gfgInput.value = p.GFG?.username || "";

      await loadStats();
    } catch {
      logout();
    }
  }

  async function loadStats() {
    try {
      platformStats.innerHTML = '<div style="text-align:center">Loading stats...</div>';
      const res = await axios.get("/api/dashboard/dashboard");
      updateDashboardUI(res.data);
    } catch {
      platformStats.innerHTML = "<p style='color:#ef4444'>Failed to load stats</p>";
    }
  }

  async function saveAccounts() {
    const platforms = {};
    if (lcInput.value) platforms.LeetCode = { username: lcInput.value };
    if (cfInput.value) platforms.Codeforces = { username: cfInput.value };
    if (ccInput.value) platforms.CodeChef = { username: ccInput.value };
    if (gfgInput.value) platforms.GFG = { username: gfgInput.value };

    try {
      await axios.post("/api/dashboard/accounts", { platforms });
      alert("Accounts saved successfully!");
      await loadStats();
    } catch {
      alert("Failed to save accounts");
    }
  }

  function updateDashboardUI(data) {
    const { platforms, totalSolved, totalContests, bestRating, platformCount } = data;

    totalSolvedEl.innerText = totalSolved;
    totalContestsEl.innerText = totalContests;
    bestRatingEl.innerText = bestRating;
    platformCountEl.innerText = platformCount;

    let html = "";
    for (let p in platforms) {
      const s = platforms[p];
      if (!s.username) continue;

      html += `
        <div class="platform">
          <h4><i class="fa-brands fa-${p.toLowerCase()}"></i> ${p}</h4>
          <small>${s.profile || s.username}</small>
          <div class="stats-grid">
            <div class="stat-box"><p>Solved</p><h3>${s.solved || 0}</h3></div>
            <div class="stat-box"><p>Contests</p><h3>${s.contests || 0}</h3></div>
            <div class="stat-box"><p>Rating</p><h3>${s.rating || 0}</h3></div>
            <div class="stat-box"><p>Rank</p><h3>${s.rank || 0}</h3></div>
          </div>
        </div>
      `;
    }
    platformStats.innerHTML = html || "<p>No platforms linked yet.</p>";
  }

  async function logout() {
    try {
      await axios.post("/logout");
    } catch {}
    window.location.replace("login.html");
  }

  loadUser();

  // Dark mode
  const toggleBtn = document.getElementById("theme-toggle");
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
  }
