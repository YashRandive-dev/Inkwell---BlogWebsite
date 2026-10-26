const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { deleteImage } = require('../config/cloudinary');
const { sendResponse, buildPagination, parsePaging } = require('../utils/response');
const { CARD_FIELDS } = require('./postController');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [users, posts, comments, categories, perMonth, byCategory] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Category.countDocuments(),
    Post.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { _id: 0, name: '$cat.name', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Fill in months with zero posts so the chart has no gaps.
  const postsPerMonth = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const hit = perMonth.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1);
    postsPerMonth.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      posts: hit ? hit.count : 0,
    });
  }

  sendResponse(res, 200, 'Stats fetched', {
    stats: { users, posts, comments, categories },
    postsPerMonth,
    postsByCategory: byCategory,
  });
});

// GET /api/admin/users?search=&page=
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query, 10);
  const filter = {};
  if (req.query.search && req.query.search.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('name email avatar role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  sendResponse(res, 200, 'Users fetched', { users }, buildPagination(page, limit, total));
});

// PUT /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.role = req.body.role;
  await user.save({ validateBeforeSave: false });
  sendResponse(res, 200, `${user.name} is now ${user.role === 'admin' ? 'an admin' : 'a regular user'}`, {
    user: { _id: user._id, role: user.role },
  });
});

// DELETE /api/admin/users/:id  – also removes the user's posts, comments and likes
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account here');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const posts = await Post.find({ author: user._id }).select('coverImage');
  const postIds = posts.map((p) => p._id);
  await Promise.all(posts.map((p) => deleteImage(p.coverImage && p.coverImage.public_id)));
  await Comment.deleteMany({ $or: [{ post: { $in: postIds } }, { user: user._id }] });
  await Post.deleteMany({ author: user._id });
  await Post.updateMany({ likes: user._id }, { $pull: { likes: user._id }, $inc: { likesCount: -1 } });
  await deleteImage(user.avatar && user.avatar.public_id);
  await user.deleteOne();
  sendResponse(res, 200, 'User deleted');
});

// GET /api/admin/posts  – every post, drafts included
const getAllPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query, 10);
  const filter = {};
  if (req.query.search && req.query.search.trim()) {
    filter.title = new RegExp(escapeRegex(req.query.search.trim()), 'i');
  }
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select(CARD_FIELDS)
      .populate('author', 'name')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);
  sendResponse(res, 200, 'Posts fetched', { posts }, buildPagination(page, limit, total));
});

// PUT /api/admin/posts/:id/feature  (toggle)
const toggleFeature = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).select('featured status');
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (post.status !== 'published' && !post.featured) {
    res.status(400);
    throw new Error('Only published posts can be featured');
  }
  post.featured = !post.featured;
  await post.save();
  sendResponse(res, 200, post.featured ? 'Post featured' : 'Post unfeatured', {
    post: { _id: post._id, featured: post.featured },
  });
});

// GET /api/admin/comments
const getAllComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query, 10);
  const [comments, total] = await Promise.all([
    Comment.find()
      .populate('user', 'name')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(),
  ]);
  sendResponse(res, 200, 'Comments fetched', { comments }, buildPagination(page, limit, total));
});

module.exports = { getStats, getUsers, updateUserRole, deleteUser, getAllPosts, toggleFeature, getAllComments };
