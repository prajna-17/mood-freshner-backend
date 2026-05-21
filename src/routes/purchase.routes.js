const express = require("express");
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  addPayment,
  deletePayment,
  deletePurchase,
} = require("../controllers/purchase.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// All purchase operations require authentication and admin privileges
router.use(requireAuth, requireAdmin);

router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.post("/", createPurchase);
router.post("/:id/payments", addPayment);
router.delete("/:id/payments/:paymentId", deletePayment);
router.delete("/:id", deletePurchase);

module.exports = router;
