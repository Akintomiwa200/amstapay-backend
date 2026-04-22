// src/middleware/validation.js - Input Sanitization & Validation
const { body, validationResult, query, param } = require('express-validator');
const { matchedData } = require('express-validator');

const createResponse = (success, message, data, statusCode = 200) => ({
  success,
  message,
  data,
  timestamp: new Date().toISOString(),
  statusCode
});

// ===== Common Validators =====
const validateEmail = body('email')
  .isEmail().withMessage('Valid email required')
  .normalizeEmail();

const validatePassword = body('password')
  .isLength({ min: 8 }).withMessage('Password min 8 chars')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/).withMessage('Password: 1 upper, 1 lower, 1 number');

const validatePhone = body('phone')
  .isMobilePhone('en-NG').withMessage('Valid Nigerian phone required')
  .optional();

const validateAmount = body('amount')
  .isFloat({ min: 0.01 }).withMessage('Amount > 0')
  .toFloat();

const validateRequired = (field) => body(field).notEmpty().withMessage(`${field} required`);

// ===== Result Handler =====
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json(createResponse(false, errorMsg, null, 400));
  }
  req.validatedData = matchedData(req, { locations: ['body', 'query', 'params'] });
  next();
};

// ===== Auth Validators =====
exports.authSignup = [
  validateRequired('fullName'),
  validateEmail,
  validatePhone,
  validatePassword,
  body('termsAgreed').isBoolean().withMessage('Terms must be accepted'),
  this.validate
];

exports.authLogin = [
  validateEmail,
  body('password').notEmpty().withMessage('Password required'),
  this.validate
];

// ===== Payment Validators =====
exports.validatePayment = [
  validateRequired('amount'),
  validateAmount,
  body('recipient').optional().isMobilePhone('en-NG'),
  body('reference').optional().isUUID(),
  this.validate
];

// ===== User Validators =====
exports.validateUserUpdate = [
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('dateOfBirth').optional().isISO8601(),
  body('pin').optional()
    .isLength({ min: 4, max: 6 })
    .matches(/^\\d+$/).withMessage('PIN: 4-6 digits'),
  this.validate
];

// ===== MongoDB Sanitization Helper =====
exports.sanitizeMongoQuery = (query) => {
  // Prevent $where, $regex injection
  const dangerous = ['$where', '$regex', '$near'];
  Object.keys(query).forEach(key => {
    if (dangerous.includes(key) || (typeof query[key] === 'string' && query[key].includes('javascript:'))) {
      delete query[key];
    }
  });
  return query;
};

console.log('🧹 Validation middleware ready');

