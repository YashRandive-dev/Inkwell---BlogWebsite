const Category = require('../models/Category');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

// GET /api/categories  – each category includes its number of published posts
const getCategories = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Post.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = categories.map((c) => ({ ...c, postCount: countMap.get(String(c._id)) || 0 }));
  sendResponse(res, 200, 'Categories fetched', { categories: data });
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({ name: req.body.name, description: req.body.description });
  sendResponse(res, 201, 'Category created', { category });
});

// PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save();
  sendResponse(res, 200, 'Category updated', { category });
});

// DELETE /api/categories/:id  – refused while posts still use it
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const inUse = await Post.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${inUse} post(s) still use this category`);
  }
  await category.deleteOne();
  sendResponse(res, 200, 'Category deleted');
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
