// app.js - Amstapay API bootstrap
require("dotenv").config();
const express = require("express");
const { getWhatsAppStatus } = require("./services/customNotificationService");

console.log("🚀 Starting Amstapay API...");

// ===== Load routes with debugging =====
let authRoutes, paymentRoutes, walletRoutes, transactionRoutes, userRoutes, webhookRoutes, bankRoutes, giftcardRoutes, loanRoutes, investRoutes, reportRoutes, billsRoutes, internationalRoutes, web3Routes, savingsRoutes, recurringRoutes, cableRoutes, virtualCardRoutes, escrowRoutes, bulkRoutes, twofaRoutes, ussdRoutes, supportRoutes, adminRoutes, insuranceRoutes, referralRoutes, paymentLinksRoutes, moneyRequestRoutes, scheduledPaymentRoutes, groupContributionRoutes, fixedDepositRoutes, microLoanRoutes, extendedBillsRoutes, paymentWebhookRoutes, billSplitRoutes, invoiceRoutes, cashbackRoutes, budgetRoutes, jointAccountRoutes, roundupRoutes, voucherRoutes, subscriptionRoutes;

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
  bankRoutes = require("./routes/bank.routes");
  giftcardRoutes = require("./routes/giftcard.routes");
  loanRoutes = require("./routes/loan.routes");
  investRoutes = require("./routes/invest.routes");
  reportRoutes = require("./routes/report.routes");
  billsRoutes = require("./routes/bills.routes");
  console.log("✅ New feature routes loaded");
} catch (err) {
  console.error("❌ Error loading new routes:", err.message);
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

try {
  console.log("📁 Loading international routes...");
  internationalRoutes = require("./routes/international.routes");
  console.log("✅ International routes loaded");
} catch (err) {
  console.error("❌ Error loading international routes:", err.message);
}

try {
  console.log("📁 Loading web3 routes...");
  web3Routes = require("./routes/web3.routes");
  console.log("✅ Web3 routes loaded");
} catch (err) {
  console.error("❌ Error loading web3 routes:", err.message);
}

try {
  savingsRoutes = require("./routes/savings.routes");
  recurringRoutes = require("./routes/recurring.routes");
  cableRoutes = require("./routes/cable.routes");
  virtualCardRoutes = require("./routes/virtualCard.routes");
  escrowRoutes = require("./routes/escrow.routes");
  bulkRoutes = require("./routes/bulk.routes");
  twofaRoutes = require("./routes/twofa.routes");
  console.log("✅ Financial services routes loaded");
} catch (err) {
  console.error("❌ Error loading financial routes:", err.message);
}

try {
  ussdRoutes = require("./routes/ussd.routes");
  supportRoutes = require("./routes/support.routes");
  adminRoutes = require("./routes/admin.routes");
  console.log("✅ USSD, Support & Admin routes loaded");
} catch (err) {
  console.error("❌ Error loading USSD/Support/Admin routes:", err.message);
}

try {
  insuranceRoutes = require("./routes/insurance.routes");
  referralRoutes = require("./routes/referral.routes");
  console.log("✅ Insurance & Referral routes loaded");
} catch (err) {
  console.error("❌ Error loading Insurance/Referral routes:", err.message);
}

try {
  subscriptionRoutes = require("./routes/subscription.routes");
  voucherRoutes = require("./routes/voucher.routes");
  roundupRoutes = require("./routes/roundup.routes");
  jointAccountRoutes = require("./routes/jointAccount.routes");
  budgetRoutes = require("./routes/budget.routes");
  cashbackRoutes = require("./routes/cashback.routes");
  invoiceRoutes = require("./routes/invoice.routes");
  billSplitRoutes = require("./routes/billSplit.routes");
  console.log("✅ Additional financial services routes loaded");
} catch (err) {
  console.error("❌ Error loading additional routes:", err.message);
}

try {
  paymentLinksRoutes = require("./routes/paymentLinks.routes");
  moneyRequestRoutes = require("./routes/moneyRequest.routes");
  scheduledPaymentRoutes = require("./routes/scheduledPayment.routes");
  groupContributionRoutes = require("./routes/groupContribution.routes");
  fixedDepositRoutes = require("./routes/fixedDeposit.routes");
  microLoanRoutes = require("./routes/microLoan.routes");
  extendedBillsRoutes = require("./routes/extendedBills.routes");
  paymentWebhookRoutes = require("./routes/paymentWebhook.routes");
  console.log("✅ Extended payment routes loaded");
} catch (err) {
  console.error("❌ Error loading extended payment routes:", err.message);
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

// ===== WhatsApp status =====
app.get("/api/whatsapp/status", (req, res) => {
  res.json(getWhatsAppStatus());
});

// API base version path
const API_VERSION = "/api/v1";

// ===== Mount routes with version prefix =====
console.log("🛣️  Setting up routes with base path:", API_VERSION);
if (authRoutes) app.use(`${API_VERSION}/auth`, authRoutes);
if (paymentRoutes) app.use(`${API_VERSION}/payments`, paymentRoutes);
if (walletRoutes) app.use(`${API_VERSION}/wallets`, walletRoutes);
if (transactionRoutes) app.use(`${API_VERSION}/transactions`, transactionRoutes);
if (bankRoutes) app.use(`${API_VERSION}/bank`, bankRoutes);
if (giftcardRoutes) app.use(`${API_VERSION}/giftcards`, giftcardRoutes);
if (loanRoutes) app.use(`${API_VERSION}/loans`, loanRoutes);
if (investRoutes) app.use(`${API_VERSION}/investments`, investRoutes);
if (reportRoutes) app.use(`${API_VERSION}/reports`, reportRoutes);
if (billsRoutes) app.use(`${API_VERSION}/bills`, billsRoutes);
if (internationalRoutes) app.use(`${API_VERSION}/international`, internationalRoutes);
if (web3Routes) app.use(`${API_VERSION}/web3`, web3Routes);
if (userRoutes) app.use(`${API_VERSION}/users`, userRoutes);
if (webhookRoutes) app.use(`${API_VERSION}/webhook`, webhookRoutes);
if (savingsRoutes) app.use(`${API_VERSION}/savings`, savingsRoutes);
if (recurringRoutes) app.use(`${API_VERSION}/payments`, recurringRoutes);
if (cableRoutes) app.use(`${API_VERSION}/bills`, cableRoutes);
if (virtualCardRoutes) app.use(`${API_VERSION}/cards`, virtualCardRoutes);
if (escrowRoutes) app.use(`${API_VERSION}/escrow`, escrowRoutes);
if (bulkRoutes) app.use(`${API_VERSION}/payments`, bulkRoutes);
if (twofaRoutes) app.use(`${API_VERSION}/auth`, twofaRoutes);
if (ussdRoutes) app.use(`${API_VERSION}/ussd`, ussdRoutes);
if (supportRoutes) app.use(`${API_VERSION}/support`, supportRoutes);
if (adminRoutes) app.use(`${API_VERSION}/admin`, adminRoutes);
if (insuranceRoutes) app.use(`${API_VERSION}/insurance`, insuranceRoutes);
if (referralRoutes) app.use(`${API_VERSION}/referrals`, referralRoutes);
if (paymentLinksRoutes) app.use(`${API_VERSION}/payment-links`, paymentLinksRoutes);
if (moneyRequestRoutes) app.use(`${API_VERSION}/money-requests`, moneyRequestRoutes);
if (scheduledPaymentRoutes) app.use(`${API_VERSION}/scheduled-payments`, scheduledPaymentRoutes);
if (groupContributionRoutes) app.use(`${API_VERSION}/group-contributions`, groupContributionRoutes);
if (fixedDepositRoutes) app.use(`${API_VERSION}/fixed-deposits`, fixedDepositRoutes);
if (microLoanRoutes) app.use(`${API_VERSION}/micro-loans`, microLoanRoutes);
if (extendedBillsRoutes) app.use(`${API_VERSION}/bills`, extendedBillsRoutes);
if (paymentWebhookRoutes) app.use(`${API_VERSION}/payment-webhooks`, paymentWebhookRoutes);
if (billSplitRoutes) app.use(`${API_VERSION}/bill-splits`, billSplitRoutes);
if (invoiceRoutes) app.use(`${API_VERSION}/invoices`, invoiceRoutes);
if (cashbackRoutes) app.use(`${API_VERSION}/rewards`, cashbackRoutes);
if (budgetRoutes) app.use(`${API_VERSION}/budgets`, budgetRoutes);
if (jointAccountRoutes) app.use(`${API_VERSION}/joint-accounts`, jointAccountRoutes);
if (roundupRoutes) app.use(`${API_VERSION}/roundup-savings`, roundupRoutes);
if (voucherRoutes) app.use(`${API_VERSION}/vouchers`, voucherRoutes);
if (subscriptionRoutes) app.use(`${API_VERSION}/subscriptions`, subscriptionRoutes);

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
      users: `${API_VERSION}/users`,
      wallets: `${API_VERSION}/wallets`,
      transactions: `${API_VERSION}/transactions`,
      payments: `${API_VERSION}/payments`,
      bills: `${API_VERSION}/bills`,
      giftcards: `${API_VERSION}/giftcards`,
      loans: `${API_VERSION}/loans`,
      investments: `${API_VERSION}/investments`,
      reports: `${API_VERSION}/reports`,
      bank: `${API_VERSION}/bank`,
      international: `${API_VERSION}/international`,
      web3: `${API_VERSION}/web3`,
      webhook: `${API_VERSION}/webhook`,
      insurance: `${API_VERSION}/insurance`,
      referrals: `${API_VERSION}/referrals`,
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