require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const metadataMiddleware = require('./middleware/metadataMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const AuthController = require('./controllers/AuthController');
const RedisService = require('./services/RedisService');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(metadataMiddleware);

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud-detection';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    console.error('Note: Using in-memory data storage. Data will not persist after restart.');
  }
};

// Initialize Redis Service (in-memory fallback)
let redisService = new RedisService(null);
console.log('✓ Using in-memory service for rate limiting and OTP storage');
AuthController.setRedisService(redisService);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   POST   /api/auth/register      - Register new user`);
      console.log(`   POST   /api/auth/login         - Login with fraud detection`);
      console.log(`   POST   /api/auth/verify-otp    - Verify OTP`);
      console.log(`   GET    /api/auth/me            - Get current user`);
      console.log(`   GET    /api/admin/login-attempts - Get login attempts`);
      console.log(`   GET    /api/admin/suspicious-events - Get suspicious events`);
      console.log(`   GET    /api/admin/dashboard-stats - Get dashboard statistics`);
      console.log(`   GET    /api/admin/location-data - Get location markers for map`);
      console.log(`   GET    /api/admin/user/:userId - Get user details`);
      console.log(`   PUT    /api/admin/resolve-event/:eventId - Resolve event`);
      console.log(`   PUT    /api/admin/unlock-user/:userId - Unlock user\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
