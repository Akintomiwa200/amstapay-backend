const express = require("express");
const { paystackWebhook } = require("../controllers/webhookController");

const router = express.Router();

// Paystack sends raw JSON → disable body parser for this route
router.post("/paystack", express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), paystackWebhook);

module.exports = router;
