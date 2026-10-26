const express = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// At least 8 characters, with a letter and a number.
const passwordRule = (field) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name is too long'),
    body('email').trim().isEmail().withMessage('Please enter a valid email'),
    passwordRule('password'),
  ],
  validate,
  register
);
router.post(
  '/verify-otp',
  [body('email').trim().isEmail().withMessage('Please enter a valid email'), body('otp').trim().matches(/^\d{6}$/).withMessage('Enter the 6-digit code')],
  validate,
  verifyOtp
);
router.post('/resend-otp', [body('email').trim().isEmail().withMessage('Please enter a valid email')], validate, resendOtp);
router.post(
  '/login',
  [body('email').trim().isEmail().withMessage('Please enter a valid email'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);
router.post('/logout', logout);
router.get('/me', optionalAuth, getMe); // 200 with user: null for guests, so no 401 noise in the console
router.post('/forgot-password', [body('email').trim().isEmail().withMessage('Please enter a valid email')], validate, forgotPassword);
router.put('/reset-password/:token', [passwordRule('password')], validate, resetPassword);
router.put(
  '/change-password',
  protect,
  [body('currentPassword').notEmpty().withMessage('Current password is required'), passwordRule('newPassword')],
  validate,
  changePassword
);

module.exports = router;
