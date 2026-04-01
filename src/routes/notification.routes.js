const express = require("express");
const router = express.Router();
const {
  getNotifications,
  createNotification,
  deleteNotification,
} = require("../controllers/notification.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

// Public - any logged in user can read
router.get("/", getNotifications);

// Admin only
router.post("/", requireAuth, requireAdmin, createNotification);
router.delete("/:id", requireAuth, requireAdmin, deleteNotification);

module.exports = router;
