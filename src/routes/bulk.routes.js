const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/bulkController");

/**
 * @swagger
 * tags:
 *   name: Bulk
 *   description: Bulk payment operations
 */

/**
 * @swagger
 * /bulk/disburse:
 *   post:
 *     summary: Bulk disbursement
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Bulk disbursement completed
 */
router.post("/bulk/disburse", protect, ctrl.bulkDisburse);

/**
 * @swagger
 * /bulk/payroll:
 *   post:
 *     summary: Process salary payroll
 *     tags: [Bulk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employees:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Payroll processed successfully
 */
router.post("/bulk/payroll", protect, ctrl.paySalary);

module.exports = router;