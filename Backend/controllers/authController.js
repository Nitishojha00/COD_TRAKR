const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const generateOTP = require("../utils/generateOTP");
const jwt = require("jsonwebtoken");
const validate = require("../utils/validator")

/* TEMP OTP STORE (simple testing) */
const limit = 4;

const redis = require("../config/redis");
const crypto = require("crypto");

const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 1000, // 1 hour
  sameSite: "None",      // 🔥 REQUIRED
  secure: true,          // 🔥 REQUIRED
  path: "/"
};

const LOGIN = async (req, res) => {
  try{
  const { email, password } = req.body;

  validate({ email, password });
  // console.log(1);
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("User not found");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).send("Wrong password");

  const token = jwt.sign(
        { _id: user._id, email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
  
  res.cookie("token", token, cookieOptions);
  res.send("Login successful");
}
catch(err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
};
};

const signUpGenerateOTP = async (req, res) => {

  try{
  const { name, email, password } = req.body; 

  validate({ email, password }); // ✅ FIXED
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).send("User already registered");

  /* ================= RATE LIMIT (ATOMIC & SAFE) ================= */
  const limitKey = `otp_limit:${email}`;

  const count = await redis.incr(limitKey); // 🔒 atomic

  if (count === 1) {
    await redis.expire(limitKey, 3 * 60 * 60); // 3 hours
  }

  if (count > limit) {
    return res
      .status(429)
      .send("OTP limit exceeded. Try again after 3 hours.");
  }

  /* ================= OTP GENERATION ================= */
  const otp = generateOTP();
  const [hashedPassword, hashedOTP] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(otp, 10)
  ]);
  const signupId = crypto.randomUUID();

  /* ================= STORE TEMP DATA ================= */
  await redis.set(
    `signup:${signupId}`,
    JSON.stringify({
      name,
      email,
      password: hashedPassword,
      otp: hashedOTP
    }),
    { EX: 5*60 } // 5 minutes
  );

  try {
  /* ================= SEND EMAIL ================= */
      await sendEmail(email, otp);
    }
    catch(err) {

      // rollback
      await Promise.allSettled([
        redis.decr(limitKey),
        redis.del(`signup:${signupId}`)
      ]);

      throw err;
    }

  res.json({
    message: "OTP sent",
    signupId
  });
}
catch(err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
}
}

const signUpVerifyOTP = async (req, res) => {
  try{
  const { signupId, otp } = req.body;

  const data = await redis.get(`signup:${signupId}`);
  if (!data) {
    return res.status(400).send("OTP expired");
  }

  const parsed = JSON.parse(data);

  const isMatch = await bcrypt.compare(otp, parsed.otp);
  if (!isMatch) {
    return res.status(400).send("Invalid OTP");
  }
  
  // console.log(parsed.name);
  const user = await User.create({
    name: parsed.name,
    email: parsed.email,
    password: parsed.password
  });

  // delete redis entry after success
  await redis.del(`signup:${signupId}`);

  const token = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
  res.cookie("token", token, cookieOptions);
  res.send("Signup successful");
}
catch(err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
}
}

module.exports = {
    LOGIN,
    signUpGenerateOTP,
    signUpVerifyOTP
}