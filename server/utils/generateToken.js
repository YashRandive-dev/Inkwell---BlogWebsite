const jwt = require('jsonwebtoken');

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    // Frontend and backend live on different domains in production, so the cookie must be "none".
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};

// "7d" -> 7 days in milliseconds (defaults to 7 days).
const cookieMaxAge = () => {
  const days = parseInt(process.env.JWT_EXPIRE, 10);
  return (Number.isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000;
};

// Signs a JWT and stores it in an httpOnly cookie.
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
  res.cookie('token', token, { ...cookieOptions(), maxAge: cookieMaxAge() });
  return token;
};

const clearToken = (res) => {
  res.cookie('token', '', { ...cookieOptions(), expires: new Date(0) });
};

module.exports = { generateToken, clearToken };
