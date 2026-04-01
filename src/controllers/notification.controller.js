const Notification = require("../models/notification.model");

// GET all notifications (used by users)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create notification (admin only)
const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });
    }

    const notification = await Notification.create({ title, message });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a notification (admin only)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, createNotification, deleteNotification };
