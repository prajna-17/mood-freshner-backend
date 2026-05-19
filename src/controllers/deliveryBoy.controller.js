const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DeliveryBoy = require("../models/deliveryBoy.model");
const Order = require("../models/order.model");
const Notification = require("../models/notification.model");

// ── Register (public) ─────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, mobile, email, password, vehicleType } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, mobile and password are required",
      });
    }

    const exists = await DeliveryBoy.findOne({ mobile });
    if (exists) {
      return res.status(400).json({
        status: "error",
        message: "Mobile number already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const deliveryBoy = await DeliveryBoy.create({
      name,
      mobile,
      email: email || "",
      password: hashed,
      vehicleType: vehicleType || "BIKE",
    });

    // Notify admin
    await Notification.create({
      title: "New Delivery Boy Registration",
      message: `${name} (${mobile}) has registered as a delivery boy. Please review and approve.`,
    });

    return res.status(201).json({
      status: "success",
      message: "Registration submitted. Awaiting admin approval.",
      data: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        mobile: deliveryBoy.mobile,
        approvalStatus: deliveryBoy.approvalStatus,
      },
    });
  } catch (error) {
    console.error("DELIVERY REGISTER ERROR:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        status: "error",
        message: "Mobile and password are required",
      });
    }

    const deliveryBoy = await DeliveryBoy.findOne({ mobile });
    if (!deliveryBoy) {
      return res.status(404).json({ status: "error", message: "No account found with this mobile number" });
    }

    if (deliveryBoy.approvalStatus === "PENDING") {
      return res.status(403).json({
        status: "error",
        message: "Your account is pending admin approval. Please check back later.",
        approvalStatus: "PENDING",
      });
    }

    if (deliveryBoy.approvalStatus === "REJECTED") {
      return res.status(403).json({
        status: "error",
        message: "Your registration has been rejected. Please contact support.",
        approvalStatus: "REJECTED",
      });
    }

    const match = await bcrypt.compare(password, deliveryBoy.password);
    if (!match) {
      return res.status(400).json({ status: "error", message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: deliveryBoy._id, role: "DELIVERY_BOY" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      role: "DELIVERY_BOY",
      _id: deliveryBoy._id,
      name: deliveryBoy.name,
      mobile: deliveryBoy.mobile,
      vehicleType: deliveryBoy.vehicleType,
    });
  } catch (error) {
    console.error("DELIVERY LOGIN ERROR:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ── Get Own Profile ───────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.user.userId).select("-password");
    if (!deliveryBoy) {
      return res.status(404).json({ status: "error", message: "Not found" });
    }
    return res.status(200).json({ status: "success", data: deliveryBoy });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ── Get Assigned Orders ───────────────────────────────────────────────────────
const getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ assignedTo: req.user.userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: "success", data: orders });
  } catch (error) {
    console.error("GET ASSIGNED ORDERS ERROR:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ── Update Delivery Status ────────────────────────────────────────────────────
const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    const validStatuses = ["PICKED", "IN_TRANSIT", "DELIVERED"];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({ status: "error", message: "Invalid delivery status" });
    }

    const order = await Order.findOne({ _id: orderId, assignedTo: req.user.userId });
    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found or not assigned to you" });
    }

    order.deliveryStatus = deliveryStatus;
    order.deliveryStatusTimeline.push({ status: deliveryStatus, timestamp: new Date() });

    // Sync orderStatus when delivered
    if (deliveryStatus === "DELIVERED") {
      order.orderStatus = "DELIVERED";
      order.statusTimeline.push({ status: "DELIVERED", date: new Date() });
      order.isCompleted = true;
    }

    await order.save();

    return res.status(200).json({
      status: "success",
      message: `Order marked as ${deliveryStatus}`,
      data: { deliveryStatus: order.deliveryStatus, orderStatus: order.orderStatus },
    });
  } catch (error) {
    console.error("UPDATE DELIVERY STATUS ERROR:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ── Update Collection Status ──────────────────────────────────────────────────
const updateCollectionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { collectionStatus, collectionNotes } = req.body;

    const validStatuses = ["PAID", "NOT_PAID"];
    if (!validStatuses.includes(collectionStatus)) {
      return res.status(400).json({ status: "error", message: "Invalid collection status" });
    }

    const order = await Order.findOne({ _id: orderId, assignedTo: req.user.userId });
    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found or not assigned to you" });
    }

    if (order.deliveryStatus !== "DELIVERED") {
      return res.status(400).json({ status: "error", message: "Can only collect payment after delivery" });
    }

    order.collectionStatus = collectionStatus;
    if (collectionNotes) order.collectionNotes = collectionNotes;

    // If COD and marked PAID, update paymentStatus
    if (collectionStatus === "PAID" && order.paymentMethod === "COD") {
      order.paymentStatus = "PAID";
    }

    await order.save();

    return res.status(200).json({
      status: "success",
      message: `Payment marked as ${collectionStatus}`,
      data: { collectionStatus: order.collectionStatus },
    });
  } catch (error) {
    console.error("UPDATE COLLECTION STATUS ERROR:", error);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAssignedOrders,
  updateDeliveryStatus,
  updateCollectionStatus,
};
