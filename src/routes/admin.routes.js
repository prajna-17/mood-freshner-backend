const express = require("express");
const {
  createAdmin,
  getAllUsers,
  addCoinsToUser,
  approveCoinRequest,
  rejectCoinRequest,
  getAllDeliveryBoys,
  approveDeliveryBoy,
  rejectDeliveryBoy,
  toggleDeliveryBoyActive,
  assignOrderToDeliveryBoy,
  getDeliveryBoyOrders,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// ── Existing ──────────────────────────────────────────────────────────────────
// Only ADMIN can create another ADMIN
router.post("/create", requireAuth, requireAdmin, createAdmin);

// ── Coins Management (Admin only) ─────────────────────────────────────────────
router.get("/users", requireAuth, requireAdmin, getAllUsers);
router.patch(
  "/users/:userId/add-coins",
  requireAuth,
  requireAdmin,
  addCoinsToUser,
);
router.patch(
  "/users/:userId/coin-requests/:requestId/approve",
  requireAuth,
  requireAdmin,
  approveCoinRequest,
);
router.patch(
  "/users/:userId/coin-requests/:requestId/reject",
  requireAuth,
  requireAdmin,
  rejectCoinRequest,
);

// ── Delivery Boy Management ───────────────────────────────────────────────────
router.get("/delivery-boys", requireAuth, requireAdmin, getAllDeliveryBoys);
router.patch("/delivery-boys/:id/approve", requireAuth, requireAdmin, approveDeliveryBoy);
router.patch("/delivery-boys/:id/reject", requireAuth, requireAdmin, rejectDeliveryBoy);
router.patch("/delivery-boys/:id/toggle-active", requireAuth, requireAdmin, toggleDeliveryBoyActive);

router.post("/orders/:orderId/assign", requireAuth, requireAdmin, assignOrderToDeliveryBoy);
router.get("/delivery-boys/:id/orders", requireAuth, requireAdmin, getDeliveryBoyOrders);

module.exports = router;
