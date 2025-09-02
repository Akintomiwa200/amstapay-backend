// routes/user.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth"); // <-- import protect
const upload = require("../middleware/upload"); 
 

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
 *           example: "68b6e4fea9ebb1a219eea186"
 *         fullName:
 *           type: string
 *           example: "Akintomiwa"
 *         email:
 *           type: string
 *           example: "herkintormiwer@gmail.com"
 *         phoneNumber:
 *           type: string
 *           example: "08145328795"
 *         pin:
 *           type: string
 *           description: "Hashed PIN (not returned in responses)"
 *           example: "$2b$10$7YEAK63uDC9tDGrmCOKu0uyv9CTuHg578b/1ZzHyCoMqx2DI0wNWG"
 *         password:
 *           type: string
 *           description: "Hashed password (not returned in responses)"
 *           example: "$2b$10$080gGn0Ot.Qh8SQZ3oICAe43ytMrTG546Wo12NrtWChag6/bmQJei"
 *         accountType:
 *           type: string
 *           enum: [personal, business]
 *           example: "personal"
 *         verificationCode:
 *           type: string
 *           nullable: true
 *           example: null
 *         codeExpires:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isOtpVerified:
 *           type: boolean
 *           example: false
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           example: "1996-09-02T12:36:00.000Z"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           example: "Male"
 *         residentialAddress:
 *           type: string
 *           example: "Jod"
 *         bankName:
 *           type: string
 *           example: "Polaris Bank"
 *         accountName:
 *           type: string
 *           example: "Adedokun Peter Akintomiwa"
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         businessName:
 *           type: string
 *           example: ""
 *         businessAddress:
 *           type: string
 *           example: ""
 *         businessType:
 *           type: string
 *           example: ""
 *         guarantorName:
 *           type: string
 *           example: ""
 *         guarantorRelationship:
 *           type: string
 *           example: ""
 *         guarantorPhone:
 *           type: string
 *           example: ""
 *         guarantorAddress:
 *           type: string
 *           example: ""
 *         idDocument:
 *           type: string
 *           nullable: true
 *           example: null
 *         utilityBill:
 *           type: string
 *           nullable: true
 *           example: null
 *         passportPhoto:
 *           type: string
 *           nullable: true
 *           example: null
 *         termsAgreed:
 *           type: boolean
 *           example: true
 *         infoAccurate:
 *           type: boolean
 *           example: true
 *         verificationConsent:
 *           type: boolean
 *           example: true
 *         kycLevel:
 *           type: integer
 *           example: 0
 *         verifications:
 *           type: array
 *           items:
 *             type: object
 *           example: []
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-02T12:37:18.122Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-02T13:34:02.055Z"
 *         amstapayAccountNumber:
 *           type: string
 *           example: "8145328795"
 *         __v:
 *           type: integer
 *           example: 0
 *
 *     UserUpdateInput:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           example: "janedoe@example.com"
 *         phoneNumber:
 *           type: string
 *           example: "08098765432"
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "1990-05-15"
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           example: "Female"
 *         residentialAddress:
 *           type: string
 *           example: "123 Main Street, Lagos"
 *         bankName:
 *           type: string
 *           example: "GTBank"
 *         accountName:
 *           type: string
 *           example: "Jane Doe"
 *         accountNumber:
 *           type: string
 *           example: "0123456789"
 *         businessName:
 *           type: string
 *           example: "Jane's Business"
 *         businessAddress:
 *           type: string
 *           example: "456 Business Ave, Abuja"
 *         businessType:
 *           type: string
 *           example: "Retail"
 *         guarantorName:
 *           type: string
 *           example: "John Smith"
 *         guarantorRelationship:
 *           type: string
 *           example: "Brother"
 *         guarantorPhone:
 *           type: string
 *           example: "08123456789"
 *         guarantorAddress:
 *           type: string
 *           example: "789 Guarantor Street"
 *
 *     ChangePasswordInput:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           example: "OldPass123"
 *         newPassword:
 *           type: string
 *           example: "NewPass456"
 *
 *     ChangePinInput:
 *       type: object
 *       required:
 *         - currentPin
 *         - newPin
 *       properties:
 *         currentPin:
 *           type: string
 *           example: "1234"
 *         newPin:
 *           type: string
 *           example: "5678"
 *
 *     KYCDocumentUpload:
 *       type: object
 *       properties:
 *         idDocument:
 *           type: string
 *           format: binary
 *           description: "ID document (Driver's License, National ID, etc.)"
 *         utilityBill:
 *           type: string
 *           format: binary
 *           description: "Utility bill for address verification"
 *         passportPhoto:
 *           type: string
 *           format: binary
 *           description: "Passport photograph"
 *
 *     UserProfile:
 *       type: object
 *       description: "User profile without sensitive fields"
 *       properties:
 *         _id:
 *           type: string
 *           example: "68b6e4fea9ebb1a219eea186"
 *         fullName:
 *           type: string
 *           example: "Akintomiwa"
 *         email:
 *           type: string
 *           example: "herkintormiwer@gmail.com"
 *         phoneNumber:
 *           type: string
 *           example: "08145328795"
 *         accountType:
 *           type: string
 *           example: "personal"
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isOtpVerified:
 *           type: boolean
 *           example: false
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           example: "1996-09-02T12:36:00.000Z"
 *         gender:
 *           type: string
 *           example: "Male"
 *         residentialAddress:
 *           type: string
 *           example: "Jod"
 *         bankName:
 *           type: string
 *           example: "Polaris Bank"
 *         accountName:
 *           type: string
 *           example: "Adedokun Peter Akintomiwa"
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         businessName:
 *           type: string
 *           example: ""
 *         businessAddress:
 *           type: string
 *           example: ""
 *         businessType:
 *           type: string
 *           example: ""
 *         guarantorName:
 *           type: string
 *           example: ""
 *         guarantorRelationship:
 *           type: string
 *           example: ""
 *         guarantorPhone:
 *           type: string
 *           example: ""
 *         guarantorAddress:
 *           type: string
 *           example: ""
 *         termsAgreed:
 *           type: boolean
 *           example: true
 *         infoAccurate:
 *           type: boolean
 *           example: true
 *         verificationConsent:
 *           type: boolean
 *           example: true
 *         kycLevel:
 *           type: integer
 *           example: 0
 *         verifications:
 *           type: array
 *           items:
 *             type: object
 *           example: []
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-02T12:37:18.122Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-02T13:34:02.055Z"
 *         amstapayAccountNumber:
 *           type: string
 *           example: "8145328795"
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
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. No token provided."
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
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input data"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put("/me", protect, userController.updateProfile);

// --------------------
// Change password
// --------------------
/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change user password
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Invalid current password or weak new password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", protect, userController.changePassword);

// --------------------
// Change PIN
// --------------------
/**
 * @swagger
 * /users/change-pin:
 *   post:
 *     summary: Change user PIN
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePinInput'
 *     responses:
 *       200:
 *         description: PIN changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "PIN changed successfully"
 *       400:
 *         description: Invalid current PIN or invalid new PIN format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Current PIN is incorrect"
 *       401:
 *         description: Unauthorized
 */
router.post("/change-pin", protect, userController.changePin);

// --------------------
// Upload Avatar
// --------------------
/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Upload user profile image/avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload (max 5MB, jpg/jpeg/png only)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       example: "/uploads/avatars/68b6e4fea9ebb1a219eea186_1696115200000.jpg"
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: No file uploaded or invalid file format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Please upload a valid image file (jpg, jpeg, png)"
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error during file upload
 */
router.post("/avatar", protect, upload.single("avatar"), userController.uploadAvatar);

// --------------------
// Upload KYC Documents
// --------------------
/**
 * @swagger
 * /users/kyc-documents:
 *   post:
 *     summary: Upload KYC documents (ID, utility bill, passport photo)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/KYCDocumentUpload'
 *     responses:
 *       200:
 *         description: KYC documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "KYC documents uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     idDocument:
 *                       type: string
 *                       example: "/uploads/kyc/id/68b6e4fea9ebb1a219eea186_id.jpg"
 *                     utilityBill:
 *                       type: string
 *                       example: "/uploads/kyc/utility/68b6e4fea9ebb1a219eea186_utility.jpg"
 *                     passportPhoto:
 *                       type: string
 *                       example: "/uploads/kyc/passport/68b6e4fea9ebb1a219eea186_passport.jpg"
 *                     kycLevel:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Invalid file format or missing required documents
 *       401:
 *         description: Unauthorized
 */
router.post("/kyc-documents", protect, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'utilityBill', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 }
]), userController.uploadKYCDocuments);

// --------------------
// Delete user account
// --------------------
/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete user account (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "No longer need the service"
 *               feedback:
 *                 type: string
 *                 example: "Great service but switching to another provider"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete("/delete", protect, userController.deleteAccount);

// --------------------
// Get all users (Admin only)
// --------------------
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination and filtering (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone number
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: [personal, business]
 *         description: Filter by account type
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: kycLevel
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 3
 *         description: Filter by KYC level
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserProfile'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalUsers:
 *                           type: integer
 *                           example: 47
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. Admin privileges required."
 */
router.get("/", protect, userController.getAllUsers);

// --------------------
// Get user by ID (Admin only)
// --------------------
/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "68b6e4fea9ebb1a219eea186"
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.get("/:userId", protect, userController.getUserById);

module.exports = router;