const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/bulkController");

router.post("/bulk/disburse", protect, ctrl.bulkDisburse);
router.post("/bulk/payroll", protect, ctrl.paySalary);

module.exports = router;
