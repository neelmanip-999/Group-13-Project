const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 */
function generateToken(userId, expiresIn = process.env.JWT_EXPIRE) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT token without verification
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
