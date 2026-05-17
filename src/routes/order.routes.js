const express = require("express");

const {
  createOrder,
  createPendingOrder,
  createCODOrder,
  fetchAllOrders,
  fetchOrderDetails,
  fetchUserAllOrders,
  orderCompleted,
  cancelOrder,
  fetchAllNotifications,
  markOrderAsNotified,
  generateInvoice,
  updateOrderPayment,
} = require("../controllers/order.controller");

const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// ================= CUSTOMER ROUTES =================
router.post("/", createOrder);
router.post("/create-pending", requireAuth, createPendingOrder);
router.post("/create-cod", requireAuth, createCODOrder);
router.patch("/cancel/:orderId", requireAuth, cancelOrder);

router.get("/order-details/:orderId", fetchOrderDetails);

// ================= ADMIN ROUTES =================
router.get("/notifications", fetchAllNotifications);
router.patch("/mark-notified/:orderId", markOrderAsNotified);
router.get("/invoice/:orderId", generateInvoice);
router.patch("/payment/:orderId", updateOrderPayment);

router.get("/", fetchAllOrders);
router.patch("/:orderId", orderCompleted);

// ================= KEEP DYNAMIC ROUTE LAST =================
router.get("/:userId", fetchUserAllOrders);

module.exports = router;
