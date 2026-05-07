const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/insuranceController");

/**
 * @swagger
 * tags:
 *   name: Insurance
 *   description: Insurance policy operations
 */

/**
 * @swagger
 * /insurance:
 *   post:
 *     summary: Purchase an insurance policy
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policyType:
 *                 type: string
 *                 example: "life"
 *               amount:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Insurance purchased successfully
 */
router.post("/", protect, ctrl.purchaseInsurance);

/**
 * @swagger
 * /insurance:
 *   get:
 *     summary: List my insurance policies
 *     tags: [Insurance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policies retrieved
 */
router.get("/", protect, ctrl.listMyPolicies);

/**
 * @swagger
 * /insurance/{id}:
 *   get:
 *     summary: Get insurance policy details
 *     tags: [Insurance]
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
 *         description: Policy details retrieved
 */
router.get("/:id", protect, ctrl.getPolicy);

/**
 * @swagger
 * /insurance/{id}/claim:
 *   post:
 *     summary: File an insurance claim
 *     tags: [Insurance]
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
 *         description: Claim filed successfully
 */
router.post("/:id/claim", protect, ctrl.fileClaim);

/**
 * @swagger
 * /insurance/{id}/cancel:
 *   post:
 *     summary: Cancel an insurance policy
 *     tags: [Insurance]
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
 *         description: Policy cancelled successfully
 */
router.post("/:id/cancel", protect, ctrl.cancelPolicy);

module.exports = router;