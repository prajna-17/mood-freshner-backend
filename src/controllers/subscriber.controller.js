// controllers/subscriber.controller.js

const Subscriber = require("../models/subscriber.model");

// CREATE subscriber
const subscribeEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "You are already subscribed!",
        data: existing,
      });
    }

    const subscriber = await Subscriber.create({ email });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed!",
      data: subscriber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET all subscribers
const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE subscriber
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Subscriber.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscriber removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  subscribeEmail,
  getSubscribers,
  deleteSubscriber,
};
