const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/cashbackController");

/**
 * @swagger
 * tags:
 *   name: Cashback
 *   description: Cashback rewards and cashback history
 */

/**
 * @swagger
 * /rewards/cashback:
 *   get:
 *     summary: Get cashback rewards history and balance
 *     tags: [Cashback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter end date
 *     responses:
 *       200:
 *         description: Cashback rewards retrieved
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
 *                     totalEarned:
 *                       type: number
 *                     availableBalance:
 *                       type: number
 *                     redeemedThisMonth:
 *                       type: number
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           cashbackAmount:
 *                             type: number
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listRewards);

module.exports = router;
