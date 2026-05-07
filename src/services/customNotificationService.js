const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let io = null;
let whatsappClient = null;
let whatsappReady = false;
let lastQR = null;
let qrGeneratedAt = null;

const queue = [];

// ─── Nigerian carrier email-to-SMS gateways ──────────────────────────────
const CARRIER_GATEWAYS = {
  "0703": "mtn.net", "0706": "mtn.net", "0803": "mtn.net",
  "0806": "mtn.net", "0810": "mtn.net", "0813": "mtn.net",
  "0814": "mtn.net", "0816": "mtn.net", "0818": "mtn.net",
  "0903": "mtn.net", "0906": "mtn.net", "0913": "mtn.net",
  "0701": "glo.com", "0705": "glo.com", "0805": "glo.com",
  "0807": "glo.com", "0811": "glo.com", "0815": "glo.com",
  "0905": "glo.com", "0915": "glo.com",
  "0802": "airtel.com", "0808": "airtel.com", "0812": "airtel.com",
  "0901": "airtel.com", "0902": "airtel.com", "0907": "airtel.com",
  "0912": "airtel.com",
  "0809": "9mobile.com", "0817": "9mobile.com", "0819": "9mobile.com",
  "0909": "9mobile.com",
};

function getSmsEmail(phone) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const local = cleaned.replace(/^234/, "0");
  for (const [prefix, domain] of Object.entries(CARRIER_GATEWAYS)) {
    if (local.startsWith(prefix)) {
      return `${local}@${domain}`;
    }
  }
  return null;
}

// ─── Init ────────────────────────────────────────────────────────────────
exports.initNotificationService = (socketIO = null) => {
  io = socketIO;
  initWhatsApp();
  setInterval(() => { processQueue(); }, 200);
  return { sendNotification, subscribe, sendOTP, sendTransactionAlert };
};

// ─── WhatsApp Client ──────────────────────────────────────────────────────
function initWhatsApp() {
  const sessionPath = path.join(__dirname, "..", ".wwebjs_auth");
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  whatsappClient.on("qr", (qr) => {
    lastQR = qr;
    qrGeneratedAt = Date.now();
    qrcode.generate(qr, { small: true });
    console.log("\n[WhatsApp] Scan the QR above with your phone to link");
    if (io) io.emit("whatsapp:qr", { qr, expiresAt: qrGeneratedAt + 60000 });
  });

  whatsappClient.on("ready", () => {
    whatsappReady = true;
    console.log("[WhatsApp] Ready — sending messages for free \u2705");
    if (io) io.emit("whatsapp:ready");
  });

  whatsappClient.on("auth_failure", (msg) => {
    console.error("[WhatsApp] Auth failure:", msg);
    whatsappReady = false;
  });

  whatsappClient.on("disconnected", (reason) => {
    console.log("[WhatsApp] Disconnected:", reason);
    whatsappReady = false;
    setTimeout(() => {
      console.log("[WhatsApp] Reconnecting...");
      whatsappClient.initialize();
    }, 5000);
  });

  whatsappClient.initialize();
}

exports.getWhatsAppStatus = () => ({
  ready: whatsappReady,
  hasQR: !!lastQR,
  qr: lastQR,
  qrExpiresAt: qrGeneratedAt ? qrGeneratedAt + 60000 : null,
});

// ─── Public API ──────────────────────────────────────────────────────────
const sendNotification = async (params) => {
  const { userId, type, message, channels = ["email"] } = params;
  queue.push({ userId, type, message, channels, timestamp: new Date(), attempts: 0 });
};

const subscribers = new Map();
const subscribe = (userId, callback) => { subscribers.set(userId, callback); };

const sendOTP = async ({ userId, email, phone, fullName, code }) => {
  const results = {};
  if (email) {
    queue.push({ type: "otp_email", to: email, fullName, code, channel: "email", userId, timestamp: new Date() });
    results.email = "queued";
  }
  if (phone) {
    queue.push({ type: "otp_sms", to: phone, message: `Your AmstaPay OTP is: ${code}`, channel: "sms", userId, timestamp: new Date() });
    results.sms = "queued";
    queue.push({ type: "otp_whatsapp", to: phone, message: `\uD83D\uDD10 AmstaPay Verification Code: ${code}\n\nExpires in 10 minutes`, channel: "whatsapp", userId, timestamp: new Date() });
    results.whatsapp = "queued";
  }
  return results;
};

const sendTransactionAlert = async ({ userId, email, phone, transaction }) => {
  const { amount, status, type, reference } = transaction;
  const results = {};
  if (email) {
    queue.push({ type: "transaction_email", to: email, subject: `Transaction ${status}`, message: `Your ${type} of \u20A6${amount} is ${status}. Ref: ${reference}`, channel: "email", userId, timestamp: new Date() });
    results.email = "queued";
  }
  if (phone) {
    queue.push({ type: "transaction_sms", to: phone, message: `AmstaPay: ${type} \u20A6${amount} - ${status} (${reference})`, channel: "sms", userId, timestamp: new Date() });
    results.sms = "queued";
  }
  return results;
};

// ─── Queue Processor ─────────────────────────────────────────────────────
const processQueue = async () => {
  if (queue.length === 0) return;
  const notification = queue.shift();

  if (notification.channel === "email" && notification.type === "otp_email") {
    notification.subject = "Your AmstaPay Verification Code";
  }

  try {
    switch (notification.channel) {
      case "email":
        await sendEmailNotification(notification);
        break;
      case "sms":
        await sendSMSNotification(notification);
        break;
      case "whatsapp":
        await sendWhatsAppNotification(notification);
        break;
    }
    if (io) io.emit("notification:sent", { channel: notification.channel, to: notification.to, status: "sent" });
  } catch (error) {
    notification.attempts = (notification.attempts || 0) + 1;
    if (notification.attempts < 3) {
      queue.push(notification);
    } else {
      console.error(`[${notification.channel}] Failed:`, error.message);
      if (io) io.emit("notification:failed", { channel: notification.channel, to: notification.to, error: error.message });
    }
  }
};

// ─── Email (nodemailer — already working) ────────────────────────────────
const sendEmailNotification = async (notification) => {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AmstaPay" <${process.env.EMAIL_USER}>`,
    to: notification.to,
    subject: notification.subject || "AmstaPay Notification",
    html: formatEmail(notification),
  });
  console.log(`[Email] Sent to ${notification.to}`);
};

// ─── SMS (free via email-to-SMS gateway) ─────────────────────────────────
const sendSMSNotification = async (notification) => {
  const smsEmail = getSmsEmail(notification.to);
  if (!smsEmail) {
    console.log(`[SMS] No carrier gateway for ${notification.to} — logged`);
    console.log(`[SMS] Message: ${notification.message}`);
    return;
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AmstaPay" <${process.env.EMAIL_USER}>`,
    to: smsEmail,
    subject: "",
    text: notification.message,
  });
  console.log(`[SMS] Sent to ${notification.to} via ${smsEmail}`);
};

// ─── WhatsApp (free via whatsapp-web.js) ─────────────────────────────────
const sendWhatsAppNotification = async (notification) => {
  if (!whatsappReady) {
    console.log(`[WhatsApp] Client not ready — requeueing ${notification.to}`);
    notification.attempts = (notification.attempts || 0) + 1;
    if (notification.attempts < 3) queue.unshift(notification);
    return;
  }

  const chatId = notification.to.includes("@c.us")
    ? notification.to
    : `${notification.to.replace(/^0/, "234")}@c.us`;

  const response = await whatsappClient.sendMessage(chatId, notification.message);
  console.log(`[WhatsApp] Sent to ${notification.to} (id: ${response.id.id})`);
};

// ─── Email HTML ──────────────────────────────────────────────────────────
const formatEmail = (notification) => {
  if (notification.type === "otp_email") {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>AmstaPay Verification Code</h2>
        <p>Hi ${notification.fullName},</p>
        <p>Your verification code is: <strong>${notification.code}</strong></p>
        <p>This code expires in 10 minutes.</p>
      </div>`;
  }
  return `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>AmstaPay Notification</h2><p>${notification.message}</p></div>`;
};

// ─── Status ──────────────────────────────────────────────────────────────
exports.getQueueStatus = () => ({
  pending: queue.length,
  whatsapp: { ready: whatsappReady, hasQR: !!lastQR },
});

module.exports = {
  initNotificationService: exports.initNotificationService,
  getWhatsAppStatus: exports.getWhatsAppStatus,
  sendNotification,
  subscribe,
  sendOTP,
  sendTransactionAlert,
  getQueueStatus: exports.getQueueStatus,
};
