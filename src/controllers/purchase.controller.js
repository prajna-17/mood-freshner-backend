const Purchase = require("../models/purchase.model");
const Vendor = require("../models/vendor.model");

// GET ALL PURCHASES (with filters and populate)
const getPurchases = async (req, res) => {
  try {
    const { vendor, startDate, endDate, paymentStatus } = req.query;
    const filter = {};

    if (vendor) {
      filter.vendor = vendor;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus.toUpperCase();
    }

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) {
        filter.purchaseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }

    const purchases = await Purchase.find(filter)
      .populate("vendor")
      .populate("products.product")
      .sort({ purchaseDate: -1 });

    res.status(200).json({ status: "success", data: purchases });
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// GET SINGLE PURCHASE BY ID
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("vendor")
      .populate("products.product");

    if (!purchase) {
      return res.status(404).json({ status: "error", message: "Purchase record not found" });
    }

    res.status(200).json({ status: "success", data: purchase });
  } catch (error) {
    console.error("GET PURCHASE BY ID ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// CREATE NEW PURCHASE
const createPurchase = async (req, res) => {
  try {
    const { vendor, products, totalAmount, purchaseDate, initialPayment } = req.body;

    if (!vendor || !products || products.length === 0 || !totalAmount) {
      return res.status(400).json({
        status: "error",
        message: "Vendor, products list, and total amount are required",
      });
    }

    // Verify vendor exists
    const vendorExists = await Vendor.findById(vendor);
    if (!vendorExists) {
      return res.status(404).json({ status: "error", message: "Vendor not found" });
    }

    // Calculate initial payments
    let amountPaid = 0;
    const payments = [];

    if (initialPayment && Number(initialPayment.amount) > 0) {
      const amt = Number(initialPayment.amount);
      amountPaid = amt;
      payments.push({
        amount: amt,
        paymentDate: initialPayment.paymentDate || new Date(),
        paymentMethod: initialPayment.paymentMethod || "CASH",
        notes: initialPayment.notes || "Initial payment on purchase",
      });
    }

    // Determine status
    let paymentStatus = "PENDING";
    if (amountPaid >= totalAmount) {
      paymentStatus = "PAID";
    } else if (amountPaid > 0) {
      paymentStatus = "PARTIAL";
    }

    const purchase = await Purchase.create({
      vendor,
      products,
      totalAmount,
      amountPaid,
      payments,
      purchaseDate: purchaseDate || new Date(),
      paymentStatus,
    });

    res.status(201).json({ status: "success", data: purchase });
  } catch (error) {
    console.error("CREATE PURCHASE ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ADD A PAYMENT TO A PURCHASE
const addPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ status: "error", message: "Valid payment amount is required" });
    }

    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ status: "error", message: "Purchase record not found" });
    }

    const payAmount = Number(amount);
    const newPayment = {
      amount: payAmount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || "CASH",
      notes: notes || "Additional payment",
    };

    purchase.payments.push(newPayment);
    
    // Recalculate amountPaid
    const totalPaid = purchase.payments.reduce((acc, curr) => acc + curr.amount, 0);
    purchase.amountPaid = totalPaid;

    // Recalculate status
    if (purchase.amountPaid >= purchase.totalAmount) {
      purchase.paymentStatus = "PAID";
    } else if (purchase.amountPaid > 0) {
      purchase.paymentStatus = "PARTIAL";
    } else {
      purchase.paymentStatus = "PENDING";
    }

    await purchase.save();

    res.status(200).json({ status: "success", message: "Payment added successfully", data: purchase });
  } catch (error) {
    console.error("ADD PAYMENT ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// DELETE A PAYMENT FROM A PURCHASE
const deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ status: "error", message: "Purchase record not found" });
    }

    // Filter out the payment
    const paymentExists = purchase.payments.id(paymentId);
    if (!paymentExists) {
      return res.status(404).json({ status: "error", message: "Payment transaction not found" });
    }

    purchase.payments.pull(paymentId);

    // Recalculate amountPaid & status
    const totalPaid = purchase.payments.reduce((acc, curr) => acc + curr.amount, 0);
    purchase.amountPaid = totalPaid;

    if (purchase.amountPaid >= purchase.totalAmount) {
      purchase.paymentStatus = "PAID";
    } else if (purchase.amountPaid > 0) {
      purchase.paymentStatus = "PARTIAL";
    } else {
      purchase.paymentStatus = "PENDING";
    }

    await purchase.save();

    res.status(200).json({ status: "success", message: "Payment deleted successfully", data: purchase });
  } catch (error) {
    console.error("DELETE PAYMENT ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// DELETE ENTIRE PURCHASE ENTRY
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) {
      return res.status(404).json({ status: "error", message: "Purchase record not found" });
    }

    res.status(200).json({ status: "success", message: "Purchase record deleted successfully" });
  } catch (error) {
    console.error("DELETE PURCHASE ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  addPayment,
  deletePayment,
  deletePurchase,
};
