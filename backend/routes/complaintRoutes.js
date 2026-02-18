const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createComplaint,
  getUserComplaints,
  getStationComplaints,
  updateComplaintStatus,
  getAllComplaints,
  getEmergencyLocations
} = require('../controllers/complaintController');

// User routes
router.post('/', protect, authorize('user'), createComplaint);
router.get('/my-complaints', protect, authorize('user'), getUserComplaints);

// Police routes
router.get('/station', protect, authorize('police'), getStationComplaints);
router.put('/:id/status', protect, authorize('police'), updateComplaintStatus);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllComplaints);
router.get('/emergency-locations', protect, authorize('admin'), getEmergencyLocations);

module.exports = router;
