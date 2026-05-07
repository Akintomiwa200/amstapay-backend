const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/cableController");

/**
 * @swagger
 * tags:
 *   name: Cable
 *   description: Cable TV subscription payments
 */

/**
 * @swagger
 * /cable:
 *   post:
 *     summary: Buy cable TV subscription
 *     tags: [Cable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 example: "DSTV"
 *               package:
 *                 type: string
 *                 example: "Premium"
 *               smartCardNumber:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Cable subscription purchased
 */
router.post("/cable", protect, ctrl.buyCable);

/**
 * @swagger
 * /cable/verify:
 *   post:
 *     summary: Verify cable customer
 *     tags: [Cable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               smartCardNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer verified
 */
router.post("/cable/verify", protect, ctrl.verifyCableCustomer);

/**
 * @swagger
 * /cable/plans:
 *   get:
 *     summary: Get available cable plans
 *     tags: [Cable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cable plans retrieved
 */
router.get("/cable/plans", protect, ctrl.getCablePlans);

module.exports = router;