const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");
const supportCtrl = require("../controllers/supportController");

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

// Dashboard & Stats
/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get("/dashboard/stats", protect, isAdmin, ctrl.getDashboardStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list retrieved
 */
router.get("/users", protect, isAdmin, ctrl.getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved
 */
router.get("/users/:id", protect, isAdmin, ctrl.getUserDetail);

/**
 * @swagger
 * /admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved
 */
router.get("/transactions", protect, isAdmin, ctrl.getTransactions);

/**
 * @swagger
 * /admin/tickets:
 *   get:
 *     summary: Get all support tickets
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets retrieved
 */
router.get("/tickets", protect, isAdmin, ctrl.getTickets);

/**
 * @swagger
 * /admin/tickets/{id}/resolve:
 *   post:
 *     summary: Resolve a ticket
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket resolved
 */
router.post("/tickets/:id/resolve", protect, isAdmin, supportCtrl.resolveTicket);

/**
 * @swagger
 * /admin/tickets/{id}/assign:
 *   post:
 *     summary: Assign a support ticket to an agent
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 example: "user_agent123"
 *               note:
 *                 type: string
 *                 example: "Assigning to support agent for follow-up"
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       404:
 *         description: Ticket not found
 */
router.post("/tickets/:id/assign", protect, isAdmin, supportCtrl.assignTicket);

/**
 * @swagger
 * /admin/health:
 *   get:
 *     summary: Get system health
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved
 */
router.get("/health", protect, isAdmin, ctrl.getSystemHealth);

// Loan Management
/**
 * @swagger
 * /admin/loans:
 *   get:
 *     summary: Get all loans
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loans retrieved
 */
router.get("/loans", protect, isAdmin, ctrl.getAllLoans);

/**
 * @swagger
 * /admin/loans/{id}/approve:
 *   post:
 *     summary: Approve a loan application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvedAmount:
 *                 type: number
 *                 description: Optional custom approved amount
 *               interestRate:
 *                 type: number
 *                 description: Optional custom interest rate
 *               notes:
 *                 type: string
 *                 example: "Loan approved after background check"
 *     responses:
 *       200:
 *         description: Loan approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 loan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "APPROVED"
 *       404:
 *         description: Loan not found
 *       400:
 *         description: Invalid loan state for approval
 */
router.post("/loans/:id/approve", protect, isAdmin, ctrl.approveLoan);

/**
 * @swagger
 * /admin/loans/{id}/reject:
 *   post:
 *     summary: Reject a loan application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Insufficient credit score"
 *     responses:
 *       200:
 *         description: Loan rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "REJECTED"
 *       404:
 *         description: Loan not found
 *       400:
 *         description: Invalid loan state for rejection
 */
router.post("/loans/:id/reject", protect, isAdmin, ctrl.rejectLoan);

/**
 * @swagger
 * /admin/loans/{id}/disburse:
 *   post:
 *     summary: Disburse approved loan to user's wallet
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Loan ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disbursementMethod:
 *                 type: string
 *                 enum: [wallet, bank_transfer]
 *                 example: "wallet"
 *               reference:
 *                 type: string
 *                 example: "Disbursement for April quarter"
 *     responses:
 *       200:
 *         description: Loan disbursed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transactionId:
 *                   type: string
 *                 amount:
 *                   type: number
 *       404:
 *         description: Loan not found
 *       400:
 *         description: Loan not in disbursable state
 */
router.post("/loans/:id/disburse", protect, isAdmin, ctrl.disburseLoan);

module.exports = router;