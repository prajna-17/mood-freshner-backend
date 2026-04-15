const express = require("express");
const {
  getUserCoins,
  requestCoins,
  deductCoins,
} = require("../controllers/user.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// ── Coins ─────────────────────────────────────────────────────────────────────
router.get("/:userId/coins", getUserCoins); // fetch balance
router.post("/coins/request", requireAuth, requestCoins); // user submits purchase request
router.post("/coins/deduct", requireAuth, deductCoins); // deduct on checkout

module.exports = router;
