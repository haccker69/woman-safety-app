const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfilePhoto,
  verifyEmail,
  resendOTP
} = require('../controllers/userAuthController');

const {
  loginPolice,
  getPoliceProfile
} = require('../controllers/policeAuthController');

const {
  loginAdmin,
  getAdminProfile
} = require('../controllers/adminAuthController');

// User routes
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);
router.post('/user/verify-email', verifyEmail);
router.post('/user/resend-otp', resendOTP);
router.get('/user/profile', protect, authorize('user'), getUserProfile);
router.put('/user/profile', protect, authorize('user'), updateUserProfile);
router.put('/user/profile/photo', protect, authorize('user'), updateProfilePhoto);

// Police routes
router.post('/police/login', loginPolice);
router.get('/police/profile', protect, authorize('police'), getPoliceProfile);

// Admin routes
router.post('/admin/login', loginAdmin);
router.get('/admin/profile', protect, authorize('admin'), getAdminProfile);

module.exports = router;
