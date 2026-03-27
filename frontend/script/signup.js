  const API = "https://codolio-clone.onrender.com";
  axios.defaults.withCredentials = true;
  let signupId = null;

  async function generateOTP() {
    try {
      const res = await axios.post(`${API}/api/auth/signup-generate-otp`, {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      });
      signupId = res.data.signupId;
      document.getElementById("userExistsMsg").style.display = "none";
    } catch (err) {
      const msg = err.response?.data;
      if (msg === "User already registered") {
        document.getElementById("userExistsMsg").style.display = "block";
      } else {
        document.getElementById("userExistsMsg").style.display = "none";
      }
      console.log(msg || err);
    }
  }

  async function verifyOTP() {
    try {
      await axios.post(`${API}/api/auth/signup-verify-otp`, {
        signupId,
        otp: document.getElementById("otp").value
      });
      window.location.href = "dashboard.html";
    } catch (err) {
      console.log(err.response?.data || err);
    }
  }

  // Dark mode toggle (matches portfolio)
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