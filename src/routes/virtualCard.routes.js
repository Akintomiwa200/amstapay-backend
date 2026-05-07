const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/virtualCardController");

/**
 * @swagger
 * tags:
 *   name: VirtualCard
 *   description: Virtual card operations
 */

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Create a virtual card
 *     tags: [VirtualCard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardType:
 *                 type: string
 *                 example: "visa"
 *     responses:
 *       200:
 *         description: Card created successfully
 */
router.post("/cards", protect, ctrl.createCard);

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: List my virtual cards
 *     tags: [VirtualCard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cards retrieved
 */
router.get("/cards", protect, ctrl.listCards);

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Get card details
 *     tags: [VirtualCard]
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
 *         description: Card details retrieved
 */
router.get("/cards/:id", protect, ctrl.getCard);

/**
 * @swagger
 * /cards/{id}/freeze:
 *   patch:
 *     summary: Freeze/unfreeze a card
 *     tags: [VirtualCard]
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
 *         description: Card frozen/unfrozen successfully
 */
router.patch("/cards/:id/freeze", protect, ctrl.freezeCard);

/**
 * @swagger
 * /cards/{id}/fund:
 *   post:
 *     summary: Fund a virtual card
 *     tags: [VirtualCard]
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
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Card funded successfully
 */
router.post("/cards/:id/fund", protect, ctrl.fundCard);

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: Cancel a virtual card
 *     tags: [VirtualCard]
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
 *         description: Card cancelled successfully
 */
router.delete("/cards/:id", protect, ctrl.cancelCard);

module.exports = router;