const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const web3Controller = require("../controllers/web3Controller");

/**
 * @swagger
 * tags:
 *   name: Web3
 *   description: Web3 and cryptocurrency payments
 */

/**
 * @swagger
 * /web3/wallet:
 *   post:
 *     summary: Generate a Web3 wallet for the user
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet generated successfully
 */
router.post("/wallet", protect, web3Controller.generateWallet);

/**
 * @swagger
 * /web3/balance:
 *   get:
 *     summary: Get crypto wallet balance
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *           enum: [ETH, USDT, USDC]
 *         description: Token to check balance for
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
router.get("/balance", protect, web3Controller.getBalance);

/**
 * @swagger
 * /web3/deposit:
 *   post:
 *     summary: Deposit crypto to wallet
 *     tags: [Web3]
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
 *                 example: 0.5
 *               tokenSymbol:
 *                 type: string
 *                 enum: [ETH, USDT, USDC]
 *                 example: ETH
 *     responses:
 *       200:
 *         description: Deposit initiated
 */
router.post("/deposit", protect, web3Controller.deposit);

/**
 * @swagger
 * /web3/withdraw:
 *   post:
 *     summary: Withdraw crypto from wallet
 *     tags: [Web3]
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
 *                 example: 0.1
 *               tokenSymbol:
 *                 type: string
 *                 enum: [ETH, USDT, USDC]
 *                 example: USDT
 *               toAddress:
 *                 type: string
 *                 example: 0x1234...
 *     responses:
 *       200:
 *         description: Withdrawal initiated
 */
router.post("/withdraw", protect, web3Controller.withdraw);

/**
 * @swagger
 * /web3/convert:
 *   post:
 *     summary: Convert crypto to local currency
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cryptoAmount:
 *                 type: number
 *                 example: 100
 *               cryptoToken:
 *                 type: string
 *                 enum: [ETH, USDT, USDC]
 *                 example: USDT
 *     responses:
 *       200:
 *         description: Conversion successful
 */
router.post("/convert", protect, web3Controller.convert);

module.exports = router;