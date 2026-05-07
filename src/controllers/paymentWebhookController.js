const PaymentWebhook = require("../models/PaymentWebhook");
const crypto = require("crypto");
const axios = require("axios");

exports.registerWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: "url and events array required" });
    }

    const secret = crypto.randomBytes(16).toString("hex");
    const webhook = await PaymentWebhook.create({
      user: req.user._id, url, events, secret, isActive: true,
    });

    res.status(201).json({ message: "Webhook registered", data: { id: webhook._id, url, events, secret } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listWebhooks = async (req, res) => {
  try {
    const webhooks = await PaymentWebhook.find({ user: req.user._id });
    res.json({ success: true, count: webhooks.length, data: webhooks.map(w => ({ id: w._id, url: w.url, events: w.events, isActive: w.isActive, lastTriggeredAt: w.lastTriggeredAt })) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    await PaymentWebhook.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Webhook deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fireWebhook = async (event, payload) => {
  try {
    const webhooks = await PaymentWebhook.find({ isActive: true, events: event });
    for (const wh of webhooks) {
      try {
        const signature = crypto.createHmac("sha256", wh.secret).update(JSON.stringify(payload)).digest("hex");
        const response = await axios.post(wh.url, { event, data: payload, timestamp: new Date().toISOString() }, {
          headers: { "Content-Type": "application/json", "X-Webhook-Signature": signature },
          timeout: 5000,
        });
        wh.lastTriggeredAt = new Date();
        wh.lastResponseStatus = response.status;
        wh.failureCount = 0;
        await wh.save();
      } catch (err) {
        wh.failureCount = (wh.failureCount || 0) + 1;
        wh.lastResponseStatus = err.response?.status || 0;
        if (wh.failureCount >= 10) wh.isActive = false;
        await wh.save();
      }
    }
  } catch (err) {
    console.error("Webhook firing error:", err.message);
  }
};
