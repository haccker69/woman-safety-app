const Complaint = require('../models/Complaint');
const PoliceStation = require('../models/PoliceStation');
const User = require('../models/User');

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private (User)
const createComplaint = async (req, res) => {
  try {
    const { description, stationId, lat, lng, priority } = req.body;

    if (!description || !stationId || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if station exists
    const station = await PoliceStation.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found'
      });
    }

    // Validate priority if provided
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const complaintPriority = priority && validPriorities.includes(priority) ? priority : 'Medium';

    // Create complaint
    const complaint = await Complaint.create({
      userId: req.user._id,
      stationId,
      description,
      priority: complaintPriority,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });

    // Populate the response
    await complaint.populate('stationId', 'name area city helpline');
    await complaint.populate('userId', 'name phone email profilePhoto');

    const [longitude, latitude] = complaint.location.coordinates;

    res.status(201).json({
      success: true,
      data: {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        location: { lat: latitude, lng: longitude },
        station: complaint.stationId,
        user: complaint.userId,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user complaints
// @route   GET /api/complaints/my-complaints
// @access  Private (User)
const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .populate('stationId', 'name area city helpline')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const [lng, lat] = complaint.location.coordinates;
      return {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        location: { lat, lng },
        station: complaint.stationId,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      data: formattedComplaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get complaints for police station
// @route   GET /api/complaints/station
// @access  Private (Police)
const getStationComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ stationId: req.user.stationId })
      .populate('userId', 'name phone email profilePhoto')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const [lng, lat] = complaint.location.coordinates;
      return {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        priority: complaint.priority,
        location: { lat, lng },
        user: complaint.userId,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      data: formattedComplaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Police)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaintId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Pending, In Progress, or Resolved'
      });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if complaint belongs to police station
    if (complaint.stationId.toString() !== req.user.stationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this complaint'
      });
    }

    complaint.status = status;
    await complaint.save();

    await complaint.populate('userId', 'name phone email profilePhoto');
    await complaint.populate('stationId', 'name area city helpline');

    const [lng, lat] = complaint.location.coordinates;

    res.status(200).json({
      success: true,
      data: {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        location: { lat, lng },
        user: complaint.userId,
        station: complaint.stationId,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints/all
// @access  Private (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'name phone email profilePhoto')
      .populate('stationId', 'name area city helpline')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const [lng, lat] = complaint.location.coordinates;
      return {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        location: { lat, lng },
        user: complaint.userId,
        station: complaint.stationId,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      data: formattedComplaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all user emergency locations (Admin)
// @route   GET /api/complaints/emergency-locations
// @access  Private (Admin)
const getEmergencyLocations = async (req, res) => {
  try {
    const SOSAlert = require('../models/SOSAlert');
    
    // Get active SOS alerts
    const sosAlerts = await SOSAlert.find({ status: 'Active' })
      .populate('userId', 'name phone email profilePhoto')
      .sort({ createdAt: -1 });

    const locations = sosAlerts
      .filter(alert => alert.location?.coordinates?.length === 2)
      .map(alert => {
        const [lng, lat] = alert.location.coordinates;
        return {
          _id: alert._id,
          name: alert.userId?.name,
          phone: alert.userId?.phone,
          email: alert.userId?.email,
          location: { lat, lng },
          status: alert.status,
          guardianNotified: alert.guardianNotified,
          guardianCount: alert.guardianCount,
          createdAt: alert.createdAt,
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

module.exports = {
  createComplaint,
  getUserComplaints,
  getStationComplaints,
  updateComplaintStatus,
  getAllComplaints,
  getEmergencyLocations
};
