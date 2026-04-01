const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const connectDB = require("./src/config/db");
const { uploadRouter } = require("./uploadthing");
const { createRouteHandler } = require("uploadthing/express");
const adminRoutes = require("./src/routes/admin.routes");
// const razorpayRoutes = require("./src/routes/razorpay.routes");

// middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
  }),
);

// 🔥 Manually handle preflight (Node 22 safe)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
  }),
);

// 🔥 Explicitly handle preflight requests

app.use(express.json());

// connect db
connectDB();

// routes
app.get("/", (req, res) => {
  res.send("Lebah Backend Running 🚀");
});

const authRoutes = require("./src/routes/auth.routes");
const productRoutes = require("./src/routes/product.routes");
const categoryRoutes = require("./src/routes/category.routes");
const orderRoutes = require("./src/routes/order.routes");
// const paymentRoutes = require("./src/routes/payment.routes");
const superCategoryRoutes = require("./src/routes/superCategory.routes");
const subCategoryRoutes = require("./src/routes/subCategory.routes");
const notificationRoutes = require("./src/routes/notification.routes");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/payment", paymentRoutes);
app.use("/api/super-categories", superCategoryRoutes);
app.use("/api/sub-categories", subCategoryRoutes);
// app.use("/api/razorpay", razorpayRoutes);
app.use("/api/notifications", notificationRoutes);
// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
