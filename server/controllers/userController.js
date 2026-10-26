const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const { uploadBuffer, deleteImage } = require('../config/cloudinary');
const { sendResponse } = require('../utils/response');
const { formatUser } = require('./authController');
const { CARD_FIELDS } = require('./postController');

// GET /api/users  – writers directory: everyone with at least one published post
const getAuthors = asyncHandler(async (req, res) => {
  const authors = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$author', postCount: { $sum: 1 }, views: { $sum: '$views' } } },
    { $sort: { postCount: -1, views: -1 } },
    { $limit: 60 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: '$user.name', avatar: '$user.avatar', bio: '$user.bio', postCount: 1, views: 1 } },
  ]);
  sendResponse(res, 200, 'Writers fetched', { authors });
});

// GET /api/users/:id  – public profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar bio socialLinks createdAt').lean();
  if (!user) {
    res.status(404);
    throw new Error('Author not found');
  }
  const postCount = await Post.countDocuments({ author: user._id, status: 'published' });
  sendResponse(res, 200, 'Profile fetched', { user: { ...user, postCount } });
});

// PUT /api/users/profile  (multipart: optional "avatar" file)
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, bio, removeAvatar } = req.body;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;

  if (req.body.socialLinks !== undefined) {
    let links = req.body.socialLinks;
    if (typeof links === 'string') {
      try {
        links = JSON.parse(links);
      } catch (e) {
        res.status(400);
        throw new Error('Invalid social links');
      }
    }
    ['twitter', 'github', 'linkedin', 'website'].forEach((key) => {
      if (links && typeof links[key] === 'string') user.socialLinks[key] = links[key].trim();
    });
  }

  let oldAvatarId = null;
  if (req.file) {
    oldAvatarId = user.avatar && user.avatar.public_id;
    user.avatar = await uploadBuffer(req.file.buffer, 'inkwell/avatars');
  } else if (removeAvatar === 'true') {
    oldAvatarId = user.avatar && user.avatar.public_id;
    user.avatar = { url: '', public_id: '' };
  }

  await user.save();
  if (oldAvatarId) await deleteImage(oldAvatarId);
  sendResponse(res, 200, 'Profile updated', { user: formatUser(user) });
});

// GET /api/users/me/posts  – all of my posts (drafts included)
const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id })
    .select(CARD_FIELDS)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, 200, 'Your posts', { posts });
});

// GET /api/users/me/bookmarks
const getMyBookmarks = asyncHandler(async (req, res) => {
  const posts = await Post.find({ _id: { $in: req.user.bookmarks }, status: 'published' })
    .select(CARD_FIELDS)
    .populate('author', 'name avatar')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, 200, 'Saved posts', { posts });
});

// GET /api/users/me/stats
const getMyStats = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id }).select('views likesCount status').lean();
  const postIds = posts.map((p) => p._id);
  const totalComments = await Comment.countDocuments({ post: { $in: postIds } });
  sendResponse(res, 200, 'Stats fetched', {
    stats: {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.status === 'published').length,
      draftPosts: posts.filter((p) => p.status === 'draft').length,
      totalViews: posts.reduce((sum, p) => sum + p.views, 0),
      totalLikes: posts.reduce((sum, p) => sum + p.likesCount, 0),
      totalComments,
    },
  });
});

module.exports = { getAuthors, getUserProfile, updateProfile, getMyPosts, getMyBookmarks, getMyStats };
