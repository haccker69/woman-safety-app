const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getComplaints, updateComplaintStatus, updatePoliceProfile } = require('../controllers/policeController');

// All police routes require authentication and police role
router.use(protect);
router.use(authorize('police'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Profile
router.put('/profile', updatePoliceProfile);

// Complaints
router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaintStatus);

module.exports = router;
