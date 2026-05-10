// routes/contact.routes.js

const express = require("express");

const router = express.Router();

const {
  createContact,
  getContacts,
  deleteContact,
} = require("../controllers/contact.controller");

// POST create contact message
router.post("/", createContact);

// GET all contact messages
router.get("/", getContacts);

// DELETE contact message
router.delete("/:id", deleteContact);

module.exports = router;