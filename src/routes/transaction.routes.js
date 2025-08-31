// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { protect } = require("../middleware/auth"); // <-- import protect



// ==============================
// Swagger Tag: Transactions
// ==============================
/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Manage all types of transactions
 */

// ==============================
// Transaction Routes
// ==============================

// Create a new transaction
/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction (QR, transfer, airtime, data, merchant)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [qr_payment, normal_transfer, airtime, data, merchant_payment, payment_url]
 *                 example: qr_payment
 *               amount:
 *                 type: number
 *                 example: 500
 *               receiverName:
 *                 type: string
 *                 example: "John Doe"
 *               receiverAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               receiverBank:
 *                 type: string
 *                 example: "AmstaPay"
 *               qrData:
 *                 type: string
 *                 example: '{"type":"payment","accountNumber":"1234567890"}'
 *               reference:
 *                 type: string
 *                 example: "INV-12345"
 *               merchantId:
 *                 type: string
 *                 example: "MERCHANT-98765"
 *               description:
 *                 type: string
 *                 example: "Payment for service"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */
router.post("/", protect, transactionController.createTransaction);

// Get all transactions for the authenticated user
/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions of the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       500:
 *         description: Server error
 */
router.get("/",protect, transactionController.getTransactions);

// Get a single transaction by ID
/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get("/:id",protect, transactionController.getTransactionById);

// Update transaction status (admin/system)
/**
 * @swagger
 * /transactions/{id}/status:
 *   patch:
 *     summary: Update transaction status (pending → success/failed/reversed)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, success, failed, reversed]
 *     responses:
 *       200:
 *         description: Transaction status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Transaction not found
 */
router.patch("/:id/status", protect, transactionController.updateTransactionStatus);

// Paystack webhook (no auth, but secured via secret header)
/**
 * @swagger
 * /transactions/webhook/paystack:
 *   post:
 *     summary: Paystack webhook for transaction events
 *     tags: [Transactions]
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
router.post("/webhook/paystack", transactionController.handlePaystackWebhook);


// ==============================
// Export Router
// ==============================
module.exports = router;

// ==============================
// Swagger Components: Transaction Schema
// ==============================
/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64ecf3c42f0a2b0012345678"
 *         sender:
 *           type: string
 *           example: "USER-123456"
 *         receiverName:
 *           type: string
 *           example: "John Doe"
 *         receiverAccountNumber:
 *           type: string
 *           example: "1234567890"
 *         receiverBank:
 *           type: string
 *           example: "AmstaPay"
 *         amount:
 *           type: number
 *           example: 500
 *         type:
 *           type: string
 *           enum: [qr_payment, normal_transfer, airtime, data, merchant_payment, payment_url]
 *           example: qr_payment
 *         qrData:
 *           type: string
 *           example: '{"type":"payment","accountNumber":"1234567890"}'
 *         reference:
 *           type: string
 *           example: "INV-12345"
 *         merchantId:
 *           type: string
 *           example: "MERCHANT-98765"
 *         description:
 *           type: string
 *           example: "Payment for service"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-27T12:34:56.789Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-27T12:34:56.789Z"
 */

