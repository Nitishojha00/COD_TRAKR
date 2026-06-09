const express = require("express");
const router = express.Router();
const {LOGIN , signUpGenerateOTP , signUpVerifyOTP} = require("../controllers/authController")

router.post("/signup-generate-otp", signUpGenerateOTP);
router.post("/signup-verify-otp", signUpVerifyOTP);
router.post("/login", LOGIN)

module.exports = router;

