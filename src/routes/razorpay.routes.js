// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");

// const router = express.Router();

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Create Order
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount } = req.body;

//     const options = {
//       amount: amount * 100, // amount in paise
//       currency: "INR",
//       receipt: "receipt_" + Date.now(),
//     };

//     const order = await razorpay.orders.create(options);

//     res.json({
//       success: true,
//       order,
//     });
//   } catch (error) {
//     console.error("Razorpay Order Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Order creation failed",
//     });
//   }
// });

// router.post("/verify-payment", async (req, res) => {
//   try {
//     const crypto = require("crypto");
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderId,
//     } = req.body;

//     const generated_signature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(razorpay_order_id + "|" + razorpay_payment_id)
//       .digest("hex");

//     if (generated_signature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     // 🔥 NEW: Fetch payment details from Razorpay
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);
//     console.log("🔥 Payment status from Razorpay:", payment.status);

//     if (payment.status !== "captured") {
//       return res.status(400).json({
//         success: false,
//         message: "Payment not completed",
//       });
//     }

//     const Order = require("../models/order.model");

//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     order.paymentStatus = "PAID";
//     order.isCompleted = false;

//     await order.save();

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// module.exports = router;
