const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { sendResponse } = require('../utils/response');
const { generateToken, clearToken } = require('../utils/generateToken');

// The user shape sent to the client (never includes the password).
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  role: user.role,
  isVerified: user.isVerified !== false,
  socialLinks: user.socialLinks,
  bookmarks: (user.bookmarks || []).map(String),
  createdAt: user.createdAt,
});

const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const isProd = () => process.env.NODE_ENV === 'production';

// Emails a fresh 6-digit code to the user.
const sendOtpEmail = async (user) => {
  const otp = user.createOtp();
  await user.save({ validateBeforeSave: false });
  const text = `Hi ${user.name},\n\nYour Inkwell verification code is ${otp}.\nIt expires in 10 minutes. If you didn't create an account, ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#faf6f1;border-radius:16px">
    <h2 style="margin:0 0 8px;color:#1f1917">Verify your email</h2>
    <p style="color:#5f5249">Hi ${user.name}, enter this code in Inkwell to finish creating your account:</p>
    <p style="font-size:34px;letter-spacing:10px;font-weight:700;color:#d4421c;margin:24px 0">${otp}</p>
    <p style="color:#7e6f62;font-size:13px">This code expires in 10 minutes. If you didn't create an account, you can ignore this email.</p></div>`;
  await sendEmail({ to: user.email, subject: `${otp} is your Inkwell verification code`, text, html });
  return otp;
};

// Sends the code. Returns { devOtp } only while developing and only when email could not be
// delivered (SMTP missing or failing), so you are never stuck on the verify screen locally.
// In production a delivery failure is reported as an error instead.
const deliverOtp = async (user, res) => {
  try {
    const otp = await sendOtpEmail(user);
    return !process.env.SMTP_HOST && !isProd() ? { devOtp: otp } : {};
  } catch (error) {
    console.error(`[email] Could not send verification email: ${error.message}`);
    if (!isProd() && user.otpHash) {
      // The code was already saved before the send failed – look it up again by re-issuing.
      const otp = user.createOtp();
      await user.save({ validateBeforeSave: false });
      console.error(`[email] Dev fallback – verification code for ${user.email}: ${otp}`);
      return { devOtp: otp, emailError: error.message };
    }
    res.status(500);
    throw new Error('We could not send the verification email. Please try again shortly');
  }
};

// POST /api/auth/register  – creates an unverified account and emails a code
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user && user.isVerified !== false) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }
  if (user) {
    // Unverified account re-registering: refresh details and send a new code.
    user.name = name;
    user.password = password;
  } else {
    // The address in ADMIN_EMAIL becomes an admin. It still has to verify the emailed code first,
    // so only the owner of that inbox can ever use the role.
    const isOwner = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase();
    user = new User({ name, email, password, isVerified: false, role: isOwner ? 'admin' : 'user' });
  }
  // EMAIL_VERIFICATION=off skips the code step entirely (handy if you have no email service yet).
  if (process.env.EMAIL_VERIFICATION === 'off') {
    user.isVerified = true;
    await user.save();
    generateToken(res, user._id);
    return sendResponse(res, 201, 'Welcome to Inkwell!', { user: formatUser(user), requiresVerification: false });
  }
  await user.save();
  const extra = await deliverOtp(user, res);
  sendResponse(res, 201, 'We emailed you a 6-digit verification code', { email: user.email, requiresVerification: true, ...extra });
});

// POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+otpHash +otpExpire +otpAttempts');
  if (!user || !user.otpHash) {
    res.status(400);
    throw new Error('No active code. Please request a new one');
  }
  if (user.otpExpire < Date.now()) {
    res.status(400);
    throw new Error('That code has expired. Please request a new one');
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    res.status(429);
    throw new Error('Too many wrong attempts. Please request a new code');
  }
  if (!user.matchOtp(otp)) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error(`Incorrect code. ${Math.max(0, MAX_OTP_ATTEMPTS - user.otpAttempts)} attempts left`);
  }
  user.isVerified = true;
  user.clearOtp();
  await user.save({ validateBeforeSave: false });
  generateToken(res, user._id);
  sendResponse(res, 200, 'Email verified. Welcome to Inkwell!', { user: formatUser(user) });
});

// POST /api/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+otpSentAt');
  // Same answer whether or not the account exists, so emails can't be probed.
  const generic = 'If that account needs verification, a new code has been sent';
  if (!user || user.isVerified !== false) return sendResponse(res, 200, generic);
  if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < RESEND_COOLDOWN_MS) {
    res.status(429);
    throw new Error('Please wait a minute before requesting another code');
  }
  const extra = await deliverOtp(user, res);
  sendResponse(res, 200, generic, extra);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otpSentAt');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (user.isVerified === false) {
    const recentlySent = user.otpSentAt && Date.now() - user.otpSentAt.getTime() < RESEND_COOLDOWN_MS;
    const extra = recentlySent ? {} : await deliverOtp(user, res);
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first. We sent you a code',
      data: { requiresVerification: true, email: user.email, ...extra },
    });
  }
  generateToken(res, user._id);
  sendResponse(res, 200, 'Logged in successfully', { user: formatUser(user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  clearToken(res);
  sendResponse(res, 200, 'Logged out');
});

// GET /api/auth/me  – used by the client to restore the session on refresh
const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, 'Current user', { user: req.user ? formatUser(req.user) : null });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const genericMessage = 'If that email is registered, a reset link has been sent';
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) return sendResponse(res, 200, genericMessage);

  const rawToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  const text = `Hi ${user.name},\n\nYou asked to reset your Inkwell password. Use the link below (valid for 30 minutes):\n\n${resetUrl}\n\nIf this wasn't you, you can safely ignore this email.`;
  const html = `<p>Hi ${user.name},</p><p>You asked to reset your Inkwell password. The link below is valid for 30 minutes:</p><p><a href="${resetUrl}">Reset my password</a></p><p>If this wasn't you, you can safely ignore this email.</p>`;

  try {
    await sendEmail({ to: user.email, subject: 'Reset your Inkwell password', text, html });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Could not send the reset email. Please try again later');
  }
  sendResponse(res, 200, genericMessage);
});

// PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }
  user.password = req.body.password;
  user.isVerified = true; // they proved they own the inbox
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  generateToken(res, user._id);
  sendResponse(res, 200, 'Password updated', { user: formatUser(user) });
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, 'Password changed successfully');
});

module.exports = { register, verifyOtp, resendOtp, login, logout, getMe, forgotPassword, resetPassword, changePassword, formatUser };
