const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTrip,
  findTrips,
  getMyTrips,
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelTrip,
  completeTrip
} = require('../controllers/travelBuddyController');

// All routes require authentication and user role
router.use(protect);
router.use(authorize('user'));

// Trip CRUD
router.post('/', createTrip);
router.get('/find', findTrips);
router.get('/my-trips', getMyTrips);

// Request management
router.post('/:id/request', sendRequest);
router.put('/:id/request/:requestId/accept', acceptRequest);
router.put('/:id/request/:requestId/reject', rejectRequest);

// Trip status
router.put('/:id/cancel', cancelTrip);
router.put('/:id/complete', completeTrip);

module.exports = router;
