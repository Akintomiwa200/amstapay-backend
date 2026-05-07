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
// Get available giftcards (catalog)
// --------------------
/**
 * @swagger
 * /giftcards:
 *   get:
 *     summary: Get all available gift cards (catalog)
 *     tags: [Giftcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Shopping, Entertainment, Gaming, Food, Travel]
 *         description: Filter by category
 *         example: "Shopping"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum denomination filter
 *         example: 10
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum denomination filter
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 giftcards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       code:
 *                         type: string
 *                         example: "AMAZON"
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
 *                       currencies:
 *                         type: array
 *                         items:
 *                           type: string
 *                       imageUrl:
 *                         type: string
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, giftcardController.getGiftcards);

// --------------------
// Get user's purchased giftcards
// --------------------
/**
 * @swagger
 * /giftcards/my:
 *   get:
 *     summary: Get user's purchased gift cards
 *     tags: [Giftcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, redeemed, expired, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User's gift cards retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 giftcards:
 *                   type: array
 *       401:
 *         description: Not authorized
 */
router.get("/my", protect, giftcardController.getMyGiftcards);

// --------------------
// Purchase a giftcard
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
 *                 example: "AMAZON"
 *               amount:
 *                 type: number
 *                 example: 100
 *               recipientEmail:
 *                 type: string
 *                 format: email
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
 *       201:
 *         description: Gift card purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Gift card purchased successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     giftCard:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         code:
 *                           type: string
 *                           example: "GIFT-ABCD1234EFGH"
 *                         type:
 *                           type: string
 *                           example: "Amazon Gift Card"
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         expiryDate:
 *                           type: string
 *                           format: date
 *                     transaction:
 *                       type: object
 *                     balance:
 *                       type: number
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Gift card type not found
 */
router.post("/", protect, giftcardController.buyGiftcard);

// --------------------
// Redeem giftcard
// --------------------
/**
 * @swagger
 * /giftcards/{id}/redeem:
 *   post:
 *     summary: Redeem a gift card
 *     tags: [Giftcards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gift card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applyToWallet:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Gift card redeemed successfully
 *       400:
 *         description: Already redeemed or expired
 *       404:
 *         description: Gift card not found
 */
router.post("/:id/redeem", protect, giftcardController.redeemGiftcard);

module.exports = router;