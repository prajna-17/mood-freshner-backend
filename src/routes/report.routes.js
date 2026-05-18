const express = require("express");
const { getReports, getVendors } = require("../controllers/report.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// Allow authenticated admin users to view reports and fetch vendors
router.get("/", requireAuth, requireAdmin, getReports);
router.get("/vendors", requireAuth, requireAdmin, getVendors);

module.exports = router;
