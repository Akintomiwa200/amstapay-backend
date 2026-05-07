const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Reports
// ==============================
/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Generate financial reports and statements
 */

// --------------------
// Generate Statement
// --------------------
/**
 * @swagger
 * /reports/statement:
 *   post:
 *     summary: Generate account statement for a specific period
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *             properties:
 *               period:
 *                 type: string
 *                 description: Period in YYYY-MM format
 *                 example: "2024-09"
 *               reportType:
 *                 type: string
 *                 enum: [monthly, quarterly, annual]
 *                 example: "monthly"
 *               format:
 *                 type: string
 *                 enum: [json, pdf]
 *                 example: "json"
 *     responses:
 *       200:
 *         description: Statement generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Statement generated successfully"
 *                 report:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: "2024-09"
 *                     reportType:
 *                       type: string
 *                       example: "monthly"
 *                     totalIncome:
 *                       type: number
 *                       example: 50000
 *                     totalExpense:
 *                       type: number
 *                       example: 35000
 *                     netSavings:
 *                       type: number
 *                       example: 15000
 *                     categories:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid period format
 *       401:
 *         description: Unauthorized
 */
router.post("/statement", protect, reportsController.generateStatement);

// --------------------
// Budget Insights
// --------------------
/**
 * @swagger
 * /reports/budget-insights:
 *   get:
 *     summary: Get budget insights and spending analysis
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           example: "monthly"
 *         description: Analysis period (monthly, quarterly, annual)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis
 *     responses:
 *       200:
 *         description: Budget insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: object
 *                   properties:
 *                     spendingByCategory:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     topMerchants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                     budgetHealth:
 *                       type: string
 *                       enum: [excellent, good, fair, poor]
 *                     advice:
 *                       type: array
 *                       items:
 *                         type: string
 *                     projectedBalance:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/budget-insights", protect, reportsController.budgetInsights);

// --------------------
// Get Report by ID
// --------------------
/**
 * @swagger
 * /reports/{reportId}:
 *   get:
 *     summary: Get a specific report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:reportId", protect, reportsController.getReport);

// --------------------
// Delete Report
// --------------------
/**
 * @swagger
 * /reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:reportId", protect, reportsController.deleteReport);

// --------------------
// Export Report (PDF/CSV)
// --------------------
/**
 * @swagger
 * /reports/{reportId}/export:
 *   get:
 *     summary: Export report to PDF or CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, csv, json]
 *           default: pdf
 *         description: Export format
 *     responses:
 *       200:
 *         description: Report exported successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:reportId/export", protect, reportsController.exportReport);

module.exports = router;