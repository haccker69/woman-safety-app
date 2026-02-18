const User = require('../models/User');
const Police = require('../models/Police');
const PoliceStation = require('../models/PoliceStation');
const Complaint = require('../models/Complaint');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPolice = await Police.countDocuments();
    const totalStations = await PoliceStation.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });

    // Recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentComplaints = await Complaint.find({
      createdAt: { $gte: sevenDaysAgo }
    }).populate('userId', 'name email profilePhoto').populate('stationId', 'name area').sort({ createdAt: -1 }).limit(10);

    // Recent users (last 7 days)
    const recentUsers = await User.find({
      createdAt: { $gte: sevenDaysAgo }
    }).select('name email phone createdAt').sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPolice,
          totalStations,
          totalComplaints,
          pendingComplaints,
          inProgressComplaints,
          resolvedComplaints
        },
        recentComplaints,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Get all police officer emails to exclude them from users
    const policeOfficers = await Police.find({}, 'email');
    const policeEmails = policeOfficers.map(officer => officer.email.toLowerCase());

    // Build query with search and police exclusion
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Always exclude police officer emails
    if (policeEmails.length > 0) {
      if (search) {
        query = {
          $and: [
            { $or: query.$or },
            { email: { $nin: policeEmails } }
          ]
        };
      } else {
        query.email = { $nin: policeEmails };
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's complaints
    const complaints = await Complaint.find({ userId: user._id })
      .populate('stationId', 'name area')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        complaints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's complaints
    await Complaint.deleteMany({ userId: user._id });
    
    // Delete user
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'User and associated complaints deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all police officers
// @route   GET /api/admin/police
// @access  Private (Admin)
const getAllPolice = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const police = await Police.find(query)
      .populate('stationId', 'name area city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Police.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        police,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create police officer
// @route   POST /api/admin/police
// @access  Private (Admin)
const createPolice = async (req, res) => {
  try {
    const { name, email, password, phone, stationId, profilePhoto } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !stationId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, phone, and police station'
      });
    }

    // Check if police already exists
    const existingPolice = await Police.findOne({ email: email.trim().toLowerCase() });
    if (existingPolice) {
      return res.status(400).json({
        success: false,
        message: 'Police officer with this email already exists'
      });
    }

    // Verify station exists
    const station = await PoliceStation.findById(stationId);
    if (!station) {
      return res.status(400).json({
        success: false,
        message: 'Police station not found. Please select a valid station.'
      });
    }

    const policeData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      stationId
    };

    // Add profilePhoto if provided
    if (profilePhoto && profilePhoto.startsWith('data:image/')) {
      policeData.profilePhoto = profilePhoto;
    }

    const police = await Police.create(policeData);

    // Remove password from response
    police.password = undefined;

    res.status(201).json({
      success: true,
      data: police
    });
  } catch (error) {
    const message = error.name === 'ValidationError' && error.errors
      ? Object.values(error.errors).map(e => e.message).join(' ')
      : (error.message || 'Failed to create police officer');
    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      message
    });
  }
};

// @desc    Update police officer
// @route   PUT /api/admin/police/:id
// @access  Private (Admin)
const updatePolice = async (req, res) => {
  try {
    const { name, email, phone, stationId, profilePhoto } = req.body;

    const police = await Police.findById(req.params.id);
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    // If email is being changed, check for duplicates
    if (email && email !== police.email) {
      const existingPolice = await Police.findOne({ email });
      if (existingPolice) {
        return res.status(400).json({
          success: false,
          message: 'Police officer with this email already exists'
        });
      }
    }

    // If stationId is being changed, verify it exists
    if (stationId) {
      const station = await PoliceStation.findById(stationId);
      if (!station) {
        return res.status(400).json({
          success: false,
          message: 'Police station not found'
        });
      }
    }

    const updateData = { name, email, phone, stationId };
    
    // Add profilePhoto if provided and valid
    if (profilePhoto !== undefined) {
      if (profilePhoto === null || profilePhoto === '') {
        updateData.profilePhoto = null;
      } else if (profilePhoto.startsWith('data:image/')) {
        updateData.profilePhoto = profilePhoto;
      }
    }

    const updatedPolice = await Police.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('stationId', 'name area city');

    res.status(200).json({
      success: true,
      data: updatedPolice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete police officer
// @route   DELETE /api/admin/police/:id
// @access  Private (Admin)
const deletePolice = async (req, res) => {
  try {
    const police = await Police.findById(req.params.id);
    
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    await Police.findByIdAndDelete(police._id);

    res.status(200).json({
      success: true,
      message: 'Police officer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all complaints with filtering
// @route   GET /api/admin/complaints
// @access  Private (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { description: { $regex: search, $options: 'i' } },
              { 'userId.name': { $regex: search, $options: 'i' } },
              { 'userId.email': { $regex: search, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email phone profilePhoto')
      .populate('stationId', 'name area city')
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        complaints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update complaint status or priority
// @route   PUT /api/admin/complaints/:id
// @access  Private (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const updateData = {};

    // Validate and add status if provided
    if (status) {
      if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: Pending, In Progress, or Resolved'
        });
      }
      updateData.status = status;
    }

    // Validate and add priority if provided
    if (priority) {
      if (!['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Must be: Low, Medium, High, or Critical'
        });
      }
      updateData.priority = priority;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status or priority to update'
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
      .populate('stationId', 'name area city')
      .populate('assignedTo', 'name email phone');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all police stations
// @route   GET /api/admin/stations
// @access  Private (Admin)
const getAllStations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { area: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const stations = await PoliceStation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PoliceStation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        stations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create police station
// @route   POST /api/admin/stations
// @access  Private (Admin)
const createStation = async (req, res) => {
  try {
    const { name, area, city, helpline, latitude, longitude } = req.body;

    const station = await PoliceStation.create({
      name,
      area,
      city,
      helpline,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    res.status(201).json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update police station
// @route   PUT /api/admin/stations/:id
// @access  Private (Admin)
const updateStation = async (req, res) => {
  try {
    const { name, area, city, helpline, latitude, longitude } = req.body;

    const updateData = { name, area, city, helpline };
    
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    const station = await PoliceStation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found'
      });
    }

    res.status(200).json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete police station
// @route   DELETE /api/admin/stations/:id
// @access  Private (Admin)
const deleteStation = async (req, res) => {
  try {
    const station = await PoliceStation.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found'
      });
    }

    // Check if there are police officers assigned to this station
    const policeCount = await Police.countDocuments({ stationId: station._id });
    if (policeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete station with assigned police officers'
      });
    }

    await PoliceStation.findByIdAndDelete(station._id);

    res.status(200).json({
      success: true,
      message: 'Police station deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get police officers for a specific station
// @route   GET /api/admin/complaints/:stationId/officers
// @access  Private (Admin)
const getOfficersByStation = async (req, res) => {
  try {
    const { stationId } = req.params;

    const police = await Police.find({ stationId })
      .select('_id name email phone stationId')
      .populate('stationId', 'name area city');

    res.status(200).json({
      success: true,
      data: police
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign complaint to police officer
// @route   PUT /api/admin/complaints/:id/assign
// @access  Private (Admin)
const assignComplaintToOfficer = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { policeId } = req.body;

    if (!policeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a police officer ID'
      });
    }

    // Verify complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Verify police officer exists and belongs to the same station
    const police = await Police.findById(policeId);
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    if (police.stationId.toString() !== complaint.stationId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Police officer must belong to the same station as the complaint'
      });
    }

    // Assign complaint to officer
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedTo: policeId },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
      .populate('stationId', 'name area city')
      .populate('assignedTo', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Complaint assigned to officer successfully',
      data: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove complaint assignment
// @route   PUT /api/admin/complaints/:id/unassign
// @access  Private (Admin)
const unassignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Verify complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Unassign complaint from officer
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedTo: null },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
      .populate('stationId', 'name area city')
      .populate('assignedTo', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Complaint unassigned successfully',
      data: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllPolice,
  createPolice,
  updatePolice,
  deletePolice,
  getAllComplaints,
  updateComplaintStatus,
  getAllStations,
  createStation,
  updateStation,
  deleteStation,
  getOfficersByStation,
  assignComplaintToOfficer,
  unassignComplaint
};
