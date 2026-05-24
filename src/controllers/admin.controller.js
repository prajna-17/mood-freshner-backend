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

// ── Create User ───────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, role, coins, isVerified } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res
        .status(400)
        .json({ status: "error", message: "User already exists" });
    }

    const user = await User.create({
      name: name?.trim() || "",
      email: normalizedEmail,
      role: role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      coins: Number(coins) || 0,
      isVerified: Boolean(isVerified),
    });

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Get All Users (for coins management) ─────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role isVerified coins coinRequests address createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: "success", data: users });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Delete User ───────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.userId === userId) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete your own admin account",
      });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      data: { userId },
    });
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

const DeliveryBoy = require("../models/deliveryBoy.model");
const Order = require("../models/order.model");

// ── Get All Delivery Boys ──────────────────────────────────────────────────────
const getAllDeliveryBoys = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.approvalStatus = status.toUpperCase();

    const boys = await DeliveryBoy.find(filter).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ status: "success", data: boys });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Approve Delivery Boy ───────────────────────────────────────────────────────
const approveDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const boy = await DeliveryBoy.findById(id);
    if (!boy) return res.status(404).json({ status: "error", message: "Delivery boy not found" });

    boy.approvalStatus = "APPROVED";
    await boy.save();

    return res.status(200).json({ status: "success", message: "Delivery boy approved" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Reject Delivery Boy ────────────────────────────────────────────────────────
const rejectDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const boy = await DeliveryBoy.findById(id);
    if (!boy) return res.status(404).json({ status: "error", message: "Delivery boy not found" });

    boy.approvalStatus = "REJECTED";
    await boy.save();

    return res.status(200).json({ status: "success", message: "Delivery boy rejected" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Toggle Active Status ───────────────────────────────────────────────────────
const toggleDeliveryBoyActive = async (req, res) => {
  try {
    const { id } = req.params;
    const boy = await DeliveryBoy.findById(id);
    if (!boy) return res.status(404).json({ status: "error", message: "Delivery boy not found" });

    boy.isActive = !boy.isActive;
    await boy.save();

    return res.status(200).json({
      status: "success",
      message: `Delivery boy ${boy.isActive ? "activated" : "deactivated"}`,
      data: { isActive: boy.isActive },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Assign Order to Delivery Boy ──────────────────────────────────────────────
const assignOrderToDeliveryBoy = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    const boy = await DeliveryBoy.findById(deliveryBoyId);
    if (!boy) return res.status(404).json({ status: "error", message: "Delivery boy not found" });
    if (boy.approvalStatus !== "APPROVED") {
      return res.status(400).json({ status: "error", message: "Delivery boy not approved" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: "error", message: "Order not found" });

    order.assignedTo = deliveryBoyId;
    order.deliveryStatus = "UNASSIGNED";
    await order.save();

    return res.status(200).json({
      status: "success",
      message: `Order assigned to ${boy.name}`,
      data: { orderId, deliveryBoyId, deliveryBoyName: boy.name },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── Get Orders of a Delivery Boy ──────────────────────────────────────────────
const getDeliveryBoyOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ assignedTo: id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ status: "success", data: orders });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  createAdmin,
  createUser,
  getAllUsers,
  deleteUser,
  addCoinsToUser,
  approveCoinRequest,
  rejectCoinRequest,
  getAllDeliveryBoys,
  approveDeliveryBoy,
  rejectDeliveryBoy,
  toggleDeliveryBoyActive,
  assignOrderToDeliveryBoy,
  getDeliveryBoyOrders,
};
