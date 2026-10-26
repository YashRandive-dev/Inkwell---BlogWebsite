const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Reads the JWT from the httpOnly cookie (or an Authorization header as a fallback).
const getToken = (req) => {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1];
  return null;
};

// Requires a logged-in user.
const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    res.status(401);
    throw new Error('Please log in to continue');
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error('Your session has expired. Please log in again');
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('This account no longer exists');
  }
  req.user = user;
  next();
});

// Attaches req.user when a valid token exists, but never blocks guests.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      req.user = null;
    }
  }
  next();
});

// Must be used after `protect`.
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};

module.exports = { protect, optionalAuth, adminOnly };
