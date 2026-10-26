require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

// Usage: npm run make-admin -- you@example.com
// Promotes an existing account to admin (use "--remove" after the email to demote).
const run = async () => {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const demote = process.argv.includes('--remove');
  if (!email) {
    console.error('Please pass an email: npm run make-admin -- you@example.com');
    process.exit(1);
  }
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: demote ? 'user' : 'admin' }, { new: true });
  if (!user) console.error(`No account found for ${email}. Register on the site first, then run this again.`);
  else console.log(`${user.email} is now ${user.role === 'admin' ? 'an admin' : 'a regular user'}.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
