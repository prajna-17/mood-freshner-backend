const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    vehicleType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "CYCLE", "OTHER"],
      default: "BIKE",
    },

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);
