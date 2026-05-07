// src/middleware/validation.js
// Input Sanitization & Validation

const {
  body,
  validationResult,
  query,
  param,
  matchedData,
} = require("express-validator");

// ===== Standard API Response =====
const createResponse = (success, message, data = null, statusCode = 200) => ({
  success,
  message,
  data,
  timestamp: new Date().toISOString(),
  statusCode,
});

// ===== Common Validators =====

// Email
const validateEmail = body("email")
  .trim()
  .isEmail()
  .withMessage("Valid email required")
  .normalizeEmail();

// Email or Phone (for login)
const validateEmailOrPhone = body("emailOrPhone")
  .trim()
  .notEmpty()
  .withMessage("Email or phone number required");

// Password
const validatePassword = body("password")
  .trim()
  .isLength({ min: 8 })
  .withMessage("Password min 8 chars");

// Nigerian Phone
const validatePhone = body("phoneNumber")
  .optional()
  .trim()
  .isMobilePhone("en-NG")
  .withMessage("Valid Nigerian phone required");

// Amount
const validateAmount = body("amount")
  .isFloat({ min: 0.01 })
  .withMessage("Amount must be greater than 0")
  .toFloat();

// Required Field Helper
const validateRequired = (field) =>
  body(field).trim().notEmpty().withMessage(`${field} required`);

// ===== Validation Result Handler =====
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res
      .status(400)
      .json(
        createResponse(
          false,
          formattedErrors.map((e) => e.message).join("; "),
          formattedErrors,
          400,
        ),
      );
  }

  // Keep only validated/sanitized data
  req.validatedData = matchedData(req, {
    locations: ["body", "query", "params"],
    includeOptionals: true,
  });

  next();
};

exports.validate = validate;

// ===== Auth Validators =====

// Signup
exports.authSignup = [
  validateRequired("fullName"),

  validateEmail,

  validatePhone,

  validatePassword,

  body("accountType")
    .isIn(["personal", "business", "enterprise", "company", "agent"])
    .withMessage("accountType must be personal, business, enterprise, company, or agent"),

  body("dateOfBirth")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("dateOfBirth must be in DD/MM/YYYY format"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Invalid gender"),

  body("pin")
    .isLength({ min: 4, max: 6 })
    .withMessage("PIN must be 4-6 digits")
    .matches(/^\d+$/)
    .withMessage("PIN must contain only numbers"),

  body("bvnOrNin")
    .optional()
    .isLength({ min: 11, max: 11 })
    .withMessage("BVN/NIN must be 11 digits")
    .matches(/^\d+$/)
    .withMessage("BVN/NIN must contain only numbers"),

  body("termsAgreed").isBoolean().withMessage("Terms must be accepted"),

  body("infoAccurate")
    .optional()
    .isBoolean()
    .withMessage("infoAccurate must be boolean"),

  body("verificationConsent")
    .optional()
    .isBoolean()
    .withMessage("verificationConsent must be boolean"),

  validate,
];

// Login
exports.authLogin = [
  validateEmailOrPhone,

  body("password").trim().notEmpty().withMessage("Password required"),

  validate,
];

// ===== Payment Validators =====
exports.validatePayment = [
  validateAmount,

  body("recipient")
    .optional()
    .isMobilePhone("en-NG")
    .withMessage("Invalid recipient phone"),

  body("reference")
    .optional()
    .isUUID()
    .withMessage("Invalid transaction reference"),

  validate,
];

// ===== User Update Validators =====
exports.validateUserUpdate = [
  body("fullName")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("fullName must be 2-100 characters"),

  body("dateOfBirth")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Invalid date format"),

  body("pin")
    .optional()
    .isLength({ min: 4, max: 6 })
    .withMessage("PIN must be 4-6 digits")
    .matches(/^\d+$/)
    .withMessage("PIN must contain only numbers"),

  validate,
];

// ===== MongoDB Query Sanitization =====
exports.sanitizeMongoQuery = (mongoQuery) => {
  const dangerous = ["$where", "$regex", "$near", "$gt", "$lt"];

  Object.keys(mongoQuery).forEach((key) => {
    const value = mongoQuery[key];

    if (
      dangerous.includes(key) ||
      (typeof value === "string" && value.toLowerCase().includes("javascript:"))
    ) {
      delete mongoQuery[key];
    }
  });

  return mongoQuery;
};

console.log("🧹 Validation middleware ready");
