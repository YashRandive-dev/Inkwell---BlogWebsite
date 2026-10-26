require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

// Creates (or updates) your own admin account straight from .env, with no email code needed.
// Set ADMIN_EMAIL, ADMIN_PASSWORD and optionally ADMIN_NAME in server/.env, then run:
//   npm run create-admin
const run = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || 'Site Admin').trim();

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
    process.exit(1);
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('ADMIN_PASSWORD must be at least 8 characters and contain a letter and a number.');
    process.exit(1);
  }

  await connectDB();
  let user = await User.findOne({ email });
  if (user) {
    user.password = password; // hashed by the model before saving
    user.role = 'admin';
    user.isVerified = true;
    if (name) user.name = name;
    await user.save();
    console.log(`Updated existing account. ${email} is now an admin with your new password.`);
  } else {
    await User.create({ name, email, password, role: 'admin', isVerified: true });
    console.log(`Created admin account for ${email}.`);
  }
  console.log('You can now delete ADMIN_PASSWORD from server/.env.');
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
