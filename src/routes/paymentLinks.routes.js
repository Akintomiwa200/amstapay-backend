const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/paymentLinksController");

/**
 * @swagger
 * tags:
 *   name: PaymentLinks
 *   description: Payment link generation and management
 */

/**
 * @swagger
 * /payment-links:
 *   post:
 *     summary: Create a payment link
 *     tags: [PaymentLinks]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               description:
 *                 type: string
 *                 example: "Payment for consulting services"
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, GBP]
 *                 example: "NGN"
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               maxUses:
 *                 type: integer
 *                 example: 10
 *               allowPartial:
 *                 type: boolean
 *                 example: false
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 example: { "invoice": "INV-001" }
 *     responses:
 *       201:
 *         description: Payment link created
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
 *                     linkId:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     url:
 *                       type: string
 *                       format: uri
 *                     amount:
 *                       type: number
 *                     usesRemaining:
 *                       type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createLink);

/**
 * @swagger
 * /payment-links:
 *   get:
 *     summary: List all payment links for the user
 *     tags: [PaymentLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, disabled]
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
 *         description: Payment links retrieved
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
 *                       slug:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                       usesRemaining:
 *                         type: integer
 *                       expiresAt:
 *                         type: string
 *                         format: date
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listLinks);

/**
 * @swagger
 * /payment-links/{slug}:
 *   get:
 *     summary: Get payment link details (public)
 *     tags: [PaymentLinks]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique slug of the payment link
 *     responses:
 *       200:
 *         description: Payment link details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 description:
 *                   type: string
 *                 currency:
 *                   type: string
 *                 maxUses:
 *                   type: integer
 *                 usesRemaining:
 *                   type: integer
 *                 expiresAt:
 *                   type: string
 *                   format: date
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Payment link not found or expired
 */
router.get("/:slug", ctrl.getLink);

/**
 * @swagger
 * /payment-links/{slug}/pay:
 *   post:
 *     summary: Pay via a payment link
 *     tags: [PaymentLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payerName:
 *                 type: string
 *                 example: "John Doe"
 *               payerEmail:
 *                 type: string
 *                 format: email
 *                 example: "payer@example.com"
 *               note:
 *                 type: string
 *                 example: "Thanks for the service"
 *     responses:
 *       200:
 *         description: Payment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionId:
 *                   type: string
 *       400:
 *         description: Link expired or maximum uses exceeded
 *       404:
 *         description: Payment link not found
 */
router.post("/:slug/pay", protect, ctrl.payLink);

/**
 * @swagger
 * /payment-links/{id}/toggle:
 *   patch:
 *     summary: Enable or disable a payment link
 *     tags: [PaymentLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment link ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Payment link updated
 *       404:
 *         description: Payment link not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/toggle", protect, ctrl.toggleLink);

module.exports = router;
