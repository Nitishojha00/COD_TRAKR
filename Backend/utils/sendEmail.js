const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// 🔥 SES Client
const ses = new SESClient({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const sendEmail = async (email, otp) => {
  try {
    const params = {
      Source: `"Nitish" <no-reply@nitishojha.in>`, // ✅ verified domain
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: "Email Verification OTP",
        },
        Body: {
          Html: {
            Data: `
              <h2>Email Verification</h2>
              <h1>${otp}</h1>
              <p>This OTP is valid for 2 minutes.</p>
            `,
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await ses.send(command);

    console.log("✅ Email sent:", response.MessageId);
    return response;

  } catch (error) {
    console.error("❌ SES Error:", error);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;