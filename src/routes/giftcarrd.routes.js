const express = require("express");
const router = express.Router();
const giftcardController = require("../controllers/giftcardController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Giftcards
// ==============================
/**
 * @swagger
 * tags:
 *   name: Giftcards
 *   description: Manage gift card purchases and listings
 */

// --------------------
// Buy Giftcard
// --------------------
/**
 * @swagger
 * /giftcards:
 *   post:
 *     summary: Purchase a gift card
 *     tags: [Giftcards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - giftcardId
 *               - amount
 *             properties:
 *               giftcardId:
 *                 type: string
 *                 example: "GC001"
 *               amount:
 *                 type: number
 *                 example: 100
 *               recipientEmail:
 *                 type: string
 *                 example: "friend@example.com"
 *               recipientName:
 *                 type: string
 *                 example: "John Doe"
 *               message:
 *                 type: string
 *                 example: "Happy Birthday!"
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, NGN]
 *                 example: "USD"
 *     responses:
 *       200:
 *         description: Gift card purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gift card purchased successfully"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 giftcardCode:
 *                   type: string
 *                   example: "GIFT-ABCD-1234-EFGH"
 *                 amount:
 *                   type: number
 *                   example: 100
 *                 currency:
 *                   type: string
 *                   example: "USD"
 *                 expiryDate:
 *                   type: string
 *                   format: date
 *                   example: "2025-12-31"
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Gift card type not found
 */
router.post("/", protect, giftcardController.buyGiftcard);

// --------------------
// Get Available Giftcards
// --------------------
/**
 * @swagger
 * /giftcards:
 *   get:
 *     summary: Get all available gift cards
 *     tags: [Giftcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (e.g., Amazon, iTunes, Google Play)
 *         example: "Amazon"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 10
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 500
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, NGN]
 *         description: Currency filter
 *         example: "USD"
 *     responses:
 *       200:
 *         description: List of available gift cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 giftcards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "GC001"
 *                       name:
 *                         type: string
 *                         example: "Amazon Gift Card"
 *                       category:
 *                         type: string
 *                         example: "Shopping"
 *                       description:
 *                         type: string
 *                         example: "Shop on Amazon.com"
 *                       availableDenominations:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [10, 25, 50, 100]
 *                       currency:
 *                         type: string
 *                         example: "USD"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://example.com/amazon-gc.png"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, giftcardController.getGiftcards);

module.exports = router;