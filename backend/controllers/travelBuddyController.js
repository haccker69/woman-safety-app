const TravelBuddy = require('../models/TravelBuddy');

// @desc    Create a travel buddy request (post a trip)
// @route   POST /api/travel-buddy
// @access  Private (User)
const createTrip = async (req, res) => {
  try {
    const { from, to, departureTime, note } = req.body;

    if (!from || !from.name || !from.coordinates || !to || !to.name || !to.coordinates || !departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide from, to locations with coordinates and departure time'
      });
    }

    // Check if user already has an active trip
    const existingTrip = await TravelBuddy.findOne({
      userId: req.user._id,
      status: { $in: ['Active', 'Matched'] }
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active trip. Cancel it first to create a new one.'
      });
    }

    const trip = await TravelBuddy.create({
      userId: req.user._id,
      from: {
        name: from.name,
        coordinates: from.coordinates
      },
      to: {
        name: to.name,
        coordinates: to.coordinates
      },
      departureTime: new Date(departureTime),
      note: note || ''
    });

    const populatedTrip = await TravelBuddy.findById(trip._id)
      .populate('userId', 'name phone profilePhoto');

    res.status(201).json({
      success: true,
      data: populatedTrip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available trips nearby (matching destination area)
// @route   GET /api/travel-buddy/find?fromLat=&fromLng=&toLat=&toLng=&radius=
// @access  Private (User)
const findTrips = async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, radius = 5 } = req.query;

    const query = {
      status: { $in: ['Active', 'Matched'] },
      departureTime: { $gte: new Date() }
    };

    // If location filters provided, filter by proximity
    if (fromLat && fromLng) {
      const radiusInKm = parseFloat(radius);
      // Use aggregation with $geoNear or simple coordinate filtering
      // For simplicity, filter by a bounding box around from location
      const latDelta = radiusInKm / 111; // ~111 km per degree latitude
      const lngDelta = radiusInKm / (111 * Math.cos(parseFloat(fromLat) * Math.PI / 180));

      query['from.coordinates'] = {
        $geoWithin: {
          $box: [
            [parseFloat(fromLng) - lngDelta, parseFloat(fromLat) - latDelta],
            [parseFloat(fromLng) + lngDelta, parseFloat(fromLat) + latDelta]
          ]
        }
      };
    }

    if (toLat && toLng) {
      const radiusInKm = parseFloat(radius);
      const latDelta = radiusInKm / 111;
      const lngDelta = radiusInKm / (111 * Math.cos(parseFloat(toLat) * Math.PI / 180));

      query['to.coordinates'] = {
        $geoWithin: {
          $box: [
            [parseFloat(toLng) - lngDelta, parseFloat(toLat) - latDelta],
            [parseFloat(toLng) + lngDelta, parseFloat(toLat) + latDelta]
          ]
        }
      };
    }

    const trips = await TravelBuddy.find(query)
      .populate('userId', 'name phone profilePhoto')
      .populate('matchedWith', 'name phone profilePhoto')
      .populate('requests.userId', 'name phone profilePhoto')
      .sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Find trips error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my trips (active + past) — includes trips I created AND trips I'm matched with
// @route   GET /api/travel-buddy/my-trips
// @access  Private (User)
const getMyTrips = async (req, res) => {
  try {
    const trips = await TravelBuddy.find({
      $or: [
        { userId: req.user._id },
        { matchedWith: req.user._id },
        { 'requests.userId': req.user._id }
      ]
    })
      .populate('userId', 'name phone profilePhoto')
      .populate('matchedWith', 'name phone profilePhoto')
      .populate('requests.userId', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send a join request to a trip
// @route   POST /api/travel-buddy/:id/request
// @access  Private (User)
const sendRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const trip = await TravelBuddy.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request to join your own trip'
      });
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This trip is no longer available'
      });
    }

    // Check if trip is full (1 owner + 4 buddies = 5 max)
    if (trip.matchedWith && trip.matchedWith.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'This trip is full (max 5 members)'
      });
    }

    // Check if already requested
    const existingRequest = trip.requests.find(
      r => r.userId.toString() === req.user._id.toString() && r.status === 'Pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a request for this trip'
      });
    }

    trip.requests.push({
      userId: req.user._id,
      message: message || '',
      status: 'Pending'
    });

    await trip.save();

    const updatedTrip = await TravelBuddy.findById(trip._id)
      .populate('userId', 'name phone profilePhoto')
      .populate('requests.userId', 'name phone profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Request sent successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept a join request
// @route   PUT /api/travel-buddy/:id/request/:requestId/accept
// @access  Private (User - trip owner)
const acceptRequest = async (req, res) => {
  try {
    const trip = await TravelBuddy.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can accept requests'
      });
    }

    const request = trip.requests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Accept the request
    request.status = 'Accepted';
    trip.matchedWith.push(request.userId);
    trip.status = 'Matched';

    // Max 5 users total (1 owner + 4 buddies) — reject remaining if limit reached
    if (trip.matchedWith.length >= 4) {
      trip.requests.forEach(r => {
        if (r._id.toString() !== req.params.requestId && r.status === 'Pending') {
          r.status = 'Rejected';
        }
      });
    }

    await trip.save();

    const updatedTrip = await TravelBuddy.findById(trip._id)
      .populate('userId', 'name phone profilePhoto')
      .populate('matchedWith', 'name phone profilePhoto')
      .populate('requests.userId', 'name phone profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Request accepted! You are now travel buddies.',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject a join request
// @route   PUT /api/travel-buddy/:id/request/:requestId/reject
// @access  Private (User - trip owner)
const rejectRequest = async (req, res) => {
  try {
    const trip = await TravelBuddy.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can reject requests'
      });
    }

    const request = trip.requests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.status = 'Rejected';
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Request rejected'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel my trip
// @route   PUT /api/travel-buddy/:id/cancel
// @access  Private (User - trip owner)
const cancelTrip = async (req, res) => {
  try {
    const trip = await TravelBuddy.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can cancel the trip'
      });
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This trip is already finished or cancelled'
      });
    }

    trip.status = 'Cancelled';
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete a trip
// @route   PUT /api/travel-buddy/:id/complete
// @access  Private (User - trip owner)
const completeTrip = async (req, res) => {
  try {
    const trip = await TravelBuddy.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can complete the trip'
      });
    }

    trip.status = 'Completed';
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip marked as completed'
    });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createTrip,
  findTrips,
  getMyTrips,
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelTrip,
  completeTrip
};
