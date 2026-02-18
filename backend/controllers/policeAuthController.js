const Police = require('../models/Police');
const generateToken = require('../utils/generateToken');

// @desc    Login police
// @route   POST /api/auth/police/login
// @access  Public
const loginPolice = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for police email
    const police = await Police.findOne({ email }).select('+password').populate('stationId');

    if (!police) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await police.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: police._id,
        name: police.name,
        email: police.email,
        phone: police.phone,
        role: police.role,
        station: police.stationId,
        profilePhoto: police.profilePhoto,
        token: generateToken(police._id, police.role)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current police profile
// @route   GET /api/auth/police/profile
// @access  Private (Police)
const getPoliceProfile = async (req, res) => {
  try {
    const police = await Police.findById(req.user._id).populate('stationId');

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

module.exports = {
  loginPolice,
  getPoliceProfile
};
