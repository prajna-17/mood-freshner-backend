const express = require("express");
const {
  register,
  login,
  getProfile,
  getAssignedOrders,
  updateDeliveryStatus,
  updateCollectionStatus,
} = require("../controllers/deliveryBoy.controller");
const { requireDeliveryAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected Delivery Boy Routes ─────────────────────────────────────────────
router.get("/me", requireDeliveryAuth, getProfile);
router.get("/my-orders", requireDeliveryAuth, getAssignedOrders);
router.patch("/orders/:orderId/delivery-status", requireDeliveryAuth, updateDeliveryStatus);
router.patch("/orders/:orderId/collection-status", requireDeliveryAuth, updateCollectionStatus);

module.exports = router;
