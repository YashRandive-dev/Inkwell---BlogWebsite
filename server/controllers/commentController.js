const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');

// GET /api/posts/:postId/comments  – flat list, oldest first (the client nests replies)
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('user', 'name avatar')
    .sort({ createdAt: 1 })
    .lean();
  sendResponse(res, 200, 'Comments fetched', { comments });
});

// POST /api/posts/:postId/comments
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.postId, status: 'published' }).select('_id');
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  let parentComment = null;
  if (req.body.parentComment) {
    const parent = await Comment.findById(req.body.parentComment);
    if (!parent || parent.post.toString() !== post._id.toString()) {
      res.status(400);
      throw new Error('The comment you are replying to does not exist');
    }
    // Only one level of replies: replying to a reply attaches to its parent.
    parentComment = parent.parentComment || parent._id;
  }

  const comment = await Comment.create({
    post: post._id,
    user: req.user._id,
    content: req.body.content,
    parentComment,
  });
  await comment.populate('user', 'name avatar');
  sendResponse(res, 201, 'Comment added', { comment });
});

// PUT /api/comments/:id  (author only)
const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only edit your own comments');
  }
  comment.content = req.body.content;
  await comment.save();
  await comment.populate('user', 'name avatar');
  sendResponse(res, 200, 'Comment updated', { comment });
});

// DELETE /api/comments/:id  (author or admin) – also removes replies
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You can only delete your own comments');
  }
  await Comment.deleteMany({ $or: [{ _id: comment._id }, { parentComment: comment._id }] });
  sendResponse(res, 200, 'Comment deleted');
});

module.exports = { getComments, addComment, updateComment, deleteComment };
