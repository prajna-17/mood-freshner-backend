const User = require("../models/user.model");

// ── Get User Coin Balance ─────────────────────────────────────────────────────
const getUserCoins = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "coins coinRequests name email",
    );
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    return res
      .status(200)
      .json({ status: "success", data: { coins: user.coins || 0 } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Submit Coin Purchase Request (user pays, request goes to admin) ───────────
const requestCoins = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid amount required" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    user.coinRequests.push({ amount: Number(amount), status: "PENDING" });
    await user.save();

    const newRequest = user.coinRequests[user.coinRequests.length - 1];

    return res.status(201).json({
      status: "success",
      message: "Coin request submitted. Admin will approve shortly.",
      data: { requestId: newRequest._id, amount: newRequest.amount },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Deduct Coins (called during checkout when coins are used) ─────────────────
const deductCoins = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid amount required" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    if ((user.coins || 0) < amount) {
      return res
        .status(400)
        .json({ status: "error", message: "Insufficient coins" });
    }

    user.coins -= Number(amount);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: `${amount} coins deducted`,
      data: { remainingCoins: user.coins },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { getUserCoins, requestCoins, deductCoins };
