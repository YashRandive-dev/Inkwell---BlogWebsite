const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendMessage, subscribe } = require('../controllers/contactController');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// Stops the public forms from being used to spam the inbox.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', data: null },
});

router.use(formLimiter);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }).withMessage('Name is too long'),
    body('email').trim().isEmail().withMessage('Please enter a valid email'),
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 120 }).withMessage('Subject is too long'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  ],
  validate,
  sendMessage
);
router.post('/subscribe', [body('email').trim().isEmail().withMessage('Please enter a valid email')], validate, subscribe);

module.exports = router;
