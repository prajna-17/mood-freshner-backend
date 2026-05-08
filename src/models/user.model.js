const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
			trim: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},
		addressLine: {
			type: String,
			required: true,
			trim: true,
		},
		landmark: {
			type: String,
			default: "",
			trim: true,
		},
		city: {
			type: String,
			required: true,
			trim: true,
		},
		state: {
			type: String,
			required: true,
			trim: true,
		},
		postalCode: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{ _id: false },
);

const userSchema = new mongoose.Schema(
	{
		name: String,

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
		address: addressSchema,
	},
	{ timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
