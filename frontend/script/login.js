const API = "https://codtrakr.nitishojha.in";
  axios.defaults.withCredentials = true;

  async function login() {
    try {
      await axios.post(`${API}/api/auth/login`, {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      });
      window.location.href = "dashboard.html";
    } catch (err) {
      alert(err.response?.data || "Login failed");
    }
  }

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