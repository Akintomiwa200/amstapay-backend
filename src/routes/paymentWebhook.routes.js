const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/paymentWebhookController");

/**
 * @swagger
 * tags:
 *   name: PaymentWebhook
 *   description: Payment webhook management endpoints
 */

/**
 * @swagger
 * /payment-webhooks/register:
 *   post:
 *     summary: Register a new payment webhook endpoint
 *     tags: [PaymentWebhook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://myapp.com/webhooks/payment"
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["payment.success", "payment.failed"]
 *               secret:
 *                 type: string
 *                 example: "whsec_xxx"
 *               description:
 *                 type: string
 *                 example: "Webhook for payment notifications"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Webhook registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post("/register", protect, ctrl.registerWebhook);

/**
 * @swagger
 * /payment-webhooks/:
 *   get:
 *     summary: List all registered webhooks
 *     tags: [PaymentWebhook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of webhooks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       events:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listWebhooks);

/**
 * @swagger
 * /payment-webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook endpoint
 *     tags: [PaymentWebhook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 *       404:
 *         description: Webhook not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", protect, ctrl.deleteWebhook);

module.exports = router;
