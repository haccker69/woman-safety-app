const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNearbyStations,
  getAllStations,
  getAllStationsPublic,
  createStation,
  createPoliceAccount
} = require('../controllers/stationController');

// Public/User routes
router.get('/nearby', protect, authorize('user'), getNearbyStations);
router.get('/all', getAllStationsPublic); // Public route for users to get all stations

// Admin routes
router.route('/')
  .get(protect, authorize('admin'), getAllStations)
  .post(protect, authorize('admin'), createStation);

router.post('/create-police', protect, authorize('admin'), createPoliceAccount);

module.exports = router;
