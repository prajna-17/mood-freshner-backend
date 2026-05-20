// routes/subscriber.routes.js

const express = require("express");
const router = express.Router();
const {
  subscribeEmail,
  getSubscribers,
  deleteSubscriber,
} = require("../controllers/subscriber.controller");

// POST subscribe email
router.post("/", subscribeEmail);

// GET all subscribers
router.get("/", getSubscribers);

// DELETE subscriber
router.delete("/:id", deleteSubscriber);

module.exports = router;
