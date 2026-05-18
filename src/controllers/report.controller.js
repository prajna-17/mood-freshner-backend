const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Vendor = require("../models/vendor.model");
const Purchase = require("../models/purchase.model");
const { createResponse, ErrorResponse } = require("../utils/responseWrapper");

// Helper to seed sample data if DB is empty
const seedSampleDataIfNeeded = async () => {
  try {
    let vendors = await Vendor.find({});
    if (vendors.length === 0) {
      // Seed Vendors
      vendors = await Vendor.create([
        {
          name: "Global Apparel Distributors",
          contactPerson: "John Doe",
          phone: "9876543210",
          email: "global@apparel.com",
          address: "123 Fashion Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
        {
          name: "Apex Electronics Supplies",
          contactPerson: "Jane Smith",
          phone: "8765432109",
          email: "apex@electronics.com",
          address: "456 Tech Park",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        },
        {
          name: "Supreme Lifestyle & Goods",
          contactPerson: "Robert Brown",
          phone: "7654321098",
          email: "supreme@lifestyle.com",
          address: "789 Trade Tower",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
        },
      ]);
      console.log("Sample vendors seeded successfully.");
    }

    // Ensure some products are associated with vendors
    const products = await Product.find({});
    if (products.length > 0) {
      let updatedCount = 0;
      for (let i = 0; i < products.length; i++) {
        if (!products[i].vendor) {
          const randomVendor = vendors[i % vendors.length];
          products[i].vendor = randomVendor._id;
          await products[i].save();
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`Associated ${updatedCount} products with vendors.`);
      }
    }

    // Seed Purchases if empty
    let purchases = await Purchase.find({});
    if (purchases.length === 0 && products.length > 0) {
      const samplePurchases = [];
      // Purchase 1
      samplePurchases.push({
        vendor: vendors[0]._id,
        products: [
          {
            product: products[0]._id,
            title: products[0].title,
            price: Math.round(products[0].price * 0.6), // Cost price is 60% of retail price
            quantity: 50,
            subtotal: Math.round(products[0].price * 0.6) * 50,
          },
        ],
        totalAmount: Math.round(products[0].price * 0.6) * 50,
        purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        paymentStatus: "PAID",
      });

      // Purchase 2
      if (products.length > 1) {
        samplePurchases.push({
          vendor: vendors[1]._id,
          products: [
            {
              product: products[1]._id,
              title: products[1].title,
              price: Math.round(products[1].price * 0.65),
              quantity: 30,
              subtotal: Math.round(products[1].price * 0.65) * 30,
            },
          ],
          totalAmount: Math.round(products[1].price * 0.65) * 30,
          purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          paymentStatus: "PENDING",
        });
      }

      await Purchase.create(samplePurchases);
      console.log("Sample purchases seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding sample report data:", err.message);
  }
};

const getReports = async (req, res) => {
  try {
    await seedSampleDataIfNeeded();

    const { type, filter, item, vendor, area, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    if (type === "purchase") {
      // Build Purchase Query
      const query = {};
      if (startDate || endDate) {
        query.purchaseDate = dateFilter;
      }
      if (vendor) {
        query.vendor = vendor;
      }

      // Fetch all purchases and populate vendor/product details
      const purchases = await Purchase.find(query)
        .populate("vendor")
        .populate("products.product")
        .sort({ purchaseDate: -1 });

      let reportRows = [];
      purchases.forEach((p) => {
        p.products.forEach((prod) => {
          const itemMatch = !item || prod.title.toLowerCase().includes(item.toLowerCase());
          const areaMatch = !area || (p.vendor && (
            p.vendor.city.toLowerCase().includes(area.toLowerCase()) ||
            p.vendor.state.toLowerCase().includes(area.toLowerCase())
          ));

          if (itemMatch && areaMatch) {
            reportRows.push({
              id: p._id + "-" + prod.product?._id,
              date: p.purchaseDate.toISOString().split("T")[0],
              itemName: prod.title,
              vendor: p.vendor ? p.vendor.name : "Unknown Vendor",
              area: p.vendor ? `${p.vendor.city}, ${p.vendor.state}` : "Unknown Area",
              quantity: prod.quantity,
              amount: prod.subtotal,
            });
          }
        });
      });

      return res.status(200).json(createResponse(200, reportRows, "Purchases report fetched successfully"));
    } else {
      // DEFAULT: Sales report
      const query = {};
      if (startDate || endDate) {
        query.createdAt = dateFilter;
      }

      // Fetch all successfully paid/placed orders
      const orders = await Order.find(query)
        .populate({
          path: "products.product",
          populate: { path: "vendor" },
        })
        .sort({ createdAt: -1 });

      let reportRows = [];
      orders.forEach((o) => {
        o.products.forEach((prod) => {
          const itemMatch = !item || prod.title.toLowerCase().includes(item.toLowerCase());
          
          // Access vendor from the populated Product model
          const prodVendor = prod.product && prod.product.vendor ? prod.product.vendor : null;
          const vendorMatch = !vendor || (prodVendor && prodVendor._id.toString() === vendor);

          const areaMatch = !area || (o.shippingAddress && (
            o.shippingAddress.city.toLowerCase().includes(area.toLowerCase()) ||
            o.shippingAddress.state.toLowerCase().includes(area.toLowerCase())
          ));

          if (itemMatch && vendorMatch && areaMatch) {
            reportRows.push({
              id: o._id + "-" + prod.product?._id,
              date: o.createdAt.toISOString().split("T")[0],
              itemName: prod.title,
              vendor: prodVendor ? prodVendor.name : "Direct Retail",
              area: o.shippingAddress ? `${o.shippingAddress.city}, ${o.shippingAddress.state}` : "Unknown Area",
              quantity: prod.quantity,
              amount: prod.subtotal || (prod.price * prod.quantity),
            });
          }
        });
      });

      return res.status(200).json(createResponse(200, reportRows, "Sales report fetched successfully"));
    }
  } catch (error) {
    console.error("Report Controller Error:", error);
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// GET ALL VENDORS FOR DROPDOWNS
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.status(200).json(createResponse(200, vendors, "Vendors fetched successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

module.exports = {
  getReports,
  getVendors,
};
