const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { NodeHttpHandler } = require("@smithy/node-http-handler");

// 🔥 SES Client (FIXED)
const ses = new SESClient({
  region: process.env.AWS_REGION || "eu-west-1", // ✅ stable region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10000, // ✅ connection timeout fix
    socketTimeout: 10000,     // ✅ socket timeout fix
  }),
});

const sendEmail = async (email, otp) => {
  try {
    console.log("📩 Sending email to:", email);
    console.log("🌍 Using region:", process.env.AWS_REGION);

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
              <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Email Verification</h2>
                <h1 style="color: #4CAF50;">${otp}</h1>
                <p>This OTP is valid for 2 minutes.</p>
              </div>
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
    console.error("❌ SES FULL ERROR:", error); // 🔥 full debug
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;