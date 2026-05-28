const Product = require("../models/product.model");
const Category = require("../models/category.model");

const normalizeInventory = (body) => {
  // If sizes is a string, robustly parse it first
  if (typeof body.sizes === "string") {
    try {
      const trimmed = body.sizes.trim();
      if (trimmed.startsWith("[")) {
        // It's a JSON or JS array string
        try {
          body.sizes = JSON.parse(trimmed);
        } catch (e) {
          // If pure JSON parsing failed, try sanitizing JS-style object strings
          let sanitized = trimmed
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3'); // Wrap keys in double quotes
          body.sizes = JSON.parse(sanitized);
        }
      } else if (trimmed !== "") {
        // It's a legacy comma-separated string (e.g. "Small, Large")
        body.sizes = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        body.sizes = [];
      }
    } catch (err) {
      console.error("Failed to parse sizes string:", err);
      try {
        body.sizes = body.sizes.split(",").map((s) => s.trim()).filter(Boolean);
      } catch (_) {
        body.sizes = [];
      }
    }
  }

  if (body.sizes && Array.isArray(body.sizes) && body.sizes.length > 0) {
    let totalQty = 0;
    let customSizesObjCount = 0;

    body.sizes = body.sizes.map((s) => {
      // Legacy string size element (convert using product defaults)
      if (typeof s === "string") {
        const baseQty = Math.max(Number(body.quantity) || 0, 0);
        return {
          size: s.trim(),
          price: Number(body.price) || 0,
          oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
          quantity: baseQty,
        };
      }

      // New schema format element
      if (s && typeof s === "object") {
        const qty = Math.max(Number(s.quantity) || 0, 0);
        totalQty += qty;
        customSizesObjCount++;
        return {
          size: String(s.size || "").trim(),
          price: Number(s.price) || 0,
          oldPrice: s.oldPrice ? Number(s.oldPrice) : undefined,
          quantity: qty,
        };
      }
      return s;
    });

    // Only overwrite top-level quantity with sizes sum if they are custom objects with quantities
    if (customSizesObjCount > 0) {
      body.quantity = totalQty;
    }
  } else if (body.quantity !== undefined) {
    body.quantity = Math.max(Number(body.quantity) || 0, 0);
  }

  if (body.quantity === 0) {
    body.inStock = false;
  } else {
    body.inStock = true;
  }

  return body;
};


// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { category, subCategory } = req.body;

    const categoryExist = await Category.findById(category);
    if (!categoryExist || !subCategory) {
      return res.status(400).json({ message: "Invalid category" });
    }

    req.body.superCategory = categoryExist.superCategory;
    if (req.body.quantity === undefined) {
      req.body.quantity = 0;
    }
    normalizeInventory(req.body);

    if (!categoryExist || !subCategory)
      return res.status(400).json({ message: "Invalid category" });

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const { category, superCategory, subCategory, search, pincode } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (superCategory) filter.superCategory = superCategory;
    if (subCategory) filter.subCategory = subCategory;
    if (pincode) {
      filter.availablePincodes = pincode;
    }
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter).populate("category");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    if (req.body.category) {
      const categoryExist = await Category.findById(req.body.category);
      if (!categoryExist)
        return res.status(400).json({ message: "Invalid category" });
    }

    normalizeInventory(req.body);

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
