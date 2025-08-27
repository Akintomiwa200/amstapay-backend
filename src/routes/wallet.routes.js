const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { protect } = require("../middleware/index"); // dummy or real protect

// ==============================
// Swagger Tag: Wallets
// ==============================
/**
 * @swagger
 * tags:
 *   name: Wallets
 *   description: Manage user wallets
 */

// --------------------
// Get wallet balance
// --------------------
/**
 * @swagger
 * /api/wallets/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   example: 1000
 */
router.get("/balance", walletController.getBalance);

// --------------------
// Fund wallet
// --------------------
/**
 * @swagger
 * /api/wallets/fund:
 *   post:
 *     summary: Fund wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet funded successfully
 *                 balance:
 *                   type: number
 *                   example: 1500
 */
router.post("/fund", walletController.fundWallet);

// --------------------
// Withdraw from wallet
// --------------------
/**
 * @swagger
 * /api/wallets/withdraw:
 *   post:
 *     summary: Withdraw money from wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Withdrawal successful
 *                 balance:
 *                   type: number
 *                   example: 800
 */
router.post("/withdraw", walletController.withdrawWallet);

// --------------------
// Get wallet transactions
// --------------------
/**
 * @swagger
 * /api/wallets/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "fund" 
 *                   amount:
 *                     type: number
 *                     example: 500
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-27T12:34:56.789Z"
 */
router.get("/transactions", walletController.getTransactions);

module.exports = router;
