const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/jointAccountController");

/**
 * @swagger
 * tags:
 *   name: JointAccount
 *   description: Joint account management and shared finances
 */

/**
 * @swagger
 * /joint-accounts:
 *   post:
 *     summary: Create a new joint account
 *     tags: [JointAccount]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - primaryAccountNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Family Savings"
 *               primaryAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               type:
 *                 type: string
 *                 enum: [savings, current, fixed_deposit]
 *                 example: "savings"
 *               owners:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add as owners
 *                 example: ["user123", "user456"]
 *               permissions:
 *                 type: object
 *                 properties:
 *                   requireApproval:
 *                     type: boolean
 *                     example: false
 *                   maxWithdrawal:
 *                     type: number
 *                     example: 100000
 *     responses:
 *       201:
 *         description: Joint account created successfully
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
 *                     accountId:
 *                       type: string
 *                     accountNumber:
 *                       type: string
 *                     name:
 *                       type: string
 *                     owners:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createJoint);

/**
 * @swagger
 * /joint-accounts:
 *   get:
 *     summary: List all joint accounts for the user
 *     tags: [JointAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, frozen, closed]
 *         description: Filter by account status
 *     responses:
 *       200:
 *         description: Joint accounts retrieved
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
 *                       name:
 *                         type: string
 *                       accountNumber:
 *                         type: string
 *                       balance:
 *                         type: number
 *                       ownerCount:
 *                         type: integer
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listJoint);

/**
 * @swagger
 * /joint-accounts/{id}/fund:
 *   post:
 *     summary: Fund a joint account from user's wallet
 *     tags: [JointAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Joint account ID
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
 *                 example: 50000
 *               sourceWallet:
 *                 type: string
 *                 enum: [main, savings, virtual]
 *                 example: "main"
 *     responses:
 *       200:
 *         description: Joint account funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Insufficient funds or invalid amount
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/fund", protect, ctrl.fundJoint);

/**
 * @swagger
 * /joint-accounts/{id}/withdraw:
 *   post:
 *     summary: Withdraw from joint account to personal wallet
 *     tags: [JointAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Joint account ID
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
 *               destinationWallet:
 *                 type: string
 *                 example: "main"
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactionId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 remainingBalance:
 *                   type: number
 *       400:
 *         description: Exceeds withdrawal limit or insufficient balance
 *       404:
 *         description: Account not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/withdraw", protect, ctrl.withdrawJoint);

module.exports = router;
