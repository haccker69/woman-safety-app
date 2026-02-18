const User = require('../models/User');
const SOSAlert = require('../models/SOSAlert');
const PoliceStation = require('../models/PoliceStation');
const Police = require('../models/Police');
const { sendSOSEmail } = require('../utils/emailService');

// Helper function to find nearest police station
const findNearestStation = async (coordinates) => {
  try {
    const [lng, lat] = coordinates;
    
    // Use geospatial query to find nearest station
    const stations = await PoliceStation.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          distanceField: 'distance',
          maxDistance: 50000, // 50 km max
          spherical: true
        }
      },
      {
        $limit: 1
      }
    ]);

    if (stations.length > 0) {
      return {
        stationId: stations[0]._id,
        distance: stations[0].distance,
        station: stations[0]
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding nearest station:', error);
    return null;
  }
};

// Helper function to get available police officers from station
const getAvailableOfficers = async (stationId, limit = 2) => {
  try {
    const officers = await Police.find({ stationId })
      .limit(limit)
      .select('name email phone');
    
    return officers;
  } catch (error) {
    console.error('Error fetching officers:', error);
    return [];
  }
};

// Helper function to assign officers to SOS alert
const assignOfficersToAlert = async (sosAlertId, stationId) => {
  try {
    const sosAlert = await SOSAlert.findById(sosAlertId);
    if (!sosAlert) {
      return { success: false, message: 'SOS Alert not found' };
    }

    const officers = await getAvailableOfficers(stationId, 2);
    
    if (officers.length === 0) {
      return { success: false, message: 'No officers available at nearest station' };
    }

    const officerIds = officers.map(officer => officer._id);
    
    // Calculate distance from alert location to the new station
    const station = await PoliceStation.findById(stationId);
    if (!station) {
      return { success: false, message: 'Station not found' };
    }

    let distanceToNewStation = null;
    if (station.location && station.location.coordinates) {
      const alertLng = sosAlert.location.coordinates[0];
      const alertLat = sosAlert.location.coordinates[1];
      const stationLng = station.location.coordinates[0];
      const stationLat = station.location.coordinates[1];
      
      // Calculate distance using haversine formula (in meters)
      const R = 6371000; // Earth's radius in meters
      const dLat = (stationLat - alertLat) * Math.PI / 180;
      const dLng = (stationLng - alertLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(alertLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceToNewStation = R * c;
    }
    
    const updatedAlert = await SOSAlert.findByIdAndUpdate(
      sosAlertId,
      {
        assignedOfficers: officerIds,
        nearestStation: stationId,
        assignmentStatus: 'Assigned',
        assignedAt: new Date(),
        distanceToStation: distanceToNewStation
      },
      { new: true }
    ).populate('assignedOfficers', 'name email phone')
     .populate('nearestStation', 'name area city helpline location');

    return { success: true, alert: updatedAlert, officers };
  } catch (error) {
    console.error('Error assigning officers:', error);
    return { success: false, message: error.message };
  }
};

// @desc    Update user location
// @route   PUT /api/sos/location
// @access  Private (User)
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const user = await User.findById(req.user._id);

    // Update location using model method
    user.location = {
      type: 'Point',
      coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        lat,
        lng
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user location
// @route   GET /api/sos/location
// @access  Private (User)
const getLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const [lng, lat] = user.location.coordinates;

    res.status(200).json({
      success: true,
      data: {
        lat,
        lng
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Trigger SOS Alert
// @route   POST /api/sos/alert
// @access  Private (User)
const triggerSOS = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current location'
      });
    }

    const user = await User.findById(req.user._id);
    const hasGuardians = user.guardians && user.guardians.length > 0;

    // Update user location
    user.location = {
      type: 'Point',
      coordinates: [lng, lat]
    };
    await user.save();

    // Create SOS Alert record
    const sosAlert = await SOSAlert.create({
      userId: req.user._id,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      status: 'Active',
      guardianNotified: hasGuardians,
      guardianCount: hasGuardians ? user.guardians.length : 0
    });

    // Find nearest police station
    const nearestStationData = await findNearestStation([lng, lat]);
    
    if (nearestStationData) {
      // Update alert with nearest station info
      sosAlert.nearestStation = nearestStationData.stationId;
      sosAlert.distanceToStation = nearestStationData.distance;
      await sosAlert.save();

      // Auto-assign officers from nearest station
      const assignmentResult = await assignOfficersToAlert(sosAlert._id, nearestStationData.stationId);
      
      if (assignmentResult.success) {
        await sosAlert.populate('assignedOfficers', 'name email phone');
        await sosAlert.populate('nearestStation', 'name area city helpline location');
      }
    }

    // Send SOS emails to all guardians if they exist (don't fail if email fails)
    let emailResult = { success: true, message: 'SOS alert created successfully' };
    if (hasGuardians) {
      try {
        emailResult = await sendSOSEmail(
          user.guardians,
          user.name,
          user.phone,
          lat,
          lng
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        emailResult = { success: false, message: 'SOS alert created but email notification failed' };
      }
    } else {
      emailResult = { success: true, message: 'SOS alert sent to nearby police station' };
    }

    await sosAlert.populate('userId', 'name email phone profilePhoto');

    res.status(200).json({
      success: true,
      message: emailResult.message,
      data: {
        alertId: sosAlert._id,
        location: { lat, lng },
        guardianCount: hasGuardians ? user.guardians.length : 0,
        nearestStation: sosAlert.nearestStation,
        assignedOfficers: sosAlert.assignedOfficers,
        distanceToStation: sosAlert.distanceToStation,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SOS alert. Please try again.'
    });
  }
};

// @desc    Get user's active SOS alert
// @route   GET /api/sos/alert/active
// @access  Private (User)
const getUserActiveAlert = async (req, res) => {
  try {
    const activeAlert = await SOSAlert.findOne({
      userId: req.user._id,
      status: 'Active'
    })
      .populate('nearestStation', 'name area city helpline location')
      .populate('assignedOfficers', 'name phone');

    res.status(200).json({
      success: true,
      data: activeAlert
    });
  } catch (error) {
    console.error('Error fetching active alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active SOS alerts (Admin)
// @route   GET /api/sos/alerts
// @access  Private (Admin)
const getActiveSOSAlerts = async (req, res) => {
  try {
    const sosAlerts = await SOSAlert.find({ status: 'Active' })
      .populate('userId', 'name email phone profilePhoto')
      .populate('assignedOfficers', 'name email phone')
      .populate('nearestStation', 'name area city helpline location')
      .sort({ createdAt: -1 });

    const locations = sosAlerts.map(alert => {
      const [lng, lat] = alert.location.coordinates;
      return {
        _id: alert._id,
        name: alert.userId?.name,
        email: alert.userId?.email,
        phone: alert.userId?.phone,
        location: { lat, lng },
        status: alert.status,
        guardianNotified: alert.guardianNotified,
        guardianCount: alert.guardianCount,
        nearestStation: alert.nearestStation,
        assignedOfficers: alert.assignedOfficers,
        assignmentStatus: alert.assignmentStatus,
        distanceToStation: alert.distanceToStation,
        createdAt: alert.createdAt,
        assignedAt: alert.assignedAt,
        type: 'SOS'
      };
    });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign police officers to SOS alert
// @route   PUT /api/sos/alerts/:id/assign-officers
// @access  Private (Admin)
const assignOfficersManual = async (req, res) => {
  try {
    const { stationId } = req.body;
    const alertId = req.params.id;

    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide station ID'
      });
    }

    const sosAlert = await SOSAlert.findById(alertId);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    const result = await assignOfficersToAlert(alertId, stationId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Officers assigned successfully',
      data: result.alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resolve SOS alert
// @route   PUT /api/sos/alerts/:id/resolve
// @access  Private (Admin)
const resolveSOSAlert = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', assignmentStatus: 'Resolved' },
      { new: true }
    ).populate('userId', 'name email phone profilePhoto')
     .populate('assignedOfficers', 'name email phone')
     .populate('nearestStation', 'name area city helpline');

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    const [lng, lat] = sosAlert.location.coordinates;

    res.status(200).json({
      success: true,
      message: 'SOS Alert resolved successfully',
      data: {
        _id: sosAlert._id,
        name: sosAlert.userId?.name,
        email: sosAlert.userId?.email,
        phone: sosAlert.userId?.phone,
        location: { lat, lng },
        status: sosAlert.status,
        assignedOfficers: sosAlert.assignedOfficers,
        createdAt: sosAlert.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel SOS alert
// @route   PUT /api/sos/alerts/:id/cancel
// @access  Private (User/Admin)
const cancelSOSAlert = async (req, res) => {
  try {
    const sosAlert = await SOSAlert.findById(req.params.id);

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && sosAlert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this alert'
      });
    }

    sosAlert.status = 'Cancelled';
    sosAlert.assignmentStatus = 'Resolved';
    await sosAlert.save();

    await sosAlert.populate('userId', 'name email phone profilePhoto');

    const [lng, lat] = sosAlert.location.coordinates;

    res.status(200).json({
      success: true,
      message: 'SOS Alert cancelled successfully',
      data: {
        _id: sosAlert._id,
        status: sosAlert.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get SOS alerts assigned to police officer
// @route   GET /api/sos/alerts/police/assigned
// @access  Private (Police)
const getPoliceAssignedAlerts = async (req, res) => {
  try {
    const policeId = req.user._id;
    
    // Find SOS alerts where this officer is assigned
    const sosAlerts = await SOSAlert.find({ 
      assignedOfficers: policeId,
      status: { $in: ['Active', 'In Progress'] }
    })
      .populate('userId', 'name email phone profilePhoto')
      .populate('assignedOfficers', 'name email phone')
      .populate('nearestStation', 'name area city helpline location')
      .sort({ createdAt: -1 });

    const locations = sosAlerts.map(alert => {
      const [lng, lat] = alert.location.coordinates;
      return {
        _id: alert._id,
        name: alert.userId?.name,
        email: alert.userId?.email,
        phone: alert.userId?.phone,
        location: { lat, lng },
        status: alert.status,
        guardianNotified: alert.guardianNotified,
        guardianCount: alert.guardianCount,
        nearestStation: alert.nearestStation,
        assignedOfficers: alert.assignedOfficers,
        assignmentStatus: alert.assignmentStatus,
        distanceToStation: alert.distanceToStation,
        createdAt: alert.createdAt,
        assignedAt: alert.assignedAt,
        type: 'SOS'
      };
    });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching assigned SOS alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  updateLocation,
  getLocation,
  triggerSOS,
  getUserActiveAlert,
  getActiveSOSAlerts,
  assignOfficersManual,
  resolveSOSAlert,
  cancelSOSAlert,
  getPoliceAssignedAlerts,
  findNearestStation,
  assignOfficersToAlert
};
