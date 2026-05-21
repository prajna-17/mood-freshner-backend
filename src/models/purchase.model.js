const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false, // Made optional for custom items/supplies
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"],
      default: "CASH",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    products: {
      type: [purchaseItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "PARTIAL"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);

