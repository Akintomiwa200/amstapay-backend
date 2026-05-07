// routes/verification.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  verifyBVN,
  verifyNIN,
  verifyBankAccount,
} = require("../controllers/verificationController");

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: Identity and bank verification services
 */

/**
 * @swagger
 * /verification/bvn:
 *   post:
 *     summary: Verify BVN (Bank Verification Number)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bvn
 *             properties:
 *               bvn:
 *                 type: string
 *                 example: "12345678901"
 *     responses:
 *       200:
 *         description: BVN verified successfully
 */
router.post("/bvn", protect, verifyBVN);

/**
 * @swagger
 * /verification/nin:
 *   post:
 *     summary: Verify NIN (National Identity Number)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nin
 *             properties:
 *               nin:
 *                 type: string
 *                 example: "12345678901"
 *     responses:
 *       200:
 *         description: NIN verified successfully
 */
router.post("/nin", protect, verifyNIN);

/**
 * @swagger
 * /verification/bank:
 *   post:
 *     summary: Verify bank account number
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               bankCode:
 *                 type: string
 *                 example: "057"
 *     responses:
 *       200:
 *         description: Bank account verified successfully
 */
router.post("/bank", protect, verifyBankAccount);

module.exports = router;