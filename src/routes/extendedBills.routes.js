const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/extendedBillsController");

/**
 * @swagger
 * tags:
 *   name: ExtendedBills
 *   description: Extended bill payment services (merchant, utility providers)
 */

/**
 * @swagger
 * /bills/providers:
 *   get:
 *     summary: Get available bill payment providers
 *     tags: [ExtendedBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [utility, education, government, cable, insurance]
 *         description: Filter by provider category
 *     responses:
 *       200:
 *         description: List of providers retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       supportedServices:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/providers", ctrl.getProviders);

/**
 * @swagger
 * /bills/pay:
 *   post:
 *     summary: Pay a bill to a registered provider
 *     tags: [ExtendedBills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - customerReference
 *               - amount
 *             properties:
 *               providerId:
 *                 type: string
 *                 example: "prov_abc123"
 *               customerReference:
 *                 type: string
 *                 example: "CUST-2024-001"
 *               amount:
 *                 type: number
 *                 example: 5000
 *               customerName:
 *                 type: string
 *                 example: "John Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *                 example: "+2348012345678"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Bill payment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transactionId:
 *                   type: string
 *                 reference:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/pay", protect, ctrl.payBill);

/**
 * @swagger
 * /bills/merchant:
 *   post:
 *     summary: Create a merchant payment request
 *     tags: [ExtendedBills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchantId
 *               - amount
 *             properties:
 *               merchantId:
 *                 type: string
 *                 example: "merch_xyz789"
 *               amount:
 *                 type: number
 *                 example: 25000
 *               description:
 *                 type: string
 *                 example: "Monthly rental payment"
 *               invoiceNumber:
 *                 type: string
 *                 example: "INV-2024-056"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Merchant payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentRequestId:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, paid, overdue]
 *       401:
 *         description: Unauthorized
 */
router.post("/merchant", protect, ctrl.merchantPayment);

module.exports = router;
