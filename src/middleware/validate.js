const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

exports.signup = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phoneNumber").matches(/^(\+234|0)[0-9]{10}$/).withMessage("Valid Nigerian phone number required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number"),
  body("pin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("PIN must be 4-6 digits"),
  body("accountType").isIn(["personal", "business", "enterprise", "company", "agent"]).withMessage("Invalid account type"),
  handleValidationErrors,
];

exports.login = [
  body("email").optional().isEmail().normalizeEmail(),
  body("phoneNumber").optional(),
  body("password").notEmpty().withMessage("Password required"),
  handleValidationErrors,
];

exports.fundWallet = [
  body("amount").isFloat({ min: 100 }).withMessage("Minimum deposit is ₦100"),
  handleValidationErrors,
];

exports.transfer = [
  body("recipientAccountNumber").matches(/^\d{10}$/).withMessage("Valid 10-digit account number required"),
  body("amount").isFloat({ min: 50 }).withMessage("Minimum transfer is ₦50"),
  body("pin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("Valid PIN required"),
  handleValidationErrors,
];

exports.withdraw = [
  body("amount").isFloat({ min: 100 }).withMessage("Minimum withdrawal is ₦100"),
  body("bankCode").notEmpty().withMessage("Bank code required"),
  body("accountNumber").matches(/^\d{10}$/).withMessage("Valid 10-digit account number required"),
  body("pin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("Valid PIN required"),
  handleValidationErrors,
];

exports.loanApplication = [
  body("amount").isFloat({ min: 5000 }).withMessage("Minimum loan is ₦5,000"),
  body("purpose").isIn(["PERSONAL", "BUSINESS", "EDUCATION", "MEDICAL", "HOME_IMPROVEMENT", "OTHER"]),
  body("duration").isInt({ min: 3, max: 60 }).withMessage("Duration 3-60 months"),
  body("employmentStatus").isIn(["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "STUDENT", "RETIRED", "BUSINESS_OWNER"]),
  body("monthlyIncome").isFloat({ min: 0 }),
  handleValidationErrors,
];

exports.pinRequired = [
  body("pin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("Valid 4-6 digit PIN required"),
  handleValidationErrors,
];

exports.idParam = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

exports.purchaseInsurance = [
  body("insuranceType").isIn(["life", "health", "travel", "gadget"]).withMessage("Invalid insurance type"),
  body("coverageAmount").isFloat({ min: 10000 }).withMessage("Minimum coverage is ₦10,000"),
  body("premiumFrequency").optional().isIn(["monthly", "quarterly", "yearly"]),
  handleValidationErrors,
];

exports.referralApply = [
  body("code").trim().notEmpty().withMessage("Referral code required"),
  handleValidationErrors,
];

exports.changePassword = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Must contain uppercase letter")
    .matches(/[0-9]/).withMessage("Must contain a number"),
  handleValidationErrors,
];

exports.updatePin = [
  body("currentPin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("Valid current PIN required"),
  body("newPin").isLength({ min: 4, max: 6 }).isNumeric().withMessage("New PIN must be 4-6 digits"),
  handleValidationErrors,
];
