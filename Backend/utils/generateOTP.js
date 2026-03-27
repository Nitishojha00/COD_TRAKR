const crypto = require("crypto");

const generateOTP = () => {

  // crypto.randomInt(1000, 10000)
  // ye 1000 se 9999 ke beech ek random number generate karega
  // (10000 exclusive hota hai, include nahi hota)
  
  // .toString() se number ko string me convert kar rahe hain
  // kyunki OTP generally string form me use hota hai (SMS / email etc.)
  return crypto.randomInt(1000, 10000).toString();
};

module.exports = generateOTP;