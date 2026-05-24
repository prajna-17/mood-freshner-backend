const SuperCategory = require("../models/superCategory.model");
const Category = require("../models/category.model");

const createSuperCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await SuperCategory.findOne({ name });
    if (exists) return res.status(400).json({ message: "Already exists" });

    const superCategory = await SuperCategory.create({ name });
    res.status(201).json(superCategory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSuperCategories = async (req, res) => {
  try {
    const data = await SuperCategory.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSuperCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await SuperCategory.findOne({
      name,
      _id: { $ne: req.params.id },
    });
    if (exists) return res.status(400).json({ message: "Already exists" });

    const updated = await SuperCategory.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Super category not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSuperCategory = async (req, res) => {
  try {
    const linkedCategories = await Category.countDocuments({
      superCategory: req.params.id,
    });

    if (linkedCategories > 0) {
      return res.status(400).json({
        message: "Cannot delete a super category that has categories",
      });
    }

    const deleted = await SuperCategory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Super category not found" });
    }

    res.json({ message: "Super category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSuperCategory,
  getSuperCategories,
  updateSuperCategory,
  deleteSuperCategory,
};
