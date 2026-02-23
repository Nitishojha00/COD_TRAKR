const axios = require("axios");

const sendEmail = async (email, otp) => {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Nitish",
          email: "nitishojha00@gmail.com"
        },
        to: [{ email }],
        subject: "Email Verification OTP",
        htmlContent: `
          <h2>Email Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP is valid for 2 minutes.</p>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY, // 🔑 API KEY
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    return res.data;

  } catch (error) {
    console.error("sendEmail Error:", 
      error.response?.data || error.message
    );

    // throw again so controller can handle it
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;