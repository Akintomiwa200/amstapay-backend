const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/billSplitController");

/**
 * @swagger
 * tags:
 *   name: BillSplit
 *   description: Bill splitting and shared expense management
 */

/**
 * @swagger
 * /bill-splits:
 *   post:
 *     summary: Create a new bill split among multiple users
 *     tags: [BillSplit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalAmount
 *               - items
 *             properties:
 *               totalAmount:
 *                 type: number
 *                 example: 15000
 *               description:
 *                 type: string
 *                 example: "Dinner at restaurant"
 *               splitType:
 *                 type: string
 *                 enum: [equal, percentage, custom]
 *                 example: "equal"
 *               items:
 *                 type: array
 *                 description: List of participants and their share
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                     - amount
 *                   properties:
 *                     userId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     name:
 *                       type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-15"
 *               reminderFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, none]
 *                 example: "weekly"
 *     responses:
 *       201:
 *         description: Bill split created successfully
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
 *                     splitId:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     participantCount:
 *                       type: integer
 *                     dueDate:
 *                       type: string
 *       400:
 *         description: Invalid split data
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createSplit);

/**
 * @swagger
 * /bill-splits:
 *   get:
 *     summary: List all bill splits for the user
 *     tags: [BillSplit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, partial, paid, overdue]
 *         description: Filter by status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [payer, payee]
 *         description: Filter by user's role
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
 *         description: Bill splits retrieved
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
 *                       description:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       yourShare:
 *                         type: number
 *                       paidAmount:
 *                         type: number
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listSplits);

/**
 * @swagger
 * /bill-splits/{id}/pay:
 *   post:
 *     summary: Pay your share of a bill split
 *     tags: [BillSplit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bill split ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to pay (defaults to full remaining share)
 *                 example: 5000
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, bank_transfer]
 *                 example: "wallet"
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
 *                 paidAmount:
 *                   type: number
 *                 remainingBalance:
 *                   type: number
 *       400:
 *         description: Invalid amount or already fully paid
 *       404:
 *         description: Bill split not found or user not a participant
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/pay", protect, ctrl.paySplit);

module.exports = router;
