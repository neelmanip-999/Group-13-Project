const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  email: String,
  ip: String,
  userAgent: String,
  deviceFingerprint: String,
  deviceName: String,
  browser: String,
  os: String,
  location: {
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ['safe', 'warning', 'critical'],
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'blocked', 'otp_pending', 'otp_verified'],
  },
  reason: [String], // Array of reasons for risk factors
  otpSent: { type: Boolean, default: false },
  otpVerified: { type: Boolean, default: false },
  ipRateLimited: { type: Boolean, default: false },
  userRateLimited: { type: Boolean, default: false },
  isNewDevice: Boolean,
  isNewLocation: Boolean,
  isImpossibleTravel: Boolean,
  isOddLoginTime: Boolean,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  loginTime: String, // "HH:MM" format
});

loginAttemptSchema.index({ email: 1, timestamp: -1 });
loginAttemptSchema.index({ ip: 1, timestamp: -1 });
loginAttemptSchema.index({ riskScore: 1 });
loginAttemptSchema.index({ timestamp: -1 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
