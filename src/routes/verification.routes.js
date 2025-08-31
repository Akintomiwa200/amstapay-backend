// routes/verification.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  verifyBVN,
  verifyNIN,
  verifyBankAccount,
} = require("../controllers/verificationController");

router.post("/bvn", protect, verifyBVN);
router.post("/nin", protect, verifyNIN);
router.post("/bank", protect, verifyBankAccount);

module.exports = router;
