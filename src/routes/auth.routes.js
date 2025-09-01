const express = require("express");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePin,
} = require("../controllers/authController");

const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & User Management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - password
 *               - accountType
 *             properties:
 *               fullName: { type: string, example: John Doe }
 *               email: { type: string, example: johndoe@example.com }
 *               phoneNumber: { type: string, example: +2348012345678 }
 *               password: { type: string, example: Pass@123 }
 *               accountType: { type: string, enum: [personal, business, enterprise, company, agent] }
 *               dateOfBirth: { type: string, example: 01/01/1990 }
 *               gender: { type: string, example: Male }
 *               residentialAddress: { type: string, example: 123 Main St, Lagos }
 *               bvnOrNin: { type: string, example: 12345678901 }
 *               pin: { type: string, example: "1234", description: "4-digit transaction PIN" }
 *               businessName: { type: string, example: Doe Enterprises }
 *               businessAddress: { type: string, example: 456 Market St, Lagos }
 *               businessType: { type: string, example: Kiosk }
 *               bankName: { type: string, example: Zenith Bank }
 *               accountName: { type: string, example: John Doe }
 *               accountNumber: { type: string, example: 1234567890 }
 *               guarantorName: { type: string, example: Jane Smith }
 *               guarantorRelationship: { type: string, example: Sister }
 *               guarantorPhone: { type: string, example: +2348012345679 }
 *               guarantorAddress: { type: string, example: 789 Park Ave, Lagos }
 *               termsAgreed: { type: boolean, example: true }
 *               infoAccurate: { type: boolean, example: true }
 *               verificationConsent: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Signup successful, email verification sent
 *       400:
 *         description: Email or phone already in use
 */
router.post("/signup", signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email/phone & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *               - password
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: Pass@123
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       403:
 *         description: Email not verified
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login);
/**
 * @swagger
 * /auth/change-pin:
 *   post:
 *     summary: Change transaction PIN
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPin
 *               - newPin
 *             properties:
 *               currentPin:
 *                 type: string
 *                 example: "1234"
 *               newPin:
 *                 type: string
 *                 example: "5678"
 *     responses:
 *       200:
 *         description: PIN changed successfully
 *       400:
 *         description: Current PIN is incorrect
 */
router.post("/change-pin", authMiddleware, changePin);

/**
 * @swagger
 * /auth/upload-documents:
 *   post:
 *     summary: Upload documents for agent verification
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               idDocument: { type: string, format: binary }
 *               utilityBill: { type: string, format: binary }
 *               passportPhoto: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Invalid request
 */
router.post("/upload-documents", upload.fields([
  { name: "idDocument", maxCount: 1 },
  { name: "utilityBill", maxCount: 1 },
  { name: "passportPhoto", maxCount: 1 },
]), async (req, res) => {
  try {
    res.status(200).json({ message: "Documents uploaded successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify a user's email with a 6-digit code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit verification code sent via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 */
router.post("/verify", verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset via email or phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Reset instructions sent if user exists
 *       400:
 *         description: Missing email or phone
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using the code sent via email or phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrPhone
 *               - code
 *               - newPassword
 *             properties:
 *               emailOrPhone:
 *                 type: string
 *                 example: johndoe@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit reset code
 *               newPassword:
 *                 type: string
 *                 example: NewPass@123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid code or expired
 *       404:
 *         description: User not found
 */
router.post("/reset-password", resetPassword);

module.exports = router;
