const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/subscriptionController");

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription and recurring billing management
 */

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 example: "plan_pro_monthly"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               trialEnd:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *     responses:
 *       201:
 *         description: Subscription created successfully
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
 *                     subscriptionId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, trial, past_due, cancelled]
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid plan or payment method required
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createSubscription);

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: List all subscriptions for the user
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, trial, past_due, cancelled, all]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: Subscriptions retrieved
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
 *                       planId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       currentPeriodStart:
 *                         type: string
 *                         format: date-time
 *                       currentPeriodEnd:
 *                         type: string
 *                         format: date-time
 *                       amount:
 *                         type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listSubscriptions);

/**
 * @swagger
 * /subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel a subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelAtPeriodEnd:
 *                 type: boolean
 *                 example: true
 *                 description: Cancel at end of billing period (vs immediately)
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 cancelledAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Subscription not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/cancel", protect, ctrl.cancelSubscription);

module.exports = router;
