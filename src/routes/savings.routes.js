const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/savingsController");

/**
 * @swagger
 * tags:
 *   name: Savings
 *   description: Savings goal operations
 */

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vacation Fund"
 *               targetAmount:
 *                 type: number
 *                 example: 100000
 *               deadline:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Savings goal created successfully
 */
router.post("/goals", protect, ctrl.createGoal);

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: List my savings goals
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Goals retrieved
 */
router.get("/goals", protect, ctrl.listGoals);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Get savings goal details
 *     tags: [Savings]
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
 *         description: Goal details retrieved
 */
router.get("/goals/:id", protect, ctrl.getGoal);

/**
 * @swagger
 * /goals/{id}/deposit:
 *   post:
 *     summary: Deposit to a savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 */
router.post("/goals/:id/deposit", protect, ctrl.depositToGoal);

/**
 * @swagger
 * /goals/{id}/withdraw:
 *   post:
 *     summary: Withdraw from a savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 */
router.post("/goals/:id/withdraw", protect, ctrl.withdrawFromGoal);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Cancel a savings goal
 *     tags: [Savings]
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
 *         description: Goal cancelled successfully
 */
router.delete("/goals/:id", protect, ctrl.cancelGoal);

module.exports = router;