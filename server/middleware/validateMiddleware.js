const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// Runs after express-validator chains. Responds 400 with the first problem found.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: errors[0].message, data: { errors } });
};

// Rejects malformed ObjectIds in route params, e.g. validateObjectId('id').
const validateObjectId = (...params) => (req, res, next) => {
  for (const name of params) {
    if (!mongoose.isValidObjectId(req.params[name])) {
      return res.status(400).json({ success: false, message: `Invalid ${name}`, data: null });
    }
  }
  next();
};

module.exports = { validate, validateObjectId };
