const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const { createResponse, ErrorResponse } = require("../utils/responseWrapper");
const calculateComboDiscount = require("../utils/comboCalculator");

const normalizePaymentMethod = (method, coinsUsed = 0) => {
  const paymentMethod = String(method || "ONLINE").toUpperCase();

  if (paymentMethod === "COINS" || paymentMethod === "COINS_ONLY") {
    return "COINS";
  }

  if (paymentMethod === "COINS_AND_COD" || paymentMethod === "MIXED_COD") {
    return "COINS_AND_COD";
  }

  if (
    paymentMethod === "COINS_AND_ONLINE" ||
    paymentMethod === "MIXED_ONLINE"
  ) {
    return "COINS_AND_ONLINE";
  }

  if (Number(coinsUsed) > 0) {
    return paymentMethod === "COD" ? "COINS_AND_COD" : "COINS_AND_ONLINE";
  }

  return paymentMethod === "COD" ? "COD" : "ONLINE";
};

const normalizePaymentStatus = (paymentMethod, paymentStatus) => {
  if (paymentStatus) return paymentStatus;
  return paymentMethod === "COINS" ? "SUCCESS" : "PENDING";
};

const applyCoinsToTotal = (totalAmount, coinsUsed = 0) => {
  const total = Number(totalAmount) || 0;
  const coins = Number(coinsUsed) || 0;
  return Math.max(total - coins, 0);
};

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      coinsUsed,
    } = req.body;

    const customerExists = await User.findById(customerId);
    if (!customerExists) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one product",
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const dbProduct = await Product.findById(item.product);

      if (!dbProduct) {
        return res.status(400).json({
          message: `Invalid product ID: ${item.product}`,
        });
      }

      if (!dbProduct.inStock) {
        return res.status(400).json({
          message: `${dbProduct.title} is currently unavailable`,
        });
      }

      const subtotal = dbProduct.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        images: dbProduct.images,
        category: dbProduct.category,
        price: dbProduct.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const newOrder = new Order({
      user: customerId,
      products: orderItems,
      shippingAddress,
      totalAmount: applyCoinsToTotal(totalAmount, coinsUsed),
      paymentMethod: normalizePaymentMethod(paymentMethod, coinsUsed),
      paymentStatus: normalizePaymentStatus(
        normalizePaymentMethod(paymentMethod, coinsUsed),
        paymentStatus,
      ),
      statusTimeline: [
        {
          status: "PLACED",
          date: new Date(),
        },
      ],
    });

    await newOrder.save();

    const savedOrder = await Order.findById(newOrder._id);

    res
      .status(201)
      .json(createResponse(201, savedOrder, "Order placed successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// CREATE PENDING ORDER (for ONLINE PAYMENT)
const createPendingOrder = async (req, res) => {
  console.log("REQ BODY 👉", req.body);
  console.log("AUTH USER 👉", req.user?._id);

  try {
    const {
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      coinsUsed,
    } = req.body;
    const customerId = req.user.userId;

    if (!products || products.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one product",
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const dbProduct = await Product.findById(item.product);

      if (!dbProduct) {
        return res.status(400).json({
          message: `Invalid product ID: ${item.product}`,
        });
      }

      const subtotal = dbProduct.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        images: dbProduct.images,
        category: dbProduct.category,
        price: dbProduct.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const merchantTransactionId = "TXN_" + Date.now();

    const newOrder = new Order({
      user: customerId,
      products: orderItems,
      shippingAddress,
      totalAmount: applyCoinsToTotal(totalAmount, coinsUsed),
      paymentMethod: normalizePaymentMethod(paymentMethod, coinsUsed),
      paymentStatus: normalizePaymentStatus(
        normalizePaymentMethod(paymentMethod, coinsUsed),
        paymentStatus,
      ),
      isCompleted: false,
      merchantTransactionId,
      statusTimeline: [
        {
          status: "PLACED",
          date: new Date(),
        },
      ],
    });

    await newOrder.save();

    res.status(201).json(
      createResponse(
        201,
        {
          orderId: newOrder._id,
          amount: applyCoinsToTotal(totalAmount, coinsUsed),
          merchantTransactionId,
        },
        "Pending order created",
      ),
    );
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// FETCH ALL ORDERS (Admin)
const fetchAllOrders = async (req, res) => {
  try {
    const allOrders = await Order.find({});
    return res
      .status(200)
      .json(createResponse(200, allOrders, "All orders fetched"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// FETCH ORDERS BY USER
const fetchUserAllOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userDetails = await User.findById(userId);

    if (!userDetails) {
      return res.status(400).json(ErrorResponse(400, "User is not valid"));
    }

    const allOrders = await Order.find({ user: userId }).sort({
      createdAt: -1,
    });

    return res
      .status(200)
      .json(createResponse(200, allOrders, "User orders fetched"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// FETCH ORDER DETAILS
const fetchOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const orderDetails = await Order.findById(orderId);

    if (!orderDetails) {
      return res.status(400).json(ErrorResponse(400, "Order not valid"));
    }

    return res
      .status(200)
      .json(createResponse(200, orderDetails, "Order details fetched"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// COMPLETE ORDER
// COMPLETE ORDER
const orderCompleted = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(400).json(ErrorResponse(400, "Order not valid"));
    }

    const newStatus = orderStatus || "DELIVERED";

    // Update main status
    order.orderStatus = newStatus;
    order.isCompleted = newStatus === "DELIVERED";

    // Push into timeline
    order.statusTimeline.push({
      status: newStatus,
      date: new Date(),
    });

    await order.save();

    return res
      .status(200)
      .json(createResponse(200, order, "Order status updated"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// CREATE COD ORDER
const createCODOrder = async (req, res) => {
  try {
    const {
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      coinsUsed,
    } = req.body;
    const customerId = req.user.userId;

    if (!products || products.length === 0) {
      return res
        .status(400)
        .json(ErrorResponse(400, "Order must contain at least one product"));
    }

    let orderItems = [];

    for (const item of products) {
      const dbProduct = await Product.findById(item.product);

      if (!dbProduct) {
        return res
          .status(400)
          .json(ErrorResponse(400, `Invalid product ID: ${item.product}`));
      }

      const subtotal = dbProduct.price * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        images: dbProduct.images,
        category: dbProduct.category,
        price: dbProduct.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    // Fetch product details for combo calculation
    const productDetails = await Product.find({
      _id: { $in: products.map((p) => p.product) },
    });

    const { finalTotal } = calculateComboDiscount(products, productDetails);

    const newOrder = new Order({
      user: customerId,
      products: orderItems,
      shippingAddress,
      totalAmount: applyCoinsToTotal(finalTotal, coinsUsed),
      paymentMethod: normalizePaymentMethod(paymentMethod, coinsUsed),
      paymentStatus: normalizePaymentStatus(
        normalizePaymentMethod(paymentMethod, coinsUsed),
        paymentStatus,
      ),
      orderStatus: "PLACED",
      isCompleted: normalizePaymentMethod(paymentMethod, coinsUsed) === "COINS",
      statusTimeline: [
        {
          status: "PLACED",
          date: new Date(),
        },
      ],
    });

    await newOrder.save();

    return res
      .status(201)
      .json(createResponse(201, { orderId: newOrder._id }, "COD order placed"));
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, error.message));
  }
};

// CANCEL ORDER (CUSTOMER)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "PLACED") {
      return res.status(400).json({ message: "Order cannot be cancelled now" });
    }

    order.orderStatus = "CANCELLED";
    order.isCompleted = false;

    if (
      order.paymentMethod === "ONLINE" ||
      order.paymentMethod === "COINS_AND_ONLINE"
    ) {
      order.paymentStatus = "FAILED";
    }
    order.statusTimeline.push({
      status: "CANCELLED",
      date: new Date(),
    });

    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// FETCH UNREAD ORDERS (ADMIN NOTIFICATIONS)
// FETCH ALL ORDERS FOR NOTIFICATIONS (READ + UNREAD)
const fetchAllNotifications = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({
      createdAt: -1,
    });

    return res
      .status(200)
      .json(createResponse(200, orders, "Notifications fetched"));
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, error.message));
  }
};

// MARK ORDER AS NOTIFIED
const markOrderAsNotified = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json(ErrorResponse(404, "Order not found"));
    }

    order.isNotified = true;
    await order.save();

    return res
      .status(200)
      .json(createResponse(200, order, "Order marked as notified"));
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, error.message));
  }
};

const PDFDocument = require("pdfkit");

// GENERATE INVOICE PDF (ADMIN)
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json(ErrorResponse(404, "Order not found"));
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`,
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    // Order Info
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    // Shipping
    doc.text("Shipping Address:");
    doc.text(order.shippingAddress.fullName);
    doc.text(order.shippingAddress.phone);
    doc.text(order.shippingAddress.addressLine);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);
    doc.text(order.shippingAddress.postalCode);
    doc.moveDown();

    // Products Table
    doc.text("Products:");
    doc.moveDown(0.5);

    order.products.forEach((p, index) => {
      doc.text(
        `${index + 1}. ${p.title} | Qty: ${p.quantity} | ₹${p.subtotal}`,
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, {
      align: "right",
    });

    doc.end();
  } catch (error) {
    return res.status(500).json(ErrorResponse(500, error.message));
  }
};

module.exports = {
  createOrder,
  createPendingOrder,
  fetchAllOrders,
  fetchOrderDetails,
  fetchUserAllOrders,
  orderCompleted,
  createCODOrder,
  cancelOrder,
  fetchAllNotifications,
  markOrderAsNotified,
  generateInvoice,
};
