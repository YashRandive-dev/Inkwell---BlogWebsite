const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { validate, validateObjectId } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Title is too long (150 max)'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').optional().trim().isLength({ max: 300 }).withMessage('Excerpt is too long (300 max)'),
  body('category').isMongoId().withMessage('Please choose a category'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];

const updateRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }).withMessage('Title is too long (150 max)'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('excerpt').optional().trim().isLength({ max: 300 }).withMessage('Excerpt is too long (300 max)'),
  body('category').optional().isMongoId().withMessage('Invalid category'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];

// Fixed paths must come before "/:slug".
router.get('/', getPosts);
router.get('/featured', getFeaturedPosts);
router.get('/popular', getPopularPosts);
router.get('/tags', getTags);
router.post('/', protect, upload.single('coverImage'), createRules, validate, createPost);
router.post('/upload-image', protect, upload.single('image'), uploadInlineImage);

router.put('/:id/like', protect, validateObjectId('id'), toggleLike);
router.put('/:id/bookmark', protect, validateObjectId('id'), toggleBookmark);
router.put('/:id', protect, validateObjectId('id'), upload.single('coverImage'), updateRules, validate, updatePost);
router.delete('/:id', protect, validateObjectId('id'), deletePost);

router.get('/:slug/related', getRelatedPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

module.exports = router;
