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
    process.exit(1);
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
    webhookRoutes = require("./routes/webhook.routes");
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

  // API base version path
  const API_VERSION = "/api/v1";

  // ===== Mount routes with version prefix =====
  console.log("🛣️  Setting up routes with base path:", API_VERSION);
  if (authRoutes) app.use(`${API_VERSION}/auth`, authRoutes);
  if (paymentRoutes) app.use(`${API_VERSION}/payments`, paymentRoutes);
  if (walletRoutes) app.use(`${API_VERSION}/wallets`, walletRoutes);
  if (transactionRoutes) app.use(`${API_VERSION}/transactions`, transactionRoutes);
  if (userRoutes) app.use(`${API_VERSION}/users`, userRoutes);
  if (webhookRoutes) app.use(`${API_VERSION}/webhook`, webhookRoutes);

  // Also keep backward compatibility for webhook (often needs raw body)
  if (webhookRoutes) app.use("/api/webhook", webhookRoutes);

  console.log("🎯 All routes configured with versioning");

  // Simple API info endpoint
  app.get(API_VERSION, (req, res) => {
    res.json({
      name: "Amstapay API",
      version: "v1",
      status: "active",
      endpoints: {
        auth: `${API_VERSION}/auth`,
        payments: `${API_VERSION}/payments`,
        wallets: `${API_VERSION}/wallets`,
        transactions: `${API_VERSION}/transactions`,
        users: `${API_VERSION}/users`,
        webhook: `${API_VERSION}/webhook`,
        documentation: "/docs"
      }
    });
  });

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