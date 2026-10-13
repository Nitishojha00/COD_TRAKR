
const axios = require("axios");

const sendEmail = async (email, otp) => {
  try {
    const res = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "Nitish <auth@nitishojha.in>",
        to: [email],
        subject: "Email Verification OTP",
        html: `
          <h2>Email Verification</h2>
          <h1 style="letter-spacing: 6px;">${otp}</h1>
          <p>This OTP is valid for 2 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        `,
        text: `Your email verification OTP is ${otp}. This OTP is valid for 2 minutes.`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    return res.data;
  } catch (error) {
    console.error(
      "sendEmail Error:",
      error.response?.data || error.message
    );

    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;
