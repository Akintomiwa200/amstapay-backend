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
// Get Investment Plans (Catalog)
// --------------------
/**
 * @swagger
 * /investments/plans:
 *   get:
 *     summary: Get all available investment plans
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mutual-fund, stocks, treasury-bills, bonds, fixed-savings, high-yield]
 *         description: Filter by plan type
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum investment amount filter
 *     responses:
 *       200:
 *         description: List of investment plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       code:
 *                         type: string
 *                         example: "PLAN001"
 *                       name:
 *                         type: string
 *                         example: "Fixed Savings Plan"
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                       roi:
 *                         type: number
 *                       minInvestment:
 *                         type: number
 *                       maxInvestment:
 *                         type: number
 *                       durations:
 *                         type: array
 *                       riskLevel:
 *                         type: string
 *                       payoutSchedule:
 *                         type: string
 *       401:
 *         description: Not authorized
 */
router.get("/plans", protect, investController.getInvestmentPlans);

// --------------------
// Get Single Investment Plan
// --------------------
/**
 * @swagger
 * /investments/plans/{planId}:
 *   get:
 *     summary: Get details of a specific investment plan
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID (code)
 *     responses:
 *       200:
 *         description: Plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plan:
 *                   $ref: '#/components/schemas/Investment'
 *       404:
 *         description: Plan not found
 */
router.get("/plans/:planId", protect, investController.getInvestmentPlan);

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
 *                 type: number
 *                 enum: [3, 6, 9, 12]
 *                 description: Duration in months
 *                 example: 6
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Investment created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     investment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "INV123456789"
 *                         plan:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Fixed Savings Plan"
 *                             roi:
 *                               type: number
 *                               example: 12.5
 *                         amount:
 *                           type: number
 *                           example: 50000
 *                         duration:
 *                           type: number
 *                           example: 6
 *                         startDate:
 *                           type: string
 *                           format: date
 *                         maturityDate:
 *                           type: string
 *                           format: date
 *                         expectedReturns:
 *                           type: number
 *                           example: 3125
 *                         autoReinvest:
 *                           type: boolean
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
 *           enum: [ACTIVE, PENDING, MATURED, CANCELLED]
 *         description: Filter by investment status
 *         example: "ACTIVE"
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, maturityDate, amount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of investments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 investments:
 *                   type: array
 *                   items:
 *                     type: object
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
 *     responses:
 *       200:
 *         description: Investment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Investment not found
 */
router.get("/:id", protect, investController.getInvestment);

module.exports = router;