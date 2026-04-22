const express = require("express");
const router = express.Router();
const investController = require("../controllers/investController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Investments
// ==============================
/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: Manage investment plans and portfolios
 */

// --------------------
// Create Investment
// --------------------
/**
 * @swagger
 * /investments:
 *   post:
 *     summary: Create a new investment
 *     tags: [Investments]
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
 *               - amount
 *             properties:
 *               planId:
 *                 type: string
 *                 example: "PLAN001"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               duration:
 *                 type: string
 *                 enum: [3, 6, 9, 12]
 *                 description: Duration in months
 *                 example: "6"
 *               autoReinvest:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Investment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Investment created successfully"
 *                 investmentId:
 *                   type: string
 *                   example: "INV123456789"
 *                 plan:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Fixed Savings Plan"
 *                     roi:
 *                       type: number
 *                       example: 12.5
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 duration:
 *                   type: number
 *                   example: 6
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-22"
 *                 maturityDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-10-22"
 *                 expectedReturns:
 *                   type: number
 *                   example: 6250
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Investment plan not found
 */
router.post("/", protect, investController.createInvestment);

// --------------------
// List All Investments
// --------------------
/**
 * @swagger
 * /investments:
 *   get:
 *     summary: Get all investments for the authenticated user
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED, MATURED]
 *         description: Filter by investment status
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
 *           enum: [createdAt, maturityDate, amount]
 *           default: createdAt
 *         description: Sort field
 *         example: "createdAt"
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
 *         description: List of investments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 2
 *                 investments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "INV123456789"
 *                       planName:
 *                         type: string
 *                         example: "Fixed Savings Plan"
 *                       amount:
 *                         type: number
 *                         example: 50000
 *                       roi:
 *                         type: number
 *                         example: 12.5
 *                       duration:
 *                         type: number
 *                         example: 6
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         example: "2026-04-22"
 *                       maturityDate:
 *                         type: string
 *                         format: date
 *                         example: "2026-10-22"
 *                       status:
 *                         type: string
 *                         example: "ACTIVE"
 *                       currentValue:
 *                         type: number
 *                         example: 52604.17
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, investController.listInvestments);

// --------------------
// Get Single Investment
// --------------------
/**
 * @swagger
 * /investments/{id}:
 *   get:
 *     summary: Get details of a specific investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *         example: "INV123456789"
 *     responses:
 *       200:
 *         description: Investment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "INV123456789"
 *                 plan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "PLAN001"
 *                     name:
 *                       type: string
 *                       example: "Fixed Savings Plan"
 *                     description:
 *                       type: string
 *                       example: "High-yield fixed savings with guaranteed returns"
 *                     roi:
 *                       type: number
 *                       example: 12.5
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-04-22"
 *                 maturityDate:
 *                   type: string
 *                   format: date
 *                   example: "2026-10-22"
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *                 autoReinvest:
 *                   type: boolean
 *                   example: false
 *                 expectedReturns:
 *                   type: number
 *                   example: 6250
 *                 currentValue:
 *                   type: number
 *                   example: 52604.17
 *                 accruedInterest:
 *                   type: number
 *                   example: 2604.17
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "investment"
 *                       amount:
 *                         type: number
 *                         example: 50000
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-04-22T10:00:00.000Z"
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied - investment belongs to another user
 *       404:
 *         description: Investment not found
 */
router.get("/:id", protect, investController.getInvestment);

module.exports = router;