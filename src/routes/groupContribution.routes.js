const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/groupContributionController");

/**
 * @swagger
 * tags:
 *   name: GroupContribution
 *   description: Group savings and contribution management
 */

/**
 * @swagger
 * /group-contributions:
 *   post:
 *     summary: Create a new group contribution
 *     tags: [GroupContribution]
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
 *               - targetAmount
 *               - contributionAmount
 *               - frequency
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rotating Savings Group"
 *               description:
 *                 type: string
 *                 example: "Monthly contribution group"
 *               targetAmount:
 *                 type: number
 *                 example: 500000
 *               contributionAmount:
 *                 type: number
 *                 example: 50000
 *               frequency:
 *                 type: string
 *                 enum: [weekly, monthly, quarterly]
 *                 example: "monthly"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to invite
 *                 example: ["user123", "user456"]
 *     responses:
 *       201:
 *         description: Group contribution created successfully
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
 *                     groupId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     contributionCycle:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createGroup);

/**
 * @swagger
 * /group-contributions:
 *   get:
 *     summary: List all group contributions for the user
 *     tags: [GroupContribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: Filter by group status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, member]
 *         description: Filter by user role in group
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
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
 *                       targetAmount:
 *                         type: number
 *                       contributionAmount:
 *                         type: number
 *                       frequency:
 *                         type: string
 *                       memberCount:
 *                         type: integer
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listGroups);

/**
 * @swagger
 * /group-contributions/{id}:
 *   get:
 *     summary: Get group contribution details
 *     tags: [GroupContribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                 contributions:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", protect, ctrl.getGroup);

/**
 * @swagger
 * /group-contributions/{id}/contribute:
 *   post:
 *     summary: Make a contribution to the group
 *     tags: [GroupContribution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, bank_transfer]
 *                 example: "wallet"
 *               note:
 *                 type: string
 *                 example: "March contribution"
 *     responses:
 *       200:
 *         description: Contribution successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 contributionId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 remainingBalance:
 *                   type: number
 *       400:
 *         description: Invalid amount
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/contribute", protect, ctrl.contribute);

module.exports = router;
