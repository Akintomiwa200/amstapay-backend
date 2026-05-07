const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/microLoanController");

/**
 * @swagger
 * tags:
 *   name: Microloan
 *   description: Quick microloan application and repayment
 */

/**
 * @swagger
 * /microloans:
 *   post:
 *     summary: Apply for a microloan
 *     tags: [Microloan]
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
 *                 minimum: 1000
 *                 maximum: 50000
 *                 example: 10000
 *               purpose:
 *                 type: string
 *                 example: "Emergency medical expense"
 *               duration:
 *                 type: number
 *                 description: Repayment duration in days (7-90)
 *                 minimum: 7
 *                 maximum: 90
 *                 example: 30
 *     responses:
 *       201:
 *         description: Microloan application submitted
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
 *                     loanId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     interestRate:
 *                       type: number
 *                     totalRepayable:
 *                       type: number
 *                     dueDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid amount or duration
 *       401:
 *         description: Unauthorized
 */
router.post("/apply", protect, ctrl.applyMicroLoan);

/**
 * @swagger
 * /microloans:
 *   get:
 *     summary: List all microloans for the authenticated user
 *     tags: [Microloan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, repaid, defaulted]
 *         description: Filter by loan status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of microloans retrieved
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
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       interestRate:
 *                         type: number
 *                       totalRepayable:
 *                         type: number
 *                       status:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listLoans);

/**
 * @swagger
 * /microloans/{id}/repay:
 *   post:
 *     summary: Repay a microloan
 *     tags: [Microloan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Microloan ID
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
 *                 example: 12000
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, bank_transfer]
 *                 example: "wallet"
 *     responses:
 *       200:
 *         description: Loan repayment successful
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
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid amount or loan not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/repay", protect, ctrl.repayMicroLoan);

module.exports = router;
