const express = require("express");
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} = require("../controllers/vendor.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// All vendor operations require authentication and admin privileges
router.use(requireAuth, requireAdmin);

router.get("/", getVendors);
router.get("/:id", getVendorById);
router.post("/", createVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

module.exports = router;
