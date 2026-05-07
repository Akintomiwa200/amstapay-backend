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
 *               - network
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Airtime purchased successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bill:
 *                       type: object
 *                     transaction:
 *                       type: object
 *                     balance:
 *                       type: number
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
 *               - network
 *               - dataPlanId
 *               - amount
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "08012345678"
 *               network:
 *                 type: string
 *                 enum: [MTN, GLO, AIRTEL, 9MOBILE]
 *                 example: "MTN"
 *               dataPlanId:
 *                 type: string
 *                 example: "PLAN_2GB_MONTHLY"
 *               amount:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Data plan purchased successfully
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
 *                     plan:
 *                       type: string
 *                     balance:
 *                       type: number
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "1234-5678-9012-3456"
 *                     balance:
 *                       type: number
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     receiptNumber:
 *                       type: string
 *                       example: "RCP2024001"
 *                     balance:
 *                       type: number
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
 *               - transportType
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *               transportType:
 *                 type: string
 *                 enum: [BUS, TRAIN, TAXI, RIDE_SHARE, FLIGHT]
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketNumber:
 *                       type: string
 *                       example: "TKT987654321"
 *                     balance:
 *                       type: number
 *       400:
 *         description: Invalid request or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post("/transport", protect, billsController.payTransport);

module.exports = router;