const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    avatar: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    bio: { type: String, default: '', maxlength: 300 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    socialLinks: {
      twitter: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    // Email verification. Accounts created before this field existed count as verified.
    isVerified: { type: Boolean, default: true }, // register() sets false explicitly
    otpHash: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpSentAt: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash the password whenever it changes.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Creates a reset token. The raw token is emailed; only its hash is stored.
userSchema.methods.createResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return rawToken;
};

const hashOtp = (otp) =>
  crypto.createHash('sha256').update(`${otp}${process.env.JWT_SECRET || ''}`).digest('hex');

// Creates a 6-digit code valid for 10 minutes. Only its hash is stored.
userSchema.methods.createOtp = function () {
  const otp = String(crypto.randomInt(100000, 1000000));
  this.otpHash = hashOtp(otp);
  this.otpExpire = Date.now() + 10 * 60 * 1000;
  this.otpAttempts = 0;
  this.otpSentAt = new Date();
  return otp;
};

userSchema.methods.matchOtp = function (otp) {
  return !!this.otpHash && this.otpHash === hashOtp(String(otp));
};

userSchema.methods.clearOtp = function () {
  this.otpHash = undefined;
  this.otpExpire = undefined;
  this.otpAttempts = 0;
  this.otpSentAt = undefined;
};

module.exports = mongoose.model('User', userSchema);
