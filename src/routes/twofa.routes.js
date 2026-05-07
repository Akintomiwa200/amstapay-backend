const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/twoFAController");

/**
 * @swagger
 * tags:
 *   name: 2FA
 *   description: Two-factor authentication operations
 */

/**
 * @swagger
 * /2fa/setup:
 *   post:
 *     summary: Setup 2FA
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 */
router.post("/2fa/setup", protect, ctrl.setup2FA);

/**
 * @swagger
 * /2fa/verify:
 *   post:
 *     summary: Verify and enable 2FA
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 */
router.post("/2fa/verify", protect, ctrl.verifyAndEnable2FA);

/**
 * @swagger
 * /2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 */
router.post("/2fa/disable", protect, ctrl.disable2FA);

/**
 * @swagger
 * /2fa/status:
 *   get:
 *     summary: Get 2FA status
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA status retrieved
 */
router.get("/2fa/status", protect, ctrl.get2FAStatus);

module.exports = router;