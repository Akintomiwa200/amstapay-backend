const express = require("express");
const router = express.Router();
const ussdController = require("../controllers/ussdController");

/**
 * @swagger
 * tags:
 *   name: USSD
 *   description: USSD code session handling for feature phone users
 */

/**
 * @swagger
 * /ussd:
 *   post:
 *     summary: Handle USSD session requests
 *     tags: [USSD]
 *     security: []
 *     description: |
 *       Main USSD endpoint for handling feature phone banking sessions.
 *       This endpoint accepts USSD session data including phone number,
 *       session ID, and user input, then returns appropriate USSD menu response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - sessionId
 *               - text
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               sessionId:
 *                 type: string
 *                 example: "SESS_ABC123XYZ"
 *               text:
 *                 type: string
 *                 description: USSD input text (menu selection or empty for first menu)
 *                 example: "1"
 *               networkCode:
 *                 type: string
 *                 example: "MTN"
 *     responses:
 *       200:
 *         description: USSD response text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: USSD response text shown to user
 *                 sessionActive:
 *                   type: boolean
 *                   description: Whether the USSD session is still active
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Suggested next actions for the client
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.post("/", ussdController.handleUSSD);

module.exports = router;
