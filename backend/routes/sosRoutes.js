const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  updateLocation,
  getLocation,
  triggerSOS,
  getUserActiveAlert,
  getActiveSOSAlerts,
  assignOfficersManual,
  resolveSOSAlert,
  cancelSOSAlert,
  getPoliceAssignedAlerts
} = require('../controllers/sosController');

// All routes are protected and only for users
router.use(protect);

// User routes
router.route('/location')
  .get(authorize('user'), getLocation)
  .put(authorize('user'), updateLocation);

router.post('/alert', authorize('user'), triggerSOS);
router.get('/alert/active', authorize('user'), getUserActiveAlert);
router.put('/alerts/:id/cancel', authorize('user', 'admin'), cancelSOSAlert);

// Police routes
router.get('/alerts/police/assigned', authorize('police'), getPoliceAssignedAlerts);

// Admin routes
router.get('/alerts', authorize('admin'), getActiveSOSAlerts);
router.put('/alerts/:id/assign-officers', authorize('admin'), assignOfficersManual);
router.put('/alerts/:id/resolve', authorize('admin'), resolveSOSAlert);

module.exports = router;
