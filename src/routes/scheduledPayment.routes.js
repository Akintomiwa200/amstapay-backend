const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/scheduledPaymentController");

/**
 * @swagger
 * tags:
 *   name: ScheduledPayment
 *   description: Scheduled and recurring payment management
 */

/**
 * @swagger
 * /scheduled-payments:
 *   post:
 *     summary: Create a new scheduled payment
 *     tags: [ScheduledPayment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - amount
 *               - scheduleDate
 *             properties:
 *               recipientId:
 *                 type: string
 *                 example: "user_abc123"
 *               recipientName:
 *                 type: string
 *                 example: "John Doe"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               description:
 *                 type: string
 *                 example: "Monthly rent"
 *               scheduleDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-01"
 *               frequency:
 *                 type: string
 *                 enum: [once, daily, weekly, monthly, yearly]
 *                 example: "monthly"
 *               repeatCount:
 *                 type: integer
 *                 example: 12
 *               startTime:
 *                 type: string
 *                 format: time
 *                 example: "09:00"
 *     responses:
 *       201:
 *         description: Scheduled payment created
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
 *                     scheduledPaymentId:
 *                       type: string
 *                     nextExecution:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createScheduled);

/**
 * @swagger
 * /scheduled-payments/standing-order:
 *   post:
 *     summary: Create a standing order (fixed amount to fixed recipient)
 *     tags: [ScheduledPayment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientAccountNumber
 *               - amount
 *             properties:
 *               recipientAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               recipientName:
 *                 type: string
 *                 example: "Jane Smith"
 *               amount:
 *                 type: number
 *                 example: 25000
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               frequency:
 *                 type: string
 *                 enum: [weekly, monthly, quarterly]
 *                 example: "monthly"
 *               reference:
 *                 type: string
 *                 example: "Rent payment"
 *     responses:
 *       201:
 *         description: Standing order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 standingOrderId:
 *                   type: string
 *                 nextDebitDate:
 *                   type: string
 *                   format: date
 *       401:
 *         description: Unauthorized
 */
router.post("/standing-order", protect, ctrl.createStandingOrder);

/**
 * @swagger
 * /scheduled-payments:
 *   get:
 *     summary: List all scheduled payments
 *     tags: [ScheduledPayment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [once, recurring, standing-order]
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: Scheduled payments retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   recipientName:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   nextExecution:
 *                     type: string
 *                     format: date-time
 *                   frequency:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listPayments);

/**
 * @swagger
 * /scheduled-payments/{id}/cancel:
 *   post:
 *     summary: Cancel a scheduled payment
 *     tags: [ScheduledPayment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheduled payment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "No longer needed"
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/cancel", protect, ctrl.cancelPayment);

/**
 * @swagger
 * /scheduled-payments/{id}/pause:
 *   post:
 *     summary: Pause or resume a scheduled payment
 *     tags: [ScheduledPayment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scheduled payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPaused:
 *                 type: boolean
 *                 example: true
 *               pauseReason:
 *                 type: string
 *                 example: "Insufficient funds"
 *     responses:
 *       200:
 *         description: Payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isPaused:
 *                   type: boolean
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/pause", protect, ctrl.pausePayment);

module.exports = router;
