const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/budgetController");

/**
 * @swagger
 * tags:
 *   name: Budget
 *   description: Budget planning and spending insights
 */

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Create or update monthly budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *               - totalBudget
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 3
 *               year:
 *                 type: integer
 *                 example: 2025
 *               totalBudget:
 *                 type: number
 *                 example: 200000
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       example: "food"
 *                     limit:
 *                       type: number
 *                       example: 50000
 *               alertsEnabled:
 *                 type: boolean
 *                 example: true
 *               alertThreshold:
 *                 type: number
 *                 description: Alert when spending reaches this % (0-100)
 *                 example: 80
 *     responses:
 *       201:
 *         description: Budget created or updated successfully
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
 *                     budgetId:
 *                       type: string
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     totalBudget:
 *                       type: number
 *                     categories:
 *                       type: array
 *       400:
 *         description: Invalid budget data
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.setBudget);

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: List all budgets for the user
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *         example: 2025
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *         example: 3
 *     responses:
 *       200:
 *         description: Budgets retrieved
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
 *                       month:
 *                         type: integer
 *                       year:
 *                         type: integer
 *                       totalBudget:
 *                         type: number
 *                       totalSpent:
 *                         type: number
 *                       remaining:
 *                         type: number
 *                       categories:
 *                         type: array
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listBudgets);

/**
 * @swagger
 * /budgets/insights:
 *   get:
 *     summary: Get spending insights vs budget
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, quarterly]
 *           default: monthly
 *         description: Analysis period
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Spending insights retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       budgeted:
 *                         type: number
 *                       spent:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [under_budget, on_track, over_budget]
 *       401:
 *         description: Unauthorized
 */
router.get("/insights", protect, ctrl.getSpendingInsights);

/**
 * @swagger
 * /budgets/category:
 *   post:
 *     summary: Set category-specific budget limits
 *     tags: [Budget]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - limit
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [food, transport, entertainment, utilities, shopping, health, education, other]
 *                 example: "food"
 *               limit:
 *                 type: number
 *                 example: 50000
 *               periodType:
 *                 type: string
 *                 enum: [monthly, weekly]
 *                 example: "monthly"
 *     responses:
 *       200:
 *         description: Category budget set successfully
 *       400:
 *         description: Invalid category or limit
 *       401:
 *         description: Unauthorized
 */
router.post("/category", protect, ctrl.setCategory);

module.exports = router;
