const express = require("express");
const router = express.Router();
const loansController = require("../controllers/loansController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Loans
// ==============================
/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Manage loan applications, tracking, and repayments
 */

// --------------------
// Apply for Loan
// --------------------
/**
 * @swagger
 * /loans:
 *   post:
 *     summary: Apply for a new loan
 *     tags: [Loans]
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
 *               - purpose
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100000
 *               purpose:
 *                 type: string
 *                 enum: [PERSONAL, BUSINESS, EDUCATION, MEDICAL, HOME_IMPROVEMENT]
 *                 example: "PERSONAL"
 *               duration:
 *                 type: number
 *                 description: Loan duration in months
 *                 example: 12
 *               employmentStatus:
 *                 type: string
 *                 enum: [EMPLOYED, SELF_EMPLOYED, UNEMPLOYED, STUDENT]
 *                 example: "EMPLOYED"
 *               monthlyIncome:
 *                 type: number
 *                 example: 150000
 *               guarantorDetails:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   phone:
 *                     type: string
 *                     example: "08012345678"
 *                   email:
 *                     type: string
 *                     example: "jane@example.com"
 *     responses:
 *       201:
 *         description: Loan application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Loan application submitted successfully"
 *                 loanId:
 *                   type: string
 *                   example: "LN123456789"
 *                 amount:
 *                   type: number
 *                   example: 100000
 *                 interestRate:
 *                   type: number
 *                   example: 15.5
 *                 totalRepayable:
 *                   type: number
 *                   example: 115500
 *                 monthlyInstallment:
 *                   type: number
 *                   example: 9625
 *                 duration:
 *                   type: number
 *                   example: 12
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *                 applicationDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-22"
 *       400:
 *         description: Invalid request or credit score too low
 *       401:
 *         description: Not authorized
 */
router.post("/", protect, loansController.applyLoan);

// --------------------
// List All Loans
// --------------------
/**
 * @swagger
 * /loans:
 *   get:
 *     summary: Get all loans for the authenticated user
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED]
 *         description: Filter by loan status
 *         example: "ACTIVE"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [applicationDate, amount, status]
 *           default: applicationDate
 *         description: Sort field
 *         example: "applicationDate"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "desc"
 *     responses:
 *       200:
 *         description: List of loans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 8
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 1
 *                 loans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "LN123456789"
 *                       amount:
 *                         type: number
 *                         example: 100000
 *                       outstandingBalance:
 *                         type: number
 *                         example: 75000
 *                       interestRate:
 *                         type: number
 *                         example: 15.5
 *                       duration:
 *                         type: number
 *                         example: 12
 *                       monthlyInstallment:
 *                         type: number
 *                         example: 9625
 *                       status:
 *                         type: string
 *                         example: "ACTIVE"
 *                       applicationDate:
 *                         type: string
 *                         format: date
 *                         example: "2026-04-22"
 *                       nextPaymentDate:
 *                         type: string
 *                         format: date
 *                         example: "2026-05-22"
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, loansController.listLoans);

// --------------------
// Get Single Loan Details
// --------------------
/**
 * @swagger
 * /loans/{id}:
 *   get:
 *     summary: Get detailed information about a specific loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *         example: "LN123456789"
 *     responses:
 *       200:
 *         description: Loan details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "LN123456789"
 *                 amount:
 *                   type: number
 *                   example: 100000
 *                 disbursedAmount:
 *                   type: number
 *                   example: 100000
 *                 interestRate:
 *                   type: number
 *                   example: 15.5
 *                 totalRepayable:
 *                   type: number
 *                   example: 115500
 *                 amountPaid:
 *                   type: number
 *                   example: 25000
 *                 outstandingBalance:
 *                   type: number
 *                   example: 90500
 *                 duration:
 *                   type: number
 *                   example: 12
 *                 monthlyInstallment:
 *                   type: number
 *                   example: 9625
 *                 purpose:
 *                   type: string
 *                   example: "PERSONAL"
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *                 applicationDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-22"
 *                 approvalDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-25"
 *                 disbursementDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-26"
 *                 nextPaymentDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-05-22"
 *                 paymentHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-05-22"
 *                       amount:
 *                         type: number
 *                         example: 9625
 *                       status:
 *                         type: string
 *                         example: "PAID"
 *                       transactionId:
 *                         type: string
 *                         example: "TXN123456789"
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - loan belongs to another user
 *       404:
 *         description: Loan not found
 */
router.get("/:id", protect, loansController.getLoan);

// --------------------
// Repay Loan
// --------------------
/**
 * @swagger
 * /loans/{id}/repay:
 *   post:
 *     summary: Make a repayment on a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *         example: "LN123456789"
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
 *                 description: Amount to repay (can be less than, equal to, or more than monthly installment)
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Loan repayment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Loan repayment successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amountPaid:
 *                   type: number
 *                   example: 10000
 *                 newOutstandingBalance:
 *                   type: number
 *                   example: 80500
 *                 totalPaidSoFar:
 *                   type: number
 *                   example: 35000
 *                 remainingInstallments:
 *                   type: number
 *                   example: 8
 *                 loanStatus:
 *                   type: string
 *                   example: "ACTIVE"
 *       400:
 *         description: Invalid request, insufficient funds, or loan already completed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - loan belongs to another user
 *       404:
 *         description: Loan not found
 */
router.post("/:id/repay", protect, loansController.repayLoan);

module.exports = router;