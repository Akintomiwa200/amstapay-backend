const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/supportController");

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support ticket operations
 */

/**
 * @swagger
 * /support/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Need help with withdrawal"
 *               message:
 *                 type: string
 *                 example: "I cannot withdraw my money"
 *     responses:
 *       200:
 *         description: Ticket created successfully
 */
router.post("/tickets", protect, ctrl.createTicket);

/**
 * @swagger
 * /support/tickets:
 *   get:
 *     summary: List my support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets retrieved
 */
router.get("/tickets", protect, ctrl.listTickets);

/**
 * @swagger
 * /support/tickets/{id}:
 *   get:
 *     summary: Get ticket details
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details retrieved
 */
router.get("/tickets/:id", protect, ctrl.getTicket);

/**
 * @swagger
 * /support/tickets/{id}/reply:
 *   post:
 *     summary: Reply to a ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply sent successfully
 */
router.post("/tickets/:id/reply", protect, ctrl.replyTicket);

/**
 * @swagger
 * /support/tickets/{id}/close:
 *   post:
 *     summary: Close a ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket closed successfully
 */
router.post("/tickets/:id/close", protect, ctrl.closeTicket);

module.exports = router;