const express = require('express');
const { body } = require('express-validator');
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllPosts,
  toggleFeature,
  getAllComments,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate, validateObjectId } = require('../middleware/validateMiddleware');

const router = express.Router();

// Every admin route requires a logged-in admin.
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put(
  '/users/:id/role',
  validateObjectId('id'),
  [body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')],
  validate,
  updateUserRole
);
router.delete('/users/:id', validateObjectId('id'), deleteUser);
router.get('/posts', getAllPosts);
router.put('/posts/:id/feature', validateObjectId('id'), toggleFeature);
router.get('/comments', getAllComments);

module.exports = router;
