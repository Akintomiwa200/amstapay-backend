const express = require("express");
const router = express.Router();
const beneficiaryController = require("../controllers/beneficiaryController");
const { authenticate } = require("../middleware/auth");

// Get all beneficiaries for the authenticated user
router.get("/", authenticate, beneficiaryController.listBeneficiaries);

// Add a new beneficiary
router.post("/", authenticate, beneficiaryController.addBeneficiary);

// Toggle favorite status
router.patch("/:id/favorite", authenticate, beneficiaryController.toggleFavorite);

// Delete a beneficiary
router.delete("/:id", authenticate, beneficiaryController.deleteBeneficiary);

module.exports = router;
