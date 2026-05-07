const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/referralController");

/**
 * @swagger
 * tags:
 *   name: Referral
 *   description: Referral program operations
 */

/**
 * @swagger
 * /referral/code:
 *   post:
 *     summary: Generate a referral code
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral code generated
 */
router.post("/code", protect, ctrl.generateReferralCode);

/**
 * @swagger
 * /referral/apply:
 *   post:
 *     summary: Apply a referral code
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Referral code applied
 */
router.post("/apply", protect, ctrl.applyReferralCode);

/**
 * @swagger
 * /referral:
 *   get:
 *     summary: Get my referrals
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referrals retrieved
 */
router.get("/", protect, ctrl.myReferrals);

/**
 * @swagger
 * /referral/rewards:
 *   get:
 *     summary: Get referral rewards summary
 *     tags: [Referral]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rewards summary retrieved
 */
router.get("/rewards", protect, ctrl.rewardSummary);

module.exports = router;