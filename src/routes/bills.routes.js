const express = require("express");
const router = express.Router();
const billsController = require("../controllers/billsController");
const { protect } = require("../middleware/auth");

// ==============================
// Swagger Tag: Bills
// ==============================
/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Manage bill payments (airtime, data, electricity, school fees, transport)
 */

// --------------------
// Buy Airtime
// --------------------
/**
 * @swagger
 * /bills/airtime:
 *   post:
 *     summary: Buy airtime
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - amount
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *               amount:
 *                 type: number
 *                 example: 500
 *               network:
 *                 type: string
 *                 enum: [MTN, GLO, AIRTEL, 9MOBILE]
 *                 example: "MTN"
 *     responses:
 *       200:
 *         description: Airtime purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Airtime purchase successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amount:
 *                   type: number
 *                   example: 500
 *                 phoneNumber:
 *                   type: string
 *                   example: "08012345678"
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/airtime", protect, billsController.buyAirtime);

// --------------------
// Buy Data
// --------------------
/**
 * @swagger
 * /bills/data:
 *   post:
 *     summary: Buy data plan
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - dataPlanId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *               dataPlanId:
 *                 type: string
 *                 example: "DP001"
 *               network:
 *                 type: string
 *                 enum: [MTN, GLO, AIRTEL, 9MOBILE]
 *                 example: "MTN"
 *     responses:
 *       200:
 *         description: Data plan purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data purchase successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 plan:
 *                   type: string
 *                   example: "2GB - 30 Days"
 *                 amount:
 *                   type: number
 *                   example: 1000
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/data", protect, billsController.buyData);

// --------------------
// Buy Electricity
// --------------------
/**
 * @swagger
 * /bills/electricity:
 *   post:
 *     summary: Pay electricity bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meterNumber
 *               - amount
 *               - provider
 *             properties:
 *               meterNumber:
 *                 type: string
 *                 example: "12345678901"
 *               amount:
 *                 type: number
 *                 example: 5000
 *               provider:
 *                 type: string
 *                 enum: [IKEDC, EKEDC, PHCN, ABUJA_DISCO, LAGOS_DISCO]
 *                 example: "IKEDC"
 *               meterType:
 *                 type: string
 *                 enum: [PREPAID, POSTPAID]
 *                 example: "PREPAID"
 *     responses:
 *       200:
 *         description: Electricity bill paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Electricity bill payment successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amount:
 *                   type: number
 *                   example: 5000
 *                 meterNumber:
 *                   type: string
 *                   example: "12345678901"
 *                 token:
 *                   type: string
 *                   example: "1234-5678-9012-3456"
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/electricity", protect, billsController.buyElectricity);

// --------------------
// Pay School Fees
// --------------------
/**
 * @swagger
 * /bills/schoolfees:
 *   post:
 *     summary: Pay school fees
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - amount
 *               - schoolName
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "STU12345"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               schoolName:
 *                 type: string
 *                 example: "University of Lagos"
 *               session:
 *                 type: string
 *                 example: "2024/2025"
 *               term:
 *                 type: string
 *                 enum: [FIRST, SECOND, THIRD]
 *                 example: "FIRST"
 *     responses:
 *       200:
 *         description: School fees paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "School fees payment successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amount:
 *                   type: number
 *                   example: 50000
 *                 studentId:
 *                   type: string
 *                   example: "STU12345"
 *                 receiptNumber:
 *                   type: string
 *                   example: "RCP2024001"
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/schoolfees", protect, billsController.paySchoolFees);

// --------------------
// Pay Transport
// --------------------
/**
 * @swagger
 * /bills/transport:
 *   post:
 *     summary: Pay transport fare/booking
 *     tags: [Bills]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *               transportType:
 *                 type: string
 *                 enum: [BUS, TRAIN, TAXI, RIDE_SHARE]
 *                 example: "BUS"
 *               route:
 *                 type: string
 *                 example: "Lagos to Ibadan"
 *               bookingReference:
 *                 type: string
 *                 example: "BK123456"
 *     responses:
 *       200:
 *         description: Transport payment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transport payment successful"
 *                 transactionId:
 *                   type: string
 *                   example: "TXN123456789"
 *                 amount:
 *                   type: number
 *                   example: 2000
 *                 ticketNumber:
 *                   type: string
 *                   example: "TKT987654321"
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/transport", protect, billsController.payTransport);

module.exports = router;