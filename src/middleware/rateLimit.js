const rateLimit = require('express-rate-limit');
const AuditLog = require('../models/AuditLog');

const createLimiter = (windowMs, max, message = 'Too many requests, please try again later.', options = {}) =>
  rateLimit({
    windowMs,
    limit: max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skip: (req) => ['/health', '/api-docs', '/docs.json'].includes(req.path),
    ...options,
  });

exports.globalLimiter = createLimiter(60 * 1000, 100);
exports.authLimiter = createLimiter(5 * 60 * 1000, 5, 'Too many auth attempts. Try again in 5 minutes.');
exports.strictAuthLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many attempts. Account temporarily restricted.', {
  skipSuccessfulRequests: false,
});
exports.paymentLimiter = createLimiter(60 * 1000, 20);
exports.webhookLimiter = createLimiter(60 * 1000, 50);
exports.publicLimiter = createLimiter(60 * 1000, 200);
exports.withdrawalLimiter = createLimiter(60 * 1000, 5, 'Too many withdrawal requests. Slow down.');

exports.applyRateLimits = (app) => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    exports.globalLimiter = createLimiter(60 * 1000, 500);
    exports.authLimiter = createLimiter(5 * 60 * 1000, 25);
    console.log('Rate limiting active with relaxed limits (dev mode)');
  } else {
    console.log('Rate limiting enabled globally');
  }

  app.use(exports.globalLimiter);

  const authPaths = ['/api/v1/auth/login', '/api/v1/auth/signup',
    '/api/v1/auth/forgot-password', '/api/v1/auth/forgot-pin',
    '/api/v1/auth/verify-email', '/api/v1/auth/verify-reset-code'];

  authPaths.forEach(path => {
    app.use(path, exports.authLimiter);
  });

  app.use('/api/v1/wallets/withdraw', exports.withdrawalLimiter);
  app.use('/api/v1/webhook', exports.webhookLimiter);
};
