const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/recurringController");

router.post("/recurring", protect, ctrl.createRecurring);
router.get("/recurring", protect, ctrl.listRecurring);
router.get("/recurring/:id", protect, ctrl.getRecurring);
router.patch("/recurring/:id/toggle", protect, ctrl.pauseRecurring);
router.delete("/recurring/:id", protect, ctrl.cancelRecurring);

module.exports = router;
