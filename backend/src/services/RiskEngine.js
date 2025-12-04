const moment = require('moment');
const GeolocationService = require('./GeolocationService');

class RiskEngine {
  /**
   * Calculate risk score based on multiple factors
   * Risk Score: 0-30 (Safe), 31-70 (Warning), 71-100 (Critical)
   */
  async calculateRiskScore(loginMetadata, userHistory) {
    let riskScore = 0;
    const reasons = [];

    const {
      ip,
      userAgent,
      deviceFingerprint,
      currentLocation,
      timestamp,
      failedAttemptsBefore,
    } = loginMetadata;

    const { lastLogin, deviceHistory, locationHistory } = userHistory;

    // 1. New Device Detection (+30 points)
    const isNewDevice = !deviceHistory.some((d) => d.deviceFingerprint === deviceFingerprint);
    if (isNewDevice && deviceHistory.length > 0) {
      riskScore += 30;
      reasons.push('new_device');
    }

    // 2. New Location Detection (+25 points)
    const isNewLocation = !locationHistory.some(
      (l) => l.country === currentLocation.country && l.city === currentLocation.city
    );
    if (isNewLocation && locationHistory.length > 0) {
      riskScore += 25;
      reasons.push('new_location');
    }

    // 3. Impossible Travel Detection (+40 points)
    const isImpossibleTravel = this.detectImpossibleTravel(lastLogin, currentLocation, timestamp);
    if (isImpossibleTravel) {
      riskScore += 40;
      reasons.push('impossible_travel');
    }

    // 4. Odd Login Time (+10 points)
    const isOddLoginTime = this.detectOddLoginTime(timestamp);
    if (isOddLoginTime) {
      riskScore += 10;
      reasons.push('odd_login_time');
    }

    // 5. Failed Attempts Before Success (+10 points)
    if (failedAttemptsBefore > 0) {
      riskScore += Math.min(failedAttemptsBefore * 5, 15);
      reasons.push(`failed_attempts_${failedAttemptsBefore}`);
    }

    // 6. IP Reputation Check (+20 points)
    const isIPFlagged = await this.checkIPReputation(ip, locationHistory);
    if (isIPFlagged) {
      riskScore += 20;
      reasons.push('flagged_ip');
    }

    // 7. Browser/OS Change after New Location (+15 points)
    if (isNewLocation && isNewDevice) {
      riskScore += 15;
      reasons.push('new_device_and_location_combination');
    }

    // Cap the risk score at 100
    riskScore = Math.min(riskScore, 100);

    return {
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      reasons,
      factors: {
        isNewDevice,
        isNewLocation,
        isImpossibleTravel,
        isOddLoginTime,
        failedAttempts: failedAttemptsBefore,
        isIPFlagged,
      },
    };
  }

  /**
   * Detect impossible travel: Can't travel more than ~900 km/hour
   * Using ~15 km/minute as threshold
   */
  detectImpossibleTravel(lastLogin, currentLocation, currentTimestamp) {
    if (!lastLogin || !lastLogin.timestamp) {
      return false;
    }

    const timeDiffMinutes = (currentTimestamp - lastLogin.timestamp) / (1000 * 60);
    if (timeDiffMinutes < 5) {
      // Must be less than 5 minutes to be considered suspicious
      return false;
    }

    if (timeDiffMinutes > 1440) {
      // More than 24 hours, not impossible
      return false;
    }

    const distance = GeolocationService.calculateDistance(
      lastLogin.latitude || 0,
      lastLogin.longitude || 0,
      currentLocation.latitude,
      currentLocation.longitude
    );

    const speedRequired = distance / (timeDiffMinutes / 60); // km/hour
    const speedThreshold = 900; // km/hour (approximately max commercial flight speed)

    return speedRequired > speedThreshold;
  }

  /**
   * Detect odd login times (e.g., 2 AM to 4 AM)
   */
  detectOddLoginTime(timestamp) {
    const hour = moment(timestamp).hour();
    const oddHours = [2, 3, 4]; // 2 AM to 4 AM
    return oddHours.includes(hour);
  }

  /**
   * Check if IP has been flagged in the past 30 days
   */
  async checkIPReputation(ip, locationHistory) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const flaggedInPast30Days = locationHistory.some((loc) => {
      return loc.ip === ip && new Date(loc.timestamp) > thirtyDaysAgo;
    });
    return flaggedInPast30Days;
  }

  /**
   * Determine risk level based on score
   */
  getRiskLevel(riskScore) {
    if (riskScore <= 30) return 'safe';
    if (riskScore <= 70) return 'warning';
    return 'critical';
  }

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(riskScore) {
    if (riskScore <= 30) return 'green';
    if (riskScore <= 70) return 'yellow';
    return 'red';
  }

  /**
   * Human-readable reason descriptions
   */
  getReasonDescription(reason) {
    const descriptions = {
      new_device: 'Login from a new or unrecognized device',
      new_location: 'Login from a new geographic location',
      impossible_travel: 'Impossible travel detected (too fast between locations)',
      odd_login_time: 'Login at unusual time of day',
      failed_attempts_1: '1 failed login attempt before success',
      failed_attempts_2: '2 failed login attempts before success',
      failed_attempts_3: '3+ failed login attempts before success',
      flagged_ip: 'IP address previously flagged as suspicious',
      new_device_and_location_combination: 'New device and location combination',
      velocity_limit: 'Too many login attempts in short time',
    };
    return descriptions[reason] || reason;
  }
}

module.exports = new RiskEngine();
