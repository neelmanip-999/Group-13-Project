const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const OTP = require('../models/OTP');
const SuspiciousEvent = require('../models/SuspiciousEvent');
const RiskEngine = require('../services/RiskEngine');
const GeolocationService = require('../services/GeolocationService');
const DeviceService = require('../services/DeviceService');
const EmailService = require('../services/EmailService');
const RedisService = require('../services/RedisService');
const { generateToken } = require('../utils/jwt');
const { generateOTP, formatTimestamp } = require('../utils/helpers');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email, password, firstName, and lastName',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
      });

      await newUser.save();

      // Generate token
      const token = generateToken(newUser._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with Risk Assessment
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { ip, userAgent, timestamp, acceptLanguage } = req.metadata;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
      }

      // Check if IP is blacklisted
      const isBlacklisted = await this.redisService.isIPBlacklisted(ip);
      if (isBlacklisted) {
        return res.status(429).json({
          success: false,
          message: 'Your IP has been temporarily blocked due to multiple failed attempts',
        });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if account is locked
      if (user.isLocked && user.lockUntil > new Date()) {
        return res.status(423).json({
          success: false,
          message: `Account is locked until ${formatTimestamp(user.lockUntil)}`,
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      // Get device info
      const deviceInfo = DeviceService.parseUserAgent(userAgent);
      const deviceFingerprint = DeviceService.generateDeviceFingerprint(userAgent, ip, acceptLanguage);

      // Get geolocation
      const location = await GeolocationService.getLocationFromIP(ip);

      // Create login attempt record (will be updated with risk score)
      let loginAttempt = new LoginAttempt({
        email: user.email,
        userId: user._id,
        ip,
        userAgent,
        deviceFingerprint,
        ...deviceInfo,
        location,
        timestamp,
        loginTime: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false }).substring(0, 5),
      });

      // If password is invalid, increment counters
      if (!isPasswordValid) {
        loginAttempt.status = 'failed';

        // Increment IP attempt counter
        const ipAttempts = await this.redisService.incrementIPAttempt(ip);
        const userAttempts = await this.redisService.incrementUserAttempt(email);

        const velocityLimit = parseInt(process.env.VELOCITY_LIMIT || 5);

        if (ipAttempts >= velocityLimit) {
          loginAttempt.ipRateLimited = true;
          loginAttempt.riskScore = 100;
          loginAttempt.riskLevel = 'critical';
          loginAttempt.reason = ['velocity_limit_exceeded', 'brute_force'];

          // Blacklist IP for 1 hour
          await this.redisService.blacklistIP(ip, 3600);

          // Log suspicious event
          await SuspiciousEvent.create({
            userId: user._id,
            email: user.email,
            type: 'brute_force',
            severity: 'critical',
            details: {
              failedAttempts: ipAttempts,
              ip,
              location,
            },
            ip,
            location,
          });
        }

        if (userAttempts >= velocityLimit) {
          loginAttempt.userRateLimited = true;

          // Lock account for 30 minutes
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
          await User.updateOne(
            { _id: user._id },
            {
              isLocked: true,
              lockUntil,
              lockReason: 'Multiple failed login attempts',
            }
          );

          // Send account locked email
          await EmailService.sendAccountLockedAlert(
            user.email,
            'Multiple failed login attempts detected'
          );

          // Log suspicious event
          await SuspiciousEvent.create({
            userId: user._id,
            email: user.email,
            type: 'account_locked',
            severity: 'high',
            details: {
              reason: 'Multiple failed attempts',
              failedAttempts: userAttempts,
            },
            ip,
            location,
          });
        }

        await loginAttempt.save();

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Password is valid - Calculate risk score
      const riskAssessment = await RiskEngine.calculateRiskScore(
        {
          ip,
          userAgent,
          deviceFingerprint,
          currentLocation: location,
          timestamp,
          failedAttemptsBefore: user.failedAttempts || 0,
        },
        {
          lastLogin: user.lastLogin,
          deviceHistory: user.deviceHistory,
          locationHistory: user.locationHistory,
        }
      );

      loginAttempt.riskScore = riskAssessment.riskScore;
      loginAttempt.riskLevel = riskAssessment.riskLevel;
      loginAttempt.reason = riskAssessment.reasons;
      loginAttempt.isNewDevice = riskAssessment.factors.isNewDevice;
      loginAttempt.isNewLocation = riskAssessment.factors.isNewLocation;
      loginAttempt.isImpossibleTravel = riskAssessment.factors.isImpossibleTravel;
      loginAttempt.isOddLoginTime = riskAssessment.factors.isOddLoginTime;

      // Reset failed attempts
      await User.updateOne({ _id: user._id }, { failedAttempts: 0 });

      // Handle based on risk level
      if (riskAssessment.riskLevel === 'critical') {
        // Block login
        loginAttempt.status = 'blocked';
        await loginAttempt.save();

        // Lock account for 1 hour
        const lockUntil = new Date(Date.now() + 60 * 60 * 1000);
        await User.updateOne(
          { _id: user._id },
          {
            isLocked: true,
            lockUntil,
            lockReason: 'High-risk login attempt detected',
          }
        );

        // Send alert email
        await EmailService.sendSuspiciousLoginAlert(user.email, {
          city: location.city,
          country: location.country,
          browser: deviceInfo.browser,
          timestamp: formatTimestamp(timestamp),
        });

        // Log suspicious event
        await SuspiciousEvent.create({
          userId: user._id,
          email: user.email,
          type: 'high_risk_login',
          severity: 'critical',
          details: riskAssessment,
          ip,
          location,
        });

        return res.status(423).json({
          success: false,
          message: 'Your account has been locked due to suspicious activity. Please check your email.',
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
        });
      } else if (riskAssessment.riskLevel === 'warning') {
        // Send OTP for verification
        const otp = generateOTP(6);

        const otpRecord = new OTP({
          userId: user._id,
          email: user.email,
          code: otp,
          loginAttemptId: loginAttempt._id,
        });
        await otpRecord.save();

        // Send OTP email
        await EmailService.sendOTPEmail(user.email, otp);

        loginAttempt.status = 'otp_pending';
        loginAttempt.otpSent = true;
        await loginAttempt.save();

        return res.status(200).json({
          success: true,
          message: 'OTP sent to your email. Please verify to continue.',
          requiresOTP: true,
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          reasons: riskAssessment.reasons.map((r) => RiskEngine.getReasonDescription(r)),
          loginAttemptId: loginAttempt._id,
        });
      } else {
        // Safe login - allow
        loginAttempt.status = 'success';
        await loginAttempt.save();

        // Update user's last login info
        await User.updateOne(
          { _id: user._id },
          {
            lastLogin: { timestamp, ip, city: location.city, country: location.country },
            lastLocation: location,
          }
        );

        // Add device to history if new
        if (riskAssessment.factors.isNewDevice) {
          await User.updateOne(
            { _id: user._id },
            {
              $push: {
                deviceHistory: {
                  deviceFingerprint,
                  ...deviceInfo,
                  lastUsed: timestamp,
                  isVerified: true,
                },
              },
            }
          );
        }

        // Add location to history if new
        if (riskAssessment.factors.isNewLocation) {
          await User.updateOne(
            { _id: user._id },
            {
              $push: {
                locationHistory: {
                  ip,
                  city: location.city,
                  country: location.country,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  timestamp,
                },
              },
            }
          );
        }

        // Generate JWT token
        const token = generateToken(user._id);

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req, res, next) {
    try {
      const { loginAttemptId, code } = req.body;

      if (!loginAttemptId || !code) {
        return res.status(400).json({
          success: false,
          message: 'Please provide loginAttemptId and OTP code',
        });
      }

      // Find login attempt
      const loginAttempt = await LoginAttempt.findById(loginAttemptId);
      if (!loginAttempt) {
        return res.status(404).json({
          success: false,
          message: 'Login attempt not found',
        });
      }

      // Find OTP record
      const otpRecord = await OTP.findOne({
        loginAttemptId: loginAttemptId,
        email: loginAttempt.email,
      });

      if (!otpRecord) {
        return res.status(404).json({
          success: false,
          message: 'OTP not found or expired',
        });
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          success: false,
          message: 'Too many OTP verification attempts. Please request a new OTP.',
        });
      }

      // Verify code
      if (otpRecord.code !== code) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`,
        });
      }

      // OTP verified
      otpRecord.isVerified = true;
      await otpRecord.save();

      // Update login attempt
      loginAttempt.status = 'otp_verified';
      loginAttempt.otpVerified = true;
      await loginAttempt.save();

      // Find user
      const user = await User.findById(loginAttempt.userId);

      // Update user's last login info
      const location = loginAttempt.location;
      await User.updateOne(
        { _id: user._id },
        {
          lastLogin: { timestamp: loginAttempt.timestamp, ip: loginAttempt.ip, city: location.city, country: location.country },
          lastLocation: location,
        }
      );

      // Add device to history if new
      if (loginAttempt.isNewDevice) {
        await User.updateOne(
          { _id: user._id },
          {
            $push: {
              deviceHistory: {
                deviceFingerprint: loginAttempt.deviceFingerprint,
                deviceName: loginAttempt.deviceName,
                browser: loginAttempt.browser,
                os: loginAttempt.os,
                lastUsed: loginAttempt.timestamp,
                isVerified: true,
              },
            },
          }
        );
      }

      // Add location to history if new
      if (loginAttempt.isNewLocation) {
        await User.updateOne(
          { _id: user._id },
          {
            $push: {
              locationHistory: {
                ip: loginAttempt.ip,
                city: location.city,
                country: location.country,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: loginAttempt.timestamp,
              },
            },
          }
        );
      }

      // Generate JWT token
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully. Login confirmed.',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Set redis service
  setRedisService(redisService) {
    this.redisService = redisService;
  }
}

module.exports = new AuthController();
