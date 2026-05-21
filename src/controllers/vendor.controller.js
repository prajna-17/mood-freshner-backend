const Vendor = require("../models/vendor.model");
const Purchase = require("../models/purchase.model");

// GET ALL VENDORS (with financial summaries aggregated)
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });

    // For each vendor, calculate financial summary
    const vendorSummaries = await Promise.all(
      vendors.map(async (vendor) => {
        const purchases = await Purchase.find({ vendor: vendor._id });
        
        let totalPurchases = 0;
        let totalPaid = 0;

        purchases.forEach((p) => {
          totalPurchases += p.totalAmount || 0;
          totalPaid += p.amountPaid || 0;
        });

        const outstanding = totalPurchases - totalPaid;

        return {
          ...vendor.toObject(),
          totalPurchases,
          totalPaid,
          outstanding,
          purchaseCount: purchases.length,
        };
      })
    );

    res.status(200).json({ status: "success", data: vendorSummaries });
  } catch (error) {
    console.error("GET VENDORS ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// GET SINGLE VENDOR (with detailed purchase history)
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ status: "error", message: "Vendor not found" });
    }

    const purchases = await Purchase.find({ vendor: vendor._id }).sort({ purchaseDate: -1 });

    let totalPurchases = 0;
    let totalPaid = 0;

    purchases.forEach((p) => {
      totalPurchases += p.totalAmount || 0;
      totalPaid += p.amountPaid || 0;
    });

    const outstanding = totalPurchases - totalPaid;

    res.status(200).json({
      status: "success",
      data: {
        vendor: {
          ...vendor.toObject(),
          totalPurchases,
          totalPaid,
          outstanding,
          purchaseCount: purchases.length,
        },
        purchases,
      },
    });
  } catch (error) {
    console.error("GET VENDOR BY ID ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// CREATE VENDOR
const createVendor = async (req, res) => {
  try {
    const { name, phone, city, state } = req.body;
    if (!name || !phone || !city || !state) {
      return res.status(400).json({
        status: "error",
        message: "Name, Phone, City, and State are required fields",
      });
    }

    const vendor = await Vendor.create(req.body);
    res.status(201).json({ status: "success", data: vendor });
  } catch (error) {
    console.error("CREATE VENDOR ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// UPDATE VENDOR
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vendor) {
      return res.status(404).json({ status: "error", message: "Vendor not found" });
    }

    res.status(200).json({ status: "success", data: vendor });
  } catch (error) {
    console.error("UPDATE VENDOR ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// DELETE VENDOR
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ status: "error", message: "Vendor not found" });
    }

    // Check if vendor has purchase history before deleting (optional safety check)
    const purchaseCount = await Purchase.countDocuments({ vendor: vendor._id });
    if (purchaseCount > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete vendor with existing purchase history. Delete purchases first.",
      });
    }

    await Vendor.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "success", message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("DELETE VENDOR ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
};
