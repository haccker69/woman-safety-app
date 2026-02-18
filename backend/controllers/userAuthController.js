const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail } = require('../utils/emailService');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register new user
// @route   POST /api/auth/user/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const name = req.body.name != null ? String(req.body.name).trim() : '';
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password;
    const phone = req.body.phone != null ? String(req.body.phone).trim() : '';

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and phone'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user in database with all required fields
    const otp = generateOTP();
    const user = await User.create({
      name,
      email,
      password,
      phone,
      guardians: [],
      address: '',
      isEmailVerified: false,
      emailOTP: otp,
      emailOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, name, otp);
      console.log(`[REGISTER] Verification email sent to ${email}`);
    } catch (emailErr) {
      console.error('[REGISTER] Failed to send verification email:', emailErr.message);
      console.error('[REGISTER] SMTP config - HOST:', process.env.EMAIL_HOST, 'PORT:', process.env.EMAIL_PORT, 'USER:', process.env.EMAIL_USER);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification OTP.',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Resend OTP automatically
      const otp = generateOTP();
      user.emailOTP = otp;
      user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
        await sendVerificationEmail(email, user.name, otp);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
      }

      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new verification OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Fetch fresh user from DB (without password) so response has latest guardians & profile
    const freshUser = await User.findById(user._id).select('-password');
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const token = generateToken(freshUser._id, freshUser.role);
    res.status(200).json({
      success: true,
      data: {
        _id: freshUser._id,
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone,
        role: freshUser.role,
        address: freshUser.address,
        profilePhoto: freshUser.profilePhoto,
        guardians: Array.isArray(freshUser.guardians) ? freshUser.guardians : [],
        location: freshUser.location,
        createdAt: freshUser.createdAt,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/user/profile
// @access  Private (User)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/user/profile
// @access  Private (User)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const name = req.body.name != null ? String(req.body.name).trim() : undefined;
    const phone = req.body.phone != null ? String(req.body.phone).trim() : undefined;
    const address = req.body.address != null ? String(req.body.address).trim() : undefined;
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : undefined;

    if (email !== undefined) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== userId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Another account already uses this email'
        });
      }
    }

    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (email !== undefined) update.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile photo
// @route   PUT /api/auth/user/profile/photo
// @access  Private (User)
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const { profilePhoto } = req.body;

    if (!profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile photo'
      });
    }

    // Validate that it's a base64 image
    if (!profilePhoto.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePhoto } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile photo updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/user/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : '';
    const otp = req.body.otp != null ? String(req.body.otp).trim() : '';

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    const user = await User.findOne({ email }).select('+emailOTP +emailOTPExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (!user.emailOTP || !user.emailOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    if (new Date() > user.emailOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/user/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const email = req.body.email != null ? String(req.body.email).trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'A new verification OTP has been sent to your email.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfilePhoto,
  verifyEmail,
  resendOTP
};
