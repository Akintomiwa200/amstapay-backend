const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/cableController");

router.post("/cable", protect, ctrl.buyCable);
router.post("/cable/verify", protect, ctrl.verifyCableCustomer);
router.get("/cable/plans", protect, ctrl.getCablePlans);

module.exports = router;
