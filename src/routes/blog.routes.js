const express = require("express");
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require("../controllers/blog.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public routes (anyone can read blogs)
router.get("/", getBlogs);
router.get("/:id", getBlogById);

// Admin-only routes (must be logged in as admin to create, edit, delete blogs)
router.post("/", requireAuth, requireAdmin, createBlog);
router.put("/:id", requireAuth, requireAdmin, updateBlog);
router.delete("/:id", requireAuth, requireAdmin, deleteBlog);

module.exports = router;
