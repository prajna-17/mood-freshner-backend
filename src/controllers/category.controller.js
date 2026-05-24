const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const Product = require("../models/product.model");

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, image, superCategory } = req.body;
    if (!name || !image || !superCategory) {
      return res.status(400).json({
        message: "All Fields are required!!",
      });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      image,
      superCategory,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error.message);
  }
};

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const { superCategory } = req.query;

    const filter = {};
    if (superCategory) {
      filter.superCategory = superCategory;
    }

    const categories = await Category.find(filter);
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, superCategory } = req.body;

    if (!name || !image || !superCategory) {
      return res.status(400).json({ message: "All Fields are required!!" });
    }

    const existing = await Category.findOne({ name, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const updated = await Category.findByIdAndUpdate(id, { name, image, superCategory }, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Category not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find subcategories of this category
    const subCategories = await SubCategory.find({ category: id });

    const subIds = subCategories.map((sub) => sub._id);

    // 2️⃣ Delete products belonging to these subcategories
    await Product.deleteMany({ subCategory: { $in: subIds } });

    // 3️⃣ Delete subcategories
    await SubCategory.deleteMany({ category: id });

    // 4️⃣ Finally delete category
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category and related data deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
