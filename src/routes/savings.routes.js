const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/savingsController");

router.post("/goals", protect, ctrl.createGoal);
router.get("/goals", protect, ctrl.listGoals);
router.get("/goals/:id", protect, ctrl.getGoal);
router.post("/goals/:id/deposit", protect, ctrl.depositToGoal);
router.post("/goals/:id/withdraw", protect, ctrl.withdrawFromGoal);
router.delete("/goals/:id", protect, ctrl.cancelGoal);

module.exports = router;
