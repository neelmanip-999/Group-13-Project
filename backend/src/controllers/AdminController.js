const LoginAttempt = require('../models/LoginAttempt');
const SuspiciousEvent = require('../models/SuspiciousEvent');
const User = require('../models/User');

class AdminController {
  /**
   * Get all login attempts with filters
   */
  async getLoginAttempts(req, res, next) {
    try {
      const { page = 1, limit = 50, riskLevel, country, email, sortBy = '-timestamp' } = req.query;

      const filter = {};
      if (riskLevel) filter.riskLevel = riskLevel;
      if (country) filter['location.country'] = country;
      if (email) filter.email = new RegExp(email, 'i');

      const skip = (page - 1) * limit;

      const attempts = await LoginAttempt.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await LoginAttempt.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: attempts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get suspicious events
   */
  async getSuspiciousEvents(req, res, next) {
    try {
      const { page = 1, limit = 50, severity, type, resolved } = req.query;

      const filter = {};
      if (severity) filter.severity = severity;
      if (type) filter.type = type;
      if (resolved !== undefined) filter.resolved = resolved === 'true';

      const skip = (page - 1) * limit;

      const events = await SuspiciousEvent.find(filter)
        .sort('-timestamp')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await SuspiciousEvent.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Login attempts stats
      const totalAttempts = await LoginAttempt.countDocuments();
      const attemptsLastHour = await LoginAttempt.countDocuments({ timestamp: { $gt: lastHour } });
      const attemptsLast24Hours = await LoginAttempt.countDocuments({ timestamp: { $gt: last24Hours } });
      const attemptsLast7Days = await LoginAttempt.countDocuments({ timestamp: { $gt: last7Days } });

      // Risk level distribution
      const riskDistribution = await LoginAttempt.aggregate([
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 },
          },
        },
      ]);

      // Status distribution
      const statusDistribution = await LoginAttempt.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      // Top countries
      const topCountries = await LoginAttempt.aggregate([
        {
          $group: {
            _id: '$location.country',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      // Suspicious events stats
      const totalEvents = await SuspiciousEvent.countDocuments();
      const unResolvedEvents = await SuspiciousEvent.countDocuments({ resolved: false });

      // Hourly login attempts (last 24 hours)
      const hourlyAttempts = await LoginAttempt.aggregate([
        {
          $match: { timestamp: { $gt: last24Hours } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // High-risk attempts
      const highRiskAttempts = await LoginAttempt.countDocuments({ riskLevel: 'critical' });

      // Locked accounts
      const lockedAccounts = await User.countDocuments({ isLocked: true });

      res.status(200).json({
        success: true,
        stats: {
          loginAttempts: {
            total: totalAttempts,
            lastHour: attemptsLastHour,
            last24Hours: attemptsLast24Hours,
            last7Days: attemptsLast7Days,
          },
          riskDistribution: Object.fromEntries(riskDistribution.map((r) => [r._id, r.count])),
          statusDistribution: Object.fromEntries(statusDistribution.map((s) => [s._id, s.count])),
          topCountries,
          suspiciousEvents: {
            total: totalEvents,
            unResolved: unResolvedEvents,
          },
          highRiskAttempts,
          lockedAccounts,
          hourlyAttempts,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get login attempts by location for map
   */
  async getLocationData(req, res, next) {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const attempts = await LoginAttempt.find({
        timestamp: { $gt: last24Hours },
      })
        .select('location riskLevel status email')
        .limit(1000);

      const markers = attempts
        .filter((a) => a.location && a.location.latitude && a.location.longitude)
        .map((a) => ({
          lat: a.location.latitude,
          lng: a.location.longitude,
          riskLevel: a.riskLevel,
          status: a.status,
          email: a.email,
          city: a.location.city,
          country: a.location.country,
        }));

      res.status(200).json({
        success: true,
        markers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user details with login history
   */
  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const loginHistory = await LoginAttempt.find({ userId }).sort('-timestamp').limit(20);
      const suspiciousEvents = await SuspiciousEvent.find({ userId }).sort('-timestamp').limit(10);

      res.status(200).json({
        success: true,
        user,
        loginHistory,
        suspiciousEvents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve suspicious event
   */
  async resolveSuspiciousEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const { resolvedBy } = req.body;

      const event = await SuspiciousEvent.findByIdAndUpdate(
        eventId,
        {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
        },
        { new: true }
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Event resolved',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlock user account
   */
  async unlockUserAccount(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isLocked: false,
          lockReason: null,
          lockUntil: null,
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User account unlocked',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
