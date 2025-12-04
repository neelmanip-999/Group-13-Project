const axios = require('axios');

class GeolocationService {
  async getLocationFromIP(ip) {
    try {
      // Skip private IPs
      if (this.isPrivateIP(ip)) {
        return {
          city: 'Local',
          country: 'Private Network',
          latitude: 0,
          longitude: 0,
          ip: ip,
        };
      }

      // Use ipinfo.io (free tier)
      const response = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY || ''}`);
      const { city, country, loc } = response.data;
      const [latitude, longitude] = (loc || '0,0').split(',');

      return {
        city: city || 'Unknown',
        country: country || 'Unknown',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        ip: ip,
      };
    } catch (error) {
      console.error('Geolocation error:', error.message);
      return {
        city: 'Unknown',
        country: 'Unknown',
        latitude: 0,
        longitude: 0,
        ip: ip,
      };
    }
  }

  isPrivateIP(ip) {
    const privateRanges = [
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];
    return privateRanges.some((range) => range.test(ip));
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance between two coordinates in km
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new GeolocationService();
