const express = require("express");
const {
  createSuperCategory,
  getSuperCategories,
  updateSuperCategory,
  deleteSuperCategory,
} = require("../controllers/superCategory.controller");

const router = express.Router();

router.post("/", createSuperCategory);
router.get("/", getSuperCategories);
router.put("/:id", updateSuperCategory);
router.delete("/:id", deleteSuperCategory);

module.exports = router;
