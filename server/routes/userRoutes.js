const express = require('express');
const { body } = require('express-validator');
const { getAuthors, getUserProfile, updateProfile, getMyPosts, getMyBookmarks, getMyStats } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate, validateObjectId } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }).withMessage('Name is too long'),
    body('bio').optional().trim().isLength({ max: 300 }).withMessage('Bio must be 300 characters or fewer'),
  ],
  validate,
  updateProfile
);

// "/me/..." routes must come before "/:id".
router.get('/me/posts', protect, getMyPosts);
router.get('/me/bookmarks', protect, getMyBookmarks);
router.get('/me/stats', protect, getMyStats);

router.get('/', getAuthors);
router.get('/:id', validateObjectId('id'), getUserProfile);

module.exports = router;
