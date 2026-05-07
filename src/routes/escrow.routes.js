const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/escrowController");

/**
 * @swagger
 * tags:
 *   name: Escrow
 *   description: Escrow payment operations
 */

/**
 * @swagger
 * /escrow:
 *   post:
 *     summary: Create an escrow payment
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50000
 *               receiverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Escrow created successfully
 */
router.post("/escrow", protect, ctrl.createEscrow);

/**
 * @swagger
 * /escrow:
 *   get:
 *     summary: List my escrow payments
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Escrows retrieved
 */
router.get("/escrow", protect, ctrl.listEscrows);

/**
 * @swagger
 * /escrow/{id}:
 *   get:
 *     summary: Get escrow details
 *     tags: [Escrow]
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
 *         description: Escrow details retrieved
 */
router.get("/escrow/:id", protect, ctrl.getEscrow);

/**
 * @swagger
 * /escrow/{id}/release:
 *   post:
 *     summary: Release escrow funds
 *     tags: [Escrow]
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
 *         description: Escrow released successfully
 */
router.post("/escrow/:id/release", protect, ctrl.releaseEscrow);

/**
 * @swagger
 * /escrow/{id}/dispute:
 *   post:
 *     summary: Dispute an escrow
 *     tags: [Escrow]
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
 *         description: Escrow disputed successfully
 */
router.post("/escrow/:id/dispute", protect, ctrl.disputeEscrow);

/**
 * @swagger
 * /escrow/{id}/refund:
 *   post:
 *     summary: Refund escrow funds
 *     tags: [Escrow]
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
 *         description: Escrow refunded successfully
 */
router.post("/escrow/:id/refund", protect, ctrl.refundEscrow);

module.exports = router;