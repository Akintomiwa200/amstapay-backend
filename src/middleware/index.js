// middleware/index.js
const express = require("express"); // <- added
const swaggerMiddleware = require("../config/swagger");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

module.exports = (app) => {
  // -----------------------------
  // Security headers
  // -----------------------------
  app.use(helmet());

  // -----------------------------
  // CORS configuration
  // -----------------------------
  app.use(
    cors({
      origin: "*", // Replace "*" with your frontend URL in production
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // -----------------------------
  // Request logging in dev mode
  // -----------------------------
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // -----------------------------
  // Rate limiting
  // -----------------------------
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { message: "Too many requests from this IP, please try again later." },
  });
  app.use(limiter);

  // -----------------------------
  // Body parsers
  // -----------------------------
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // -----------------------------
  // Swagger API documentation
  // -----------------------------
  swaggerMiddleware(app);

  // -----------------------------
  // Health check route
  // -----------------------------
  app.get("/health", (req, res) =>
    res.json({ status: "ok", timestamp: new Date() })
  );

  // -----------------------------
  // 404 handler for undefined routes
  // -----------------------------
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // -----------------------------
  // Global error handler
  // -----------------------------
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
    });
  });
};
