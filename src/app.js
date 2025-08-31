// app.js - Amstapay API bootstrap
require("dotenv").config();
const express = require("express");

console.log("🚀 Starting Amstapay API...");

// ===== Load routes with debugging =====
let authRoutes, paymentRoutes, walletRoutes, transactionRoutes, userRoutes, webhookRoutes;

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

try {
  console.log("📁 Loading user routes...");
  userRoutes = require("./routes/user.routes");
  console.log("✅ User routes loaded");
} catch (err) {
  console.error("❌ Error loading user routes:", err.message);
}

try {
  console.log("📁 Loading webhook routes...");
  webhookRoutes = require("./routes/webhookRoutes");
  console.log("✅ Webhook routes loaded");
} catch (err) {
  console.error("❌ Error loading webhook routes:", err.message);
}

// ===== Initialize app =====
const app = express();

// ===== Apply global middleware =====
const applyMiddleware = require("./middleware/index");
console.log("⚙️  Setting up middleware...");
applyMiddleware(app);

// ===== Health check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Amstapay API is running 🚀" });
});

// ===== Mount routes =====
console.log("🛣️  Setting up routes...");
if (authRoutes) app.use("/api/auth", authRoutes);
if (paymentRoutes) app.use("/api/payments", paymentRoutes);
if (walletRoutes) app.use("/api/wallets", walletRoutes);
if (transactionRoutes) app.use("/api/transactions", transactionRoutes);
if (userRoutes) app.use("/api/users", userRoutes);
if (webhookRoutes) app.use("/api/webhook", webhookRoutes); // ✅ NEW webhook mount

console.log("🎯 All routes configured");

// ===== 404 handler =====
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// ===== Global error handler =====
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

console.log("✅ App setup complete");

module.exports = app;
