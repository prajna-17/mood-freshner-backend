const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "CUSTOMER"],
      default: "CUSTOMER",
    },

    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── Coins System ──────────────────────────────────────────────────────────
    coins: {
      type: Number,
      default: 0,
    },

    // Pending coin requests (admin needs to approve)
    coinRequests: [
      {
        amount: { type: Number, required: true }, // coins requested (= ₹ paid)
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING",
        },
        requestedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
