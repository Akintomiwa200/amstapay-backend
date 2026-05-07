const express = require("express");
const { paystackWebhook } = require("../controllers/webhookController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: Webhook endpoints for external services
 */

/**
 * @swagger
 * /webhook/paystack:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
// Paystack sends raw JSON → disable body parser for this route
router.post("/paystack", express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), paystackWebhook);

module.exports = router;