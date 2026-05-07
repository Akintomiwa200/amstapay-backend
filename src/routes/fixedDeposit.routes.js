const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/fixedDepositController");

/**
 * @swagger
 * tags:
 *   name: FixedDeposit
 *   description: Fixed term deposit and savings lock
 */

/**
 * @swagger
 * /fixed-deposits:
 *   post:
 *     summary: Create a fixed deposit
 *     tags: [FixedDeposit]
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
 *               - durationMonths
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10000
 *                 example: 100000
 *               durationMonths:
 *                 type: number
 *                 enum: [3, 6, 12, 24]
 *                 example: 12
 *               autoRenew:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Fixed deposit created successfully
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
 *                     depositId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     interestRate:
 *                       type: number
 *                     maturityAmount:
 *                       type: number
 *                     maturityDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid amount or duration
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createDeposit);

/**
 * @swagger
 * /fixed-deposits:
 *   get:
 *     summary: List all fixed deposits for the user
 *     tags: [FixedDeposit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, matured, claimed, cancelled]
 *         description: Filter by deposit status
 *     responses:
 *       200:
 *         description: Fixed deposits retrieved
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
 *                       amount:
 *                         type: number
 *                       interestRate:
 *                         type: number
 *                       maturityAmount:
 *                         type: number
 *                       maturityDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listDeposits);

/**
 * @swagger
 * /fixed-deposits/{id}/claim:
 *   post:
 *     summary: Claim matured fixed deposit
 *     tags: [FixedDeposit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deposit ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transferToWallet:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Deposit claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 amountCredited:
 *                   type: number
 *       400:
 *         description: Deposit not yet matured
 *       404:
 *         description: Deposit not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/claim", protect, ctrl.claimDeposit);

module.exports = router;
