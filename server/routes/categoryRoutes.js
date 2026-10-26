const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate, validateObjectId } = require('../middleware/validateMiddleware');

const router = express.Router();

const rules = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 40 }).withMessage('Name is too long (40 max)'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description is too long (200 max)'),
];

router.get('/', getCategories);
router.post('/', protect, adminOnly, rules, validate, createCategory);
router.put('/:id', protect, adminOnly, validateObjectId('id'), rules, validate, updateCategory);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteCategory);

module.exports = router;
