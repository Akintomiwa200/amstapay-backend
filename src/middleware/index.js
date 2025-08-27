// middleware/index.js
const swaggerMiddleware = require("../config/swagger");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");

module.exports = (app) => {
  // Security headers
  app.use(helmet());

  // Enable CORS for all routes
  app.use(cors({ origin: "*" }));

  // Request logging (dev mode only)
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Parse incoming JSON requests
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

  // Swagger API documentation
  swaggerMiddleware(app);
};
