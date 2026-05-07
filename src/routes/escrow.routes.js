const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/escrowController");

router.post("/escrow", protect, ctrl.createEscrow);
router.get("/escrow", protect, ctrl.listEscrows);
router.get("/escrow/:id", protect, ctrl.getEscrow);
router.post("/escrow/:id/release", protect, ctrl.releaseEscrow);
router.post("/escrow/:id/dispute", protect, ctrl.disputeEscrow);
router.post("/escrow/:id/refund", protect, ctrl.refundEscrow);

module.exports = router;
