const UAParser = require('ua-parser-js');
const crypto = require('crypto');

class DeviceService {
  parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
      device: result.device.type || 'desktop',
      deviceName: result.device.name || 'Desktop Device',
    };
  }

  generateDeviceFingerprint(userAgent, ip, acceptLanguage) {
    // Create a hash of device characteristics
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}${ip}${acceptLanguage}`)
      .digest('hex');
    return fingerprint;
  }

  getDeviceIdentifier(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    return `${result.browser.name || 'Unknown'}_${result.os.name || 'Unknown'}`;
  }
}

module.exports = new DeviceService();
