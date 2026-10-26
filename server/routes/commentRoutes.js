const express = require('express');
const { body } = require('express-validator');
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, validateObjectId } = require('../middleware/validateMiddleware');

// Mounted at /api so it can serve both /posts/:postId/comments and /comments/:id.
const router = express.Router();

const contentRule = body('content')
  .trim()
  .notEmpty()
  .withMessage('Comment cannot be empty')
  .isLength({ max: 1000 })
  .withMessage('Comment is too long (1000 max)');

router.get('/posts/:postId/comments', validateObjectId('postId'), getComments);
router.post(
  '/posts/:postId/comments',
  protect,
  validateObjectId('postId'),
  [contentRule, body('parentComment').optional({ nullable: true }).isMongoId().withMessage('Invalid parent comment')],
  validate,
  addComment
);
router.put('/comments/:id', protect, validateObjectId('id'), [contentRule], validate, updateComment);
router.delete('/comments/:id', protect, validateObjectId('id'), deleteComment);

module.exports = router;
