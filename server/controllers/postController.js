const Post = require('../models/Post');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { uploadBuffer, deleteImage } = require('../config/cloudinary');
const { sendResponse, buildPagination, parsePaging } = require('../utils/response');

// Fields shown on post cards (we skip the heavy `content` and `likes` fields).
const CARD_FIELDS = 'title slug excerpt coverImage category tags author status featured views likesCount readingTime createdAt updatedAt';

const populateCard = (query) =>
  query.populate('author', 'name avatar').populate('category', 'name slug');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts ["a","b"], '["a","b"]' or "a, b" and returns a clean array (max 10 tags).
const parseTags = (value) => {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch (e) {
      list = value.split(',');
    }
  }
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
};

const isOwnerOrAdmin = (post, user) =>
  post.author.toString() === user._id.toString() || user.role === 'admin';

// GET /api/posts
const getPosts = asyncHandler(async (req, res) => {
  const { search, category, tag, sort, author } = req.query;
  const { page, limit, skip } = parsePaging(req.query, 9);
  const filter = { status: 'published' };

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
  }
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    filter.category = cat ? cat._id : null; // unknown category -> no results
  }
  if (tag) filter.tags = tag.toLowerCase();
  if (author && /^[a-f\d]{24}$/i.test(author)) filter.author = author;

  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    liked: { likesCount: -1, createdAt: -1 },
    viewed: { views: -1, createdAt: -1 },
  };

  const [posts, total] = await Promise.all([
    populateCard(Post.find(filter).select(CARD_FIELDS).sort(sortMap[sort] || sortMap.latest).skip(skip).limit(limit)).lean(),
    Post.countDocuments(filter),
  ]);
  sendResponse(res, 200, 'Posts fetched', { posts }, buildPagination(page, limit, total));
});

// GET /api/posts/featured
const getFeaturedPosts = asyncHandler(async (req, res) => {
  const posts = await populateCard(
    Post.find({ status: 'published', featured: true }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(5)
  ).lean();
  sendResponse(res, 200, 'Featured posts fetched', { posts });
});

// GET /api/posts/popular
const getPopularPosts = asyncHandler(async (req, res) => {
  const posts = await populateCard(
    Post.find({ status: 'published' }).select(CARD_FIELDS).sort({ views: -1, likesCount: -1 }).limit(5)
  ).lean();
  sendResponse(res, 200, 'Popular posts fetched', { posts });
});

// GET /api/posts/tags  – most used tags (for the tag filter)
const getTags = asyncHandler(async (req, res) => {
  const tags = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 20 },
    { $project: { _id: 0, name: '$_id', count: 1 } },
  ]);
  sendResponse(res, 200, 'Tags fetched', { tags });
});

// GET /api/posts/:slug  (drafts are only visible to their author / admins)
const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug })
    .populate('author', 'name avatar bio socialLinks')
    .populate('category', 'name slug')
    .lean();
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const user = req.user;
  const canSeeDraft = user && isOwnerOrAdmin({ author: post.author._id }, user);
  if (post.status === 'draft' && !canSeeDraft) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Count a view for published posts (the author reading their own post does not count).
  const isAuthor = user && post.author._id.toString() === user._id.toString();
  if (post.status === 'published' && !isAuthor) {
    // Fire and forget: the reader should not wait on the database for a view counter.
    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {});
    post.views += 1;
  }

  post.liked = !!user && post.likes.some((id) => id.toString() === user._id.toString());
  post.bookmarked = !!user && user.bookmarks.some((id) => id.toString() === post._id.toString());
  delete post.likes;
  sendResponse(res, 200, 'Post fetched', { post });
});

// GET /api/posts/:slug/related
const getRelatedPosts = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select('category').lean();
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const posts = await populateCard(
    Post.find({ status: 'published', category: post.category, _id: { $ne: post._id } })
      .select(CARD_FIELDS)
      .sort({ createdAt: -1 })
      .limit(3)
  ).lean();
  sendResponse(res, 200, 'Related posts fetched', { posts });
});

// POST /api/posts
const createPost = asyncHandler(async (req, res) => {
  const { title, excerpt, content, category, status, tags } = req.body;

  const cat = await Category.findById(category);
  if (!cat) {
    res.status(400);
    throw new Error('Selected category does not exist');
  }

  const coverImage = req.file ? await uploadBuffer(req.file.buffer, 'inkwell/posts') : undefined;

  try {
    const post = await Post.create({
      title,
      excerpt: excerpt || '',
      content,
      category,
      status: status === 'published' ? 'published' : 'draft',
      tags: parseTags(tags),
      author: req.user._id,
      coverImage,
    });
    sendResponse(res, 201, post.status === 'published' ? 'Post published' : 'Draft saved', { post });
  } catch (error) {
    if (coverImage) await deleteImage(coverImage.public_id); // do not leave orphan images
    throw error;
  }
});

// POST /api/posts/upload-image  – used by the rich text editor's image button
const uploadInlineImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please choose an image to upload');
  }
  const image = await uploadBuffer(req.file.buffer, 'inkwell/content');
  sendResponse(res, 201, 'Image uploaded', { url: image.url });
});

// PUT /api/posts/:id
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (!isOwnerOrAdmin(post, req.user)) {
    res.status(403);
    throw new Error('You can only edit your own posts');
  }

  const { title, excerpt, content, category, status, tags, removeCoverImage } = req.body;

  if (category) {
    if (!(await Category.exists({ _id: category }))) {
      res.status(400);
      throw new Error('Selected category does not exist');
    }
    post.category = category;
  }
  if (title !== undefined) post.title = title; // the slug stays the same so old links keep working
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (content !== undefined) post.content = content;
  if (status) post.status = status === 'published' ? 'published' : 'draft';
  if (tags !== undefined) post.tags = parseTags(tags);

  let oldImageId = null;
  if (req.file) {
    oldImageId = post.coverImage && post.coverImage.public_id;
    post.coverImage = await uploadBuffer(req.file.buffer, 'inkwell/posts');
  } else if (removeCoverImage === 'true') {
    oldImageId = post.coverImage && post.coverImage.public_id;
    post.coverImage = { url: '', public_id: '' };
  }

  await post.save();
  if (oldImageId) await deleteImage(oldImageId);
  sendResponse(res, 200, 'Post updated', { post });
});

// DELETE /api/posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (!isOwnerOrAdmin(post, req.user)) {
    res.status(403);
    throw new Error('You can only delete your own posts');
  }
  await Comment.deleteMany({ post: post._id });
  await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });
  await deleteImage(post.coverImage && post.coverImage.public_id);
  await post.deleteOne();
  sendResponse(res, 200, 'Post deleted');
});

// PUT /api/posts/:id/like  (toggle)
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, status: 'published' });
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const userId = req.user._id;
  const liked = post.likes.some((id) => id.equals(userId));
  if (liked) post.likes.pull(userId);
  else post.likes.push(userId);
  post.likesCount = post.likes.length;
  await post.save();
  sendResponse(res, 200, liked ? 'Like removed' : 'Post liked', { liked: !liked, likesCount: post.likesCount });
});

// PUT /api/posts/:id/bookmark  (toggle)
const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, status: 'published' }).select('_id');
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const user = await User.findById(req.user._id);
  const bookmarked = user.bookmarks.some((id) => id.equals(post._id));
  if (bookmarked) user.bookmarks.pull(post._id);
  else user.bookmarks.push(post._id);
  await user.save();
  sendResponse(res, 200, bookmarked ? 'Removed from saved posts' : 'Post saved', {
    bookmarked: !bookmarked,
    bookmarks: user.bookmarks.map(String),
  });
});

module.exports = {
  CARD_FIELDS,
  getPosts,
  getFeaturedPosts,
  getPopularPosts,
  getTags,
  getPostBySlug,
  getRelatedPosts,
  createPost,
  uploadInlineImage,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
};
