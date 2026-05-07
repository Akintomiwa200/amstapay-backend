const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/moneyRequestController");

/**
 * @swagger
 * tags:
 *   name: MoneyRequest
 *   description: Money request and payment request management
 */

/**
 * @swagger
 * /money-requests:
 *   post:
 *     summary: Request money from another user
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - amount
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: "user_xyz789"
 *               receiverEmail:
 *                 type: string
 *                 format: email
 *                 example: "recipient@example.com"
 *               receiverPhone:
 *                 type: string
 *                 example: "+2348012345678"
 *               amount:
 *                 type: number
 *                 example: 10000
 *               description:
 *                 type: string
 *                 example: "Share of restaurant bill"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-15"
 *               reminderFrequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly, none]
 *                 example: "weekly"
 *     responses:
 *       201:
 *         description: Money request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     dueDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.requestMoney);

/**
 * @swagger
 * /money-requests/incoming:
 *   get:
 *     summary: List incoming money requests
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, declined, cancelled]
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
 *         description: Incoming requests retrieved
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
 *                       requester:
 *                         type: object
 *                       amount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/incoming", protect, ctrl.listIncoming);

/**
 * @swagger
 * /money-requests/outgoing:
 *   get:
 *     summary: List outgoing money requests
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, declined, cancelled]
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
 *         description: Outgoing requests retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       401:
 *         description: Unauthorized
 */
router.get("/outgoing", protect, ctrl.listOutgoing);

/**
 * @swagger
 * /money-requests/{id}/pay:
 *   post:
 *     summary: Pay a money request
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, bank_transfer]
 *                 example: "wallet"
 *     responses:
 *       200:
 *         description: Request paid successfully
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
 *       404:
 *         description: Request not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/pay", protect, ctrl.payRequest);

/**
 * @swagger
 * /money-requests/{id}/decline:
 *   post:
 *     summary: Decline a money request
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Insufficient funds"
 *     responses:
 *       200:
 *         description: Request declined
 *       404:
 *         description: Request not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/decline", protect, ctrl.declineRequest);

/**
 * @swagger
 * /money-requests/{id}/cancel:
 *   post:
 *     summary: Cancel an outgoing money request (only by requester)
 *     tags: [MoneyRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request cancelled
 *       404:
 *         description: Request not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/cancel", protect, ctrl.cancelRequest);

module.exports = router;
