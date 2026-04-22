const express = require("express");
const router = express.Router();
const bankController = require("../controllers/bankController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Bank
// ==============================
/**
 * @swagger
 * tags:
 *   name: Bank
 *   description: Manage bank account operations
 */

// --------------------
// Get bank balance
// --------------------
/**
 * @swagger
 * /bank/balance:
 *   get:
 *     summary: Get bank account balance
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank balance returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   example: 5000
 *                 accountNumber:
 *                   type: string
 *                   example: "1234567890"
 *       401:
 *         description: Not authorized
 */
router.get("/balance", protect, bankController.getBalance);

// --------------------
// Transfer money
// --------------------
/**
 * @swagger
 * /bank/transfer:
 *   post:
 *     summary: Transfer money from bank account
 *     tags: [Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - recipientAccountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *               recipientAccountNumber:
 *                 type: string
 *                 example: "0987654321"
 *               description:
 *                 type: string
 *                 example: "Payment for services"
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amount:
 *                   type: number
 *                   example: 1000
 *                 newBalance:
 *                   type: number
 *                   example: 4000
 *       400:
 *         description: Insufficient balance or invalid request
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Recipient account not found
 */
router.post("/transfer", protect, bankController.transfer);

module.exports = router;