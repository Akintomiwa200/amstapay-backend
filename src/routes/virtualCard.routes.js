const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/virtualCardController");

router.post("/cards", protect, ctrl.createCard);
router.get("/cards", protect, ctrl.listCards);
router.get("/cards/:id", protect, ctrl.getCard);
router.patch("/cards/:id/freeze", protect, ctrl.freezeCard);
router.post("/cards/:id/fund", protect, ctrl.fundCard);
router.delete("/cards/:id", protect, ctrl.cancelCard);

module.exports = router;
