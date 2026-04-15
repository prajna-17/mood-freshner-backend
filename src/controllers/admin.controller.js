const User = require("../models/user.model");

// ── Create Admin ──────────────────────────────────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found. Ask user to login once.",
      });
    }

    if (user.role === "ADMIN") {
      return res
        .status(400)
        .json({ status: "error", message: "User is already an admin" });
    }

    user.role = "ADMIN";
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Admin created successfully",
      adminId: user._id,
    });
  } catch (error) {
    console.error("CREATE ADMIN ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

// ── Get All Users (for coins management) ─────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email coins coinRequests createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: "success", data: users });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Add Coins to User (Admin manually credits coins) ─────────────────────────
const addCoinsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Valid amount required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    user.coins = (user.coins || 0) + Number(amount);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: `${amount} coins added to ${user.name || user.email}`,
      data: { coins: user.coins, userId: user._id },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Approve a Pending Coin Request ────────────────────────────────────────────
const approveCoinRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.params;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    const request = user.coinRequests.id(requestId);
    if (!request)
      return res
        .status(404)
        .json({ status: "error", message: "Request not found" });

    if (request.status !== "PENDING") {
      return res
        .status(400)
        .json({ status: "error", message: "Request already resolved" });
    }

    // Credit coins
    user.coins = (user.coins || 0) + request.amount;
    request.status = "APPROVED";
    request.resolvedAt = new Date();
    await user.save();

    return res.status(200).json({
      status: "success",
      message: `Approved — ${request.amount} coins credited`,
      data: { coins: user.coins },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Reject a Pending Coin Request ─────────────────────────────────────────────
const rejectCoinRequest = async (req, res) => {
  try {
    const { userId, requestId } = req.params;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    const request = user.coinRequests.id(requestId);
    if (!request)
      return res
        .status(404)
        .json({ status: "error", message: "Request not found" });

    if (request.status !== "PENDING") {
      return res
        .status(400)
        .json({ status: "error", message: "Request already resolved" });
    }

    request.status = "REJECTED";
    request.resolvedAt = new Date();
    await user.save();

    return res
      .status(200)
      .json({ status: "success", message: "Request rejected" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  createAdmin,
  getAllUsers,
  addCoinsToUser,
  approveCoinRequest,
  rejectCoinRequest,
};
