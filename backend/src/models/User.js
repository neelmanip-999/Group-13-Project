const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  deviceHistory: [{
    deviceFingerprint: String,
    deviceName: String,
    browser: String,
    os: String,
    lastUsed: Date,
    isVerified: { type: Boolean, default: false },
  }],
  locationHistory: [{
    ip: String,
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
    timestamp: Date,
  }],
  lastLogin: {
    timestamp: Date,
    ip: String,
    city: String,
    country: String,
  },
  lastLocation: {
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockReason: String,
  lockUntil: Date,
  failedAttempts: {
    type: Number,
    default: 0,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
