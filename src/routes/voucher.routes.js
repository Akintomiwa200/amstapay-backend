const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/voucherController");

/**
 * @swagger
 * tags:
 *   name: Voucher
 *   description: Voucher creation and redemption
 */

/**
 * @swagger
 * /vouchers:
 *   post:
 *     summary: Create a new voucher
 *     tags: [Voucher]
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
 *               - expiresAt
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: "recipient@example.com"
 *               recipientPhone:
 *                 type: string
 *                 example: "+2348012345678"
 *               message:
 *                 type: string
 *                 example: "Here's a gift from me!"
 *               expiresAt:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               maxUses:
 *                 type: integer
 *                 example: 1
 *               conditions:
 *                 type: string
 *                 example: "Valid for airtime purchases only"
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucherCode:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     expiresAt:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createVoucher);

/**
 * @swagger
 * /vouchers/redeem:
 *   post:
 *     summary: Redeem a voucher code
 *     tags: [Voucher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherCode
 *             properties:
 *               voucherCode:
 *                 type: string
 *                 example: "AMSTA2024ABC123"
 *               applyToWallet:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Voucher redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 amountCredited:
 *                   type: number
 *       400:
 *         description: Invalid or expired voucher
 *       409:
 *         description: Voucher already redeemed
 *       401:
 *         description: Unauthorized
 */
router.post("/redeem", protect, ctrl.redeemVoucher);

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: List user's vouchers
 *     tags: [Voucher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, redeemed, expired]
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
 *         description: Vouchers retrieved
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
 *                       voucherCode:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       expiresAt:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listVouchers);

module.exports = router;
