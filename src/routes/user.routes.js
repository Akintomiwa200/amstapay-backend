// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth"); // <-- import protect


// ==============================
// Swagger Tag: Users
// ==============================
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Manage user accounts and profiles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1c2b6d4b7e8a9c0e1a123"
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: johndoe@example.com
 *         phone:
 *           type: string
 *           example: "+2348012345678"
 *         role:
 *           type: string
 *           example: customer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-27T12:34:56.789Z"
 *
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           example: janedoe@example.com
 *         phone:
 *           type: string
 *           example: "+2348098765432"
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *
 *     ChangePasswordInput:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           example: OldPass123
 *         newPassword:
 *           type: string
 *           example: NewPass456
 */

// --------------------
// Get current user profile
// --------------------
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", protect, userController.getProfile);

// --------------------
// Update user profile
// --------------------
/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: User profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put("/me", protect, userController.updateProfile);

// --------------------
// Change password
// --------------------
/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", protect, userController.changePassword);

// --------------------
// Delete user account
// --------------------
/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete", protect, userController.deleteAccount);

// --------------------
// (Optional) Get all users (admin only)
// --------------------
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 */
router.get("/", protect, userController.getAllUsers);

module.exports = router;
