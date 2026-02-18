const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Police = require('../models/Police');
const Admin = require('../models/Admin');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user based on role
      let user;
      if (decoded.role === 'user') {
        user = await User.findById(decoded.id).select('-password');
      } else if (decoded.role === 'police') {
        user = await Police.findById(decoded.id).select('-password').populate('stationId');
      } else if (decoded.role === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Attach user to request object
      req.user = user;
      req.userRole = decoded.role;

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.userRole}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
