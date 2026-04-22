// // middleware/index.js
// const swaggerMiddleware = require("../config/swagger");
// const cors = require("cors");
// const morgan = require("morgan");
// const helmet = require("helmet");
// const bodyParser = require("body-parser");

// module.exports = (app) => {
//   // Enhanced security headers
//   app.use(helmet({
//     contentSecurityPolicy: process.env.NODE_ENV !== 'production' ? false : undefined,
//     crossOriginEmbedderPolicy: false
//   }));

//   // Secure CORS
//   const allowedOrigins = process.env.NODE_ENV === 'production'
//     ? (process.env.CORS_ORIGINS || 'https://app.amstapay.com').split(',')
//     : true;
  
//   app.use(cors({ 
//     origin: allowedOrigins,
//     credentials: true,
//     optionsSuccessStatus: 200 
//   })); // Fixed syntax

//   // Request logging (dev mode only)
//   if (process.env.NODE_ENV === "development") {
//     app.use(morgan("dev"));
//   }

//   // Parse incoming JSON requests
//   app.use(bodyParser.json({ limit: "10mb" }));
//   app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// // Rate limiting (security)
//   const rateLimit = require('./rateLimit');
//   rateLimit.applyRateLimits(app);

//   // Swagger API documentation (dev only)
//   if (process.env.NODE_ENV !== 'production') {
//     swaggerMiddleware(app);
//   }

// };




// middleware/index.js
const swaggerMiddleware = require("../config/swagger");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");


module.exports = (app) => {
  // Trust proxy (IMPORTANT for rate limit + real IP)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV !== 'production' ? false : undefined,
    crossOriginEmbedderPolicy: false
  }));

  // CORS (no restriction for now)
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Body parsing
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

  // Rate limiting
  const rateLimit = require('./rateLimit');
  rateLimit.applyRateLimits(app);

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    swaggerMiddleware(app);
  }
};