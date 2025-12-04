const mongoose = require('mongoose');

const suspiciousEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  email: String,
  type: {
    type: String,
    enum: [
      'brute_force',
      'impossible_travel',
      'new_device',
      'new_location',
      'velocity_limit_exceeded',
      'account_locked',
      'high_risk_login',
      'odd_login_time',
    ],
  },
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  location: {
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: Date,
  resolvedBy: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

suspiciousEventSchema.index({ email: 1, timestamp: -1 });
suspiciousEventSchema.index({ severity: 1 });
suspiciousEventSchema.index({ timestamp: -1 });
suspiciousEventSchema.index({ resolved: 1 });

module.exports = mongoose.model('SuspiciousEvent', suspiciousEventSchema);
