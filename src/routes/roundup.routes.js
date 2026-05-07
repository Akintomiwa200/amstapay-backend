const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/roundupController");

/**
 * @swagger
 * tags:
 *   name: Roundup
 *   description: Round-up savings feature (spare change savings)
 */

/**
 * @swagger
 * /roundup-savings/toggle:
 *   post:
 *     summary: Enable or disable roundup savings
 *     tags: [Roundup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isEnabled
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *                 example: true
 *               roundUpToNearest:
 *                 type: integer
 *                 enum: [5, 10, 50, 100]
 *                 example: 10
 *     responses:
 *       200:
 *         description: Roundup setting updated
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
 *                     isEnabled:
 *                       type: boolean
 *                     roundUpToNearest:
 *                       type: integer
 *                     totalSaved:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.post("/toggle", protect, ctrl.toggleRoundup);

/**
 * @swagger
 * /roundup-savings:
 *   get:
 *     summary: Get roundup savings status and accumulated amount
 *     tags: [Roundup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roundup details retrieved
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
 *                     isEnabled:
 *                       type: boolean
 *                     currentRoundup:
 *                       type: number
 *                     totalSaved:
 *                       type: number
 *                     nextTransferDate:
 *                       type: string
 *                       format: date
 *                     lastTransferAmount:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.getRoundup);

module.exports = router;
