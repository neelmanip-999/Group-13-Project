/**
 * Metadata capture middleware
 */
function metadataMiddleware(req, res, next) {
  req.metadata = {
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown',
    timestamp: new Date(),
    acceptLanguage: req.headers['accept-language'] || '',
  };
  next();
}

module.exports = metadataMiddleware;
