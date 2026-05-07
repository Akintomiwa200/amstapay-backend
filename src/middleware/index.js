const swaggerMiddleware = require("../config/swagger");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const bodyParser = require("body-parser");

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
  : ["http://localhost:3000", "http://localhost:5173", "https://amstapay.com"];

module.exports = (app) => {
  app.set("trust proxy", 1);
  app.set("etag", "strong");
  app.set("query parser", "simple");

  app.use(compression({ level: 6, threshold: 256, filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }}));

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV !== "production" ? false : undefined,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    frameguard: { action: "deny" },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? (origin, callback) => {
          if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) callback(null, true);
          else callback(new Error("Not allowed by CORS"));
        }
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Id", "X-Requested-With"],
    maxAge: 86400,
  }));

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use(bodyParser.json({ limit: "1mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));

  const rateLimit = require("./rateLimit");
  rateLimit.applyRateLimits(app);

  if (process.env.NODE_ENV !== "production") {
    swaggerMiddleware(app);
  }

  console.log("Scalability & security middleware configured");
};
