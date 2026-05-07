const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const internationalController = require("../controllers/internationalController");

/**
 * @swagger
 * tags:
 *   name: International
 *   description: International money transfer
 */

/**
 * @swagger
 * /international/transfer:
 *   post:
 *     summary: Initiate an international money transfer
 *     tags: [International]
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
 *               - receiverCountry
 *               - receiverCurrency
 *               - receiverAccountName
 *               - receiverAccountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50000
 *               receiverCountry:
 *                 type: string
 *                 example: "US"
 *               receiverCurrency:
 *                 type: string
 *                 example: "USD"
 *               receiverAccountName:
 *                 type: string
 *                 example: "John Smith"
 *               receiverAccountNumber:
 *                 type: string
 *                 example: "123456789"
 *               receiverBank:
 *                 type: string
 *                 example: "Chase Bank"
 *               receiverSwiftCode:
 *                 type: string
 *                 example: "CHASUS33"
 *               receiverEmail:
 *                 type: string
 *                 example: "john@example.com"
 *               receiverPhone:
 *                 type: string
 *                 example: "+12345678901"
 *               description:
 *                 type: string
 *                 example: "Family support"
 *     responses:
 *       201:
 *         description: International transfer initiated
 *       400:
 *         description: Insufficient funds or invalid data
 */
router.post("/transfer", protect, internationalController.initiateInternationalTransfer);

/**
 * @swagger
 * /international/rates:
 *   get:
 *     summary: Get current exchange rates
 *     tags: [International]
 *     responses:
 *       200:
 *         description: Exchange rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rates:
 *                   type: object
 *                   properties:
 *                     USD:
 *                       type: object
 *                       properties:
 *                         rate:
 *                           type: number
 *                           example: 0.00067
 *                         name:
 *                           type: string
 *                           example: "US Dollar"
 */
router.get("/rates", internationalController.getExchangeRates);

/**
 * @swagger
 * /international/countries:
 *   get:
 *     summary: Get supported countries for international transfers
 *     tags: [International]
 *     responses:
 *       200:
 *         description: List of supported countries
 */
router.get("/countries", internationalController.getSupportedCountries);

/**
 * @swagger
 * /international/send-otp:
 *   post:
 *     summary: Send OTP for international transfer verification
 *     tags: [International]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: "johndoe@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send-otp", protect, internationalController.sendInternationalTransferOTP);

/**
 * @swagger
 * /international/verify-otp:
 *   post:
 *     summary: Verify OTP for international transfer
 *     tags: [International]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *               - code
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/verify-otp", protect, internationalController.verifyInternationalTransferOTP);

module.exports = router;