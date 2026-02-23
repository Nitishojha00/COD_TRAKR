const validator = require("validator");

const validate = ({ email, password }) => {

  /* ---------- Required ---------- */
  if (!email || !password)
    throw new Error("Email and Password required");

  /* ---------- Email Validation ---------- */
  if (!validator.isEmail(email))
    throw new Error("Invalid Email");

  // industry limits
  if (!validator.isLength(email, { min: 5, max: 100 }))
    throw new Error("Email length invalid");

  /* ---------- Password Validation ---------- */
  const passwordRules = {
    minLength: 8,      // industry minimum
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    returnScore: false
  };

  if (!validator.isStrongPassword(password, passwordRules))
    throw new Error(
      "Password must be 8-128 chars with upper, lower, number & symbol"
    );

  // prevent abuse / DOS attacks
  if (!validator.isLength(password, { max: 128 }))
    throw new Error("Password too long");

  // no spaces allowed (common industry rule)
  if (password.includes(" "))
    throw new Error("Password cannot contain spaces");
};

module.exports = validate;