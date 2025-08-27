const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth"); // <-- import protect


// ==============================
// Swagger Tag: Payments
// ==============================
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: QR code payments
 */

// Send money via QR
/**
 * @swagger
 * /payments/send:
 *   post:
 *     summary: Send money via QR code
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: "64f0b2e1c0a1f00012345678"
 *               amount:
 *                 type: number
 *                 example: 500
 *               description:
 *                 type: string
 *                 example: "Payment for service"
 *     responses:
 *       200:
 *         description: Payment sent successfully
 */
router.post("/send",protect, paymentController.sendPayment);

// Receive money via QR
/**
 * @swagger
 * /payments/receive:
 *   post:
 *     summary: Receive money via QR code
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment received
 */
router.post("/receive",protect, paymentController.receivePayment);

module.exports = router;
