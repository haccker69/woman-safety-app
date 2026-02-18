const User = require('../models/User');

// @desc    Get all guardians
// @route   GET /api/guardians
// @access  Private (User)
const getGuardians = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: Array.isArray(user.guardians) ? user.guardians : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add guardian
// @route   POST /api/guardians
// @access  Private (User)
const addGuardian = async (req, res) => {
  try {
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    const phone = req.body.phone != null ? String(req.body.phone).trim() : '';
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : '';

    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and email'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.guardians.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 guardians allowed'
      });
    }

    // Persist using $push so the write is atomic and guaranteed in DB
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { guardians: { name, phone, email } } },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      data: updated.guardians
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update guardian
// @route   PUT /api/guardians/:id
// @access  Private (User)
const updateGuardian = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const guardianId = req.params.id;

    const user = await User.findById(req.user._id);

    const guardian = user.guardians.id(guardianId);

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Update fields
    if (name) guardian.name = name;
    if (phone) guardian.phone = phone;
    if (email) guardian.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.guardians
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete guardian
// @route   DELETE /api/guardians/:id
// @access  Private (User)
const deleteGuardian = async (req, res) => {
  try {
    const guardianId = req.params.id;

    const user = await User.findById(req.user._id);

    const guardian = user.guardians.id(guardianId);

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found'
      });
    }

    // Remove guardian using pull
    user.guardians.pull(guardianId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Guardian removed successfully',
      data: user.guardians
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getGuardians,
  addGuardian,
  updateGuardian,
  deleteGuardian
};
