const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message = 'Too many requests, please try again later.') =>
  rateLimit({
    windowMs,
    limit: max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skip: (req) =>
      ['/health', '/api-docs', '/docs.json'].includes(req.path),
  });

// Limiters
exports.globalLimiter = createLimiter(60 * 1000, 100);
exports.authLimiter = createLimiter(5 * 60 * 1000, 5);
exports.paymentLimiter = createLimiter(60 * 1000, 20);
exports.webhookLimiter = createLimiter(60 * 1000, 50);
exports.publicLimiter = createLimiter(60 * 1000, 200);

// Apply
exports.applyRateLimits = (app) => {
  app.use(exports.globalLimiter);
  console.log('🛡️ Rate limiting enabled globally');
};