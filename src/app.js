// app.js - Add debugging to see what's happening during startup
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

console.log("🚀 Starting Amtapay API...");

// Routes - Add try-catch to see which route is causing issues
let authRoutes, paymentRoutes, walletRoutes, transactionRoutes;

try {
  console.log("📁 Loading auth routes...");
  authRoutes = require("./routes/auth.routes");
  console.log("✅ Auth routes loaded");
} catch (err) {
  console.error("❌ Error loading auth routes:", err.message);
}

try {
  console.log("📁 Loading payment routes...");
  paymentRoutes = require("./routes/payment.routes");
  console.log("✅ Payment routes loaded");
} catch (err) {
  console.error("❌ Error loading payment routes:", err.message);
}

try {
  console.log("📁 Loading wallet routes...");
  walletRoutes = require("./routes/wallet.routes");
  console.log("✅ Wallet routes loaded");
} catch (err) {
  console.error("❌ Error loading wallet routes:", err.message);
}

try {
  console.log("📁 Loading transaction routes...");
  transactionRoutes = require("./routes/transaction.routes");
  console.log("✅ Transaction routes loaded");
} catch (err) {
  console.error("❌ Error loading transaction routes:", err.message);
  console.error("Full error:", err);
  process.exit(1); // Exit if transaction routes fail to load
}

// Middleware aggregator
const applyMiddleware = require("./middleware");
const app = express();

console.log("⚙️  Setting up middleware...");

// ===== Body parser =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== Apply Middleware from middleware folder =====
applyMiddleware(app);

// ===== Health check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Amtapay API is running 🚀" });
});

console.log("🛣️  Setting up routes...");

// ===== Routes =====
if (authRoutes) app.use("/api/auth", authRoutes);
if (paymentRoutes) app.use("/api/payments", paymentRoutes);
if (walletRoutes) app.use("/api/wallets", walletRoutes);
if (transactionRoutes) app.use("/api/transactions", transactionRoutes);

console.log("🎯 All routes configured");

// ===== Error handling =====
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message,
  });
});

console.log("✅ App setup complete");

module.exports = app;