class RedisService {
  constructor(redisClient = null) {
    this.client = redisClient;
    // In-memory fallback for rate limiting and caching
    this.memory = new Map();
  }

  // Helper to get value from memory
  _getMemory(key) {
    const data = this.memory.get(key);
    if (!data) return 0;
    if (data.expiry && Date.now() > data.expiry) {
      this.memory.delete(key);
      return 0;
    }
    return data.value || 0;
  }

  // Helper to increment value in memory
  _incrementMemory(key, windowSeconds = 3600) {
    const data = this.memory.get(key);
    let count = 0;
    if (data && (!data.expiry || Date.now() <= data.expiry)) {
      count = data.value;
    }
    count++;
    const expiry = Date.now() + (windowSeconds * 1000);
    this.memory.set(key, { value: count, expiry });
    return count;
  }

  /**
   * Check if IP is rate limited
   */
  async checkIPRateLimit(ip) {
    const key = `rate-limit:ip:${ip}`;
    return this._getMemory(key);
  }

  /**
   * Increment IP attempt counter
   */
  async incrementIPAttempt(ip, windowSeconds = 3600) {
    const key = `rate-limit:ip:${ip}`;
    return this._incrementMemory(key, windowSeconds);
  }

  /**
   * Reset IP attempt counter
   */
  async resetIPAttempt(ip) {
    const key = `rate-limit:ip:${ip}`;
    this.memory.delete(key);
  }

  /**
   * Check if user email is rate limited
   */
  async checkUserRateLimit(email) {
    const key = `rate-limit:user:${email}`;
    return this._getMemory(key);
  }

  /**
   * Increment user attempt counter
   */
  async incrementUserAttempt(email, windowSeconds = 3600) {
    const key = `rate-limit:user:${email}`;
    return this._incrementMemory(key, windowSeconds);
  }

  /**
   * Reset user attempt counter
   */
  async resetUserAttempt(email) {
    const key = `rate-limit:user:${email}`;
    this.memory.delete(key);
  }

  /**
   * Store OTP in memory (temporary)
   */
  async storeOTP(otpId, otpCode, expirySeconds = 600) {
    const key = `otp:${otpId}`;
    const expiry = Date.now() + (expirySeconds * 1000);
    this.memory.set(key, { value: otpCode, expiry });
  }

  /**
   * Get OTP from memory
   */
  async getOTP(otpId) {
    const key = `otp:${otpId}`;
    const data = this.memory.get(key);
    if (!data) return null;
    if (data.expiry && Date.now() > data.expiry) {
      this.memory.delete(key);
      return null;
    }
    return data.value;
  }

  /**
   * Delete OTP from memory
   */
  async deleteOTP(otpId) {
    const key = `otp:${otpId}`;
    this.memory.delete(key);
  }

  /**
   * Cache login attempt for analytics
   */
  async cacheLoginAttempt(attemptData) {
    const key = `login-attempt:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const expiry = Date.now() + (86400 * 1000); // 24 hours
    this.memory.set(key, { value: attemptData, expiry });
  }

  /**
   * Store failed IP in blacklist temporarily
   */
  async blacklistIP(ip, durationSeconds = 3600) {
    const key = `blacklist:ip:${ip}`;
    const expiry = Date.now() + (durationSeconds * 1000);
    this.memory.set(key, { value: '1', expiry });
  }

  /**
   * Check if IP is blacklisted
   */
  async isIPBlacklisted(ip) {
    const key = `blacklist:ip:${ip}`;
    const data = this.memory.get(key);
    if (!data) return false;
    if (data.expiry && Date.now() > data.expiry) {
      this.memory.delete(key);
      return false;
    }
    return true;
  }
}

module.exports = RedisService;
