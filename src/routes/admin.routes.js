const express = require("express");
const {
  createAdmin,
  getAllUsers,
  addCoinsToUser,
  approveCoinRequest,
  rejectCoinRequest,
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

module.exports = router;
