// controllers/notification.controller.js

const Notification = require("../models/notification.model");

// GET notifications
// If userId exists -> fetch personal + global notifications
const getNotifications = async (req, res) => {
	try {
		const { userId } = req.query;

		const validUserId = (!userId || userId === "" || userId === "null" || userId === "undefined") ? null : userId;

		let filter = { userId: null }; // default to only global notifications

		if (validUserId) {
			filter = {
				$or: [{ userId: validUserId }, { userId: null }],
			};
		}

		const notifications = await Notification.find(filter).sort({
			createdAt: -1,
		});

		res.status(200).json({
			success: true,
			data: notifications,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST create notification
// Works for both global and single user
const createNotification = async (req, res) => {
	try {
		const { userId, title, message } = req.body;

		if (!title || !message) {
			return res.status(400).json({
				success: false,
				message: "Title and message are required",
			});
		}

		const finalUserId = (!userId || userId === "" || userId === "null" || userId === "undefined") ? null : userId;

		const notification = await Notification.create({
			userId: finalUserId,
			title,
			message,
		});

		res.status(201).json({
			success: true,
			data: notification,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// DELETE notification
const deleteNotification = async (req, res) => {
	try {
		const { id } = req.params;

		const notification = await Notification.findByIdAndDelete(id);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Notification deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

module.exports = {
	getNotifications,
	createNotification,
	deleteNotification,
};
