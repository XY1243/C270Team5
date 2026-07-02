const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const controller = require('../controllers/admin.controller');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/events/pending', controller.listPendingEvents);
router.patch('/events/:id/approve', controller.approveEvent);
router.patch('/events/:id/reject', controller.rejectEvent);
router.get('/users', controller.listUsers);
router.patch('/users/:id/suspend', controller.suspendUser);
router.patch('/users/:id/reactivate', controller.reactivateUser);
router.get('/analytics', controller.getAnalytics);

module.exports = router;
