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

router.post("/loans/:id/approve", protect, isAdmin, ctrl.approveLoan);
router.post("/loans/:id/reject", protect, isAdmin, ctrl.rejectLoan);
router.post("/loans/:id/disburse", protect, isAdmin, ctrl.disburseLoan);

module.exports = router;