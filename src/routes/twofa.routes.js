const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/twoFAController");

router.post("/2fa/setup", protect, ctrl.setup2FA);
router.post("/2fa/verify", protect, ctrl.verifyAndEnable2FA);
router.post("/2fa/disable", protect, ctrl.disable2FA);
router.get("/2fa/status", protect, ctrl.get2FAStatus);

module.exports = router;
