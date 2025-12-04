const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', (req, res, next) => AuthController.register(req, res, next));
router.post('/login', (req, res, next) => AuthController.login(req, res, next));
router.post('/verify-otp', (req, res, next) => AuthController.verifyOTP(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => AuthController.getCurrentUser(req, res, next));

module.exports = router;
