const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/invoiceController");

/**
 * @swagger
 * tags:
 *   name: Invoice
 *   description: Invoice creation, sending, and payment
 */

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - items
 *             properties:
 *               recipientId:
 *                 type: string
 *                 example: "user_recipient123"
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: "client@example.com"
 *               recipientName:
 *                 type: string
 *                 example: "John Doe"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: "Web development services"
 *                     quantity:
 *                       type: number
 *                       example: 10
 *                     unitPrice:
 *                       type: number
 *                       example: 5000
 *                     taxRate:
 *                       type: number
 *                       example: 7.5
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-28"
 *               notes:
 *                 type: string
 *                 example: "Payment due within 30 days"
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, GBP]
 *                 example: "NGN"
 *     responses:
 *       201:
 *         description: Invoice created successfully
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
 *                     invoiceId:
 *                       type: string
 *                     invoiceNumber:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     dueDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [draft, sent, viewed, paid, overdue, cancelled]
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, ctrl.createInvoice);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: List all invoices for the user
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, viewed, paid, overdue, cancelled, all]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Invoices retrieved
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
 *                       invoiceNumber:
 *                         type: string
 *                       recipientName:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ctrl.listInvoices);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get invoice details
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 invoiceNumber:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                 subtotal:
 *                   type: number
 *                 tax:
 *                   type: number
 *                 totalAmount:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                 notes:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", protect, ctrl.getInvoice);

/**
 * @swagger
 * /invoices/{id}/send:
 *   post:
 *     summary: Send invoice to recipient via email
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: "newclient@example.com"
 *               message:
 *                 type: string
 *                 example: "Please find your invoice attached"
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sentTo:
 *                   type: string
 *                   format: email
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/send", protect, ctrl.sendInvoice);

/**
 * @swagger
 * /invoices/{id}/pay:
 *   post:
 *     summary: Pay an invoice (by payer)
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, bank_transfer]
 *                 example: "wallet"
 *               note:
 *                 type: string
 *                 example: "Payment for February invoice"
 *     responses:
 *       200:
 *         description: Invoice payment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactionId:
 *                   type: string
 *                 amountPaid:
 *                   type: number
 *                 remainingBalance:
 *                   type: number
 *       400:
 *         description: Invalid amount or invoice already paid
 *       404:
 *         description: Invoice not found
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/pay", protect, ctrl.payInvoice);

module.exports = router;
