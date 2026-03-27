// cookie settings define kar rahe hain
const cookieOptions = {

  // JS se access nahi hogi (secure)
  httpOnly: true,

  // 1 hour tak valid
  maxAge: 60 * 60 * 1000,

  // cross-site me cookie send hogi
  // Crosssite = jab frontend aur backend alag domain pe ho
 
  sameSite: "None",

  // sirf HTTPS pe chalegi
  secure: true,

  // poori site pe accessible
  path: "/"
};

// export for reuse
module.exports = cookieOptions;



// sameSite: "None",
// secure: true

// 👉 Ye dono saath me hi kaam karte hain (warna browser block kar dega)


 //   🧠 Short yaad rakh:

  // 👉 sameSite = "None"
  // ➡️ alag domain → cookie send ✅

  // 👉 sameSite = "Lax/Strict"
  // ➡️ alag domain → cookie block ❌