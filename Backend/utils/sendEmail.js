const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "email-smtp.eu-north-1.amazonaws.com", // same region
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // SES SMTP username
    pass: process.env.SMTP_PASS, // SES SMTP password
  },
});

const sendEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Nitish" <no-reply@nitishojha.in>`, // ⚠️ must be verified domain
      to: email,
      subject: "Email Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 2 minutes.</p>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ sendEmail Error:", error.message);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;