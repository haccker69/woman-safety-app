const Police = require('../models/Police');
const Complaint = require('../models/Complaint');

// @desc    Get police dashboard statistics
// @route   GET /api/police/dashboard
// @access  Private (Police)
const getDashboardStats = async (req, res) => {
  try {
    const policeId = req.user._id;
    
    // Get police officer details with station
    const police = await Police.findById(policeId).populate('stationId');
    
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    const stationId = police.stationId._id;

    // Total complaints assigned to this officer
    const totalComplaints = await Complaint.countDocuments({ 
      stationId,
      assignedTo: policeId 
    });
    
    // Complaints by status (only assigned to this officer)
    const pendingComplaints = await Complaint.countDocuments({ 
      stationId, 
      assignedTo: policeId,
      status: 'Pending' 
    });
    const inProgressComplaints = await Complaint.countDocuments({ 
      stationId, 
      assignedTo: policeId,
      status: 'In Progress' 
    });
    const resolvedComplaints = await Complaint.countDocuments({ 
      stationId, 
      assignedTo: policeId,
      status: 'Resolved' 
    });

    // Critical/High priority complaints assigned to this officer
    const criticalComplaints = await Complaint.countDocuments({ 
      stationId,
      assignedTo: policeId,
      priority: { $in: ['Critical', 'High'] }
    });

    // Complaints assigned to this specific police officer (redundant but kept for clarity)
    const assignedToMe = await Complaint.countDocuments({ 
      stationId,
      assignedTo: policeId 
    });

    // Resolution rate (resolved / total * 100) for this officer
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    // Recent complaints assigned to this officer (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentComplaints = await Complaint.find({
      stationId,
      assignedTo: policeId,
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('userId', 'name email phone profilePhoto')
      .populate('stationId', 'name area')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalComplaints,
          pendingComplaints,
          inProgressComplaints,
          resolvedComplaints,
          criticalComplaints,
          assignedToMe,
          resolutionRate
        },
        recentComplaints
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all complaints for police officer's station
// @route   GET /api/police/complaints
// @access  Private (Police)
const getComplaints = async (req, res) => {
  try {
    const policeId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const skip = (page - 1) * limit;

    // Get police officer's station
    const police = await Police.findById(policeId).populate('stationId');
    
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    const stationId = police.stationId._id;

    // Build query - only show complaints assigned to this police officer
    let query = { 
      stationId,
      assignedTo: policeId 
    };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add priority filter
    if (priority) {
      query.priority = priority;
    }

    // Add search filter - combine with existing filters using $and
    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { description: { $regex: search, $options: 'i' } },
              { 'userId.name': { $regex: search, $options: 'i' } },
              { 'userId.phone': { $regex: search, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email phone profilePhoto')
      .populate('stationId', 'name area city')
      .populate('assignedTo', 'name email')
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
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/police/complaints/:id
// @access  Private (Police)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaintId = req.params.id;
    const policeId = req.user._id;

    // Validate status
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, In Progress, or Resolved'
      });
    }

    // Get police officer's station
    const police = await Police.findById(policeId).populate('stationId');
    
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    // Find complaint and verify it belongs to this police officer
    const complaint = await Complaint.findById(complaintId)
      .populate('userId', 'name email phone profilePhoto')
      .populate('stationId', 'name area city');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Verify the complaint is assigned to this police officer
    if (complaint.assignedTo.toString() !== policeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this complaint. It is not assigned to you.'
      });
    }

    // Verify the complaint belongs to the police officer's station
    if (complaint.stationId._id.toString() !== police.stationId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this complaint'
      });
    }

    // Update the complaint
    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update police profile (including photo)
// @route   PUT /api/police/profile
// @access  Private (Police)
const updatePoliceProfile = async (req, res) => {
  try {
    const policeId = req.user._id;
    const { profilePhoto } = req.body;
    
    const police = await Police.findById(policeId);
    
    if (!police) {
      return res.status(404).json({
        success: false,
        message: 'Police officer not found'
      });
    }

    // Update profile photo if provided
    if (profilePhoto !== undefined) {
      police.profilePhoto = profilePhoto;
    }

    await police.save();

    res.status(200).json({
      success: true,
      data: {
        _id: police._id,
        name: police.name,
        email: police.email,
        phone: police.phone,
        profilePhoto: police.profilePhoto
      }
    });
  } catch (error) {
    console.error('Error updating police profile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getComplaints,
  updateComplaintStatus,
  updatePoliceProfile
};
