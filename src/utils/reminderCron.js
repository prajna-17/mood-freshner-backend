const Order = require("../models/order.model");
const Notification = require("../models/notification.model");

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    // Find bulk advance orders that are active, not yet delivered/cancelled,
    // not yet reminded, and scheduled delivery is in the next 48 hours.
    const upcomingOrders = await Order.find({
      orderType: "BULK_ADVANCE",
      reminderSent: false,
      orderStatus: { $nin: ["DELIVERED", "CANCELLED"] },
      scheduledDeliveryDate: {
        $gte: now,
        $lte: twoDaysFromNow,
      },
    });

    console.log(`[Reminder Cron] Found ${upcomingOrders.length} upcoming bulk advance orders to remind.`);

    for (const order of upcomingOrders) {
      // Create user notification
      await Notification.create({
        userId: order.user,
        title: "Upcoming Bulk Order Reminder ⏰",
        message: `Your bulk order #${order._id.toString().slice(-6)} is scheduled for delivery on ${new Date(order.scheduledDeliveryDate).toLocaleDateString("en-IN")}. Outstanding balance: ₹${order.balanceDue}.`,
      });

      // Mark as reminded so we don't spam
      order.reminderSent = true;
      await order.save();
      console.log(`[Reminder Cron] Reminder sent for order: ${order._id}`);
    }
  } catch (error) {
    console.error("[Reminder Cron] Error running checkAndSendReminders:", error);
  }
};

const startReminderCron = () => {
  console.log("[Reminder Cron] Reminder cron service started.");
  
  // Run once immediately on startup (with 10-second delay so DB is fully connected)
  setTimeout(() => {
    checkAndSendReminders();
  }, 10000);

  // Run every 12 hours
  setInterval(() => {
    checkAndSendReminders();
  }, 12 * 60 * 60 * 1000);
};

module.exports = { startReminderCron, checkAndSendReminders };
