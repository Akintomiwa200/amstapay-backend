const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/web3Controller");

/**
 * @swagger
 * tags:
 *   name: Web3
 *   description: Web3 wallet and crypto operations
 */

/**
 * @swagger
 * /web3/wallet:
 *   post:
 *     summary: Generate a new Web3 wallet
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet generated successfully
 */
router.post("/wallet", protect, ctrl.generateWallet);

/**
 * @swagger
 * /web3/balance:
 *   get:
 *     summary: Get crypto balance for a specific token
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *           example: ETH
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
router.get("/balance", protect, ctrl.getBalance);

/**
 * @swagger
 * /web3/balances:
 *   get:
 *     summary: Get all crypto balances
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All balances retrieved successfully
 */
router.get("/balances", protect, ctrl.getAllBalances);

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
 *               token:
 *                 type: string
 *                 example: ETH
 *               amount:
 *                 type: number
 *                 example: 0.5
 *     responses:
 *       200:
 *         description: Deposit successful
 */
router.post("/deposit", protect, ctrl.deposit);

/**
 * @swagger
 * /web3/withdraw:
 *   post:
 *     summary: Send/withdraw crypto
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
 *               token:
 *                 type: string
 *                 example: ETH
 *               to:
 *                 type: string
 *                 example: 0x1234...
 *               amount:
 *                 type: number
 *                 example: 0.1
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
router.post("/send", protect, ctrl.send);

/**
 * @swagger
 * /web3/convert:
 *   post:
 *     summary: Convert between crypto tokens
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
 *               fromToken:
 *                 type: string
 *                 example: ETH
 *               toToken:
 *                 type: string
 *                 example: USDT
 *               amount:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Conversion successful
 */
router.post("/convert", protect, ctrl.convert);

/**
 * @swagger
 * /web3/price:
 *   get:
 *     summary: Get price of a specific token
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *           example: ETH
 *     responses:
 *       200:
 *         description: Token price retrieved
 */
router.get("/price", protect, ctrl.getPrice);

/**
 * @swagger
 * /web3/prices:
 *   get:
 *     summary: Get prices of all supported tokens
 *     tags: [Web3]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All token prices retrieved
 */
router.get("/prices", protect, ctrl.getPrices);

module.exports = router;