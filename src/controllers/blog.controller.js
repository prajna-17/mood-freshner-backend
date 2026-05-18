const Blog = require("../models/blog.model");
const { createResponse, ErrorResponse } = require("../utils/responseWrapper");

// CREATE BLOG
const createBlog = async (req, res) => {
  try {
    const { title, content, images, author, status } = req.body;

    if (!title || !content) {
      return res.status(400).json(ErrorResponse(400, "Title and Content are required fields"));
    }

    const blog = await Blog.create({
      title,
      content,
      images: images || [],
      author: author || "Admin",
      status: status || "PUBLISHED",
    });

    res.status(201).json(createResponse(201, blog, "Blog created successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// GET ALL BLOGS
const getBlogs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.status(200).json(createResponse(200, blogs, "Blogs fetched successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// GET SINGLE BLOG BY ID
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json(ErrorResponse(404, "Blog not found"));
    }
    res.status(200).json(createResponse(200, blog, "Blog fetched successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// UPDATE BLOG
const updateBlog = async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return res.status(404).json(ErrorResponse(404, "Blog not found"));
    }

    res.status(200).json(createResponse(200, updatedBlog, "Blog updated successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

// DELETE BLOG
const deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json(ErrorResponse(404, "Blog not found"));
    }
    res.status(200).json(createResponse(200, null, "Blog deleted successfully"));
  } catch (error) {
    res.status(500).json(ErrorResponse(500, error.message));
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
