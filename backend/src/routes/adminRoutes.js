const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/login-attempts', (req, res, next) => AdminController.getLoginAttempts(req, res, next));
router.get('/suspicious-events', (req, res, next) => AdminController.getSuspiciousEvents(req, res, next));
router.get('/dashboard-stats', (req, res, next) => AdminController.getDashboardStats(req, res, next));
router.get('/location-data', (req, res, next) => AdminController.getLocationData(req, res, next));
router.get('/user/:userId', (req, res, next) => AdminController.getUserDetails(req, res, next));
router.put('/resolve-event/:eventId', (req, res, next) => AdminController.resolveSuspiciousEvent(req, res, next));
router.put('/unlock-user/:userId', (req, res, next) => AdminController.unlockUserAccount(req, res, next));

module.exports = router;
