const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
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
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

// Police Management
router.get('/police', getAllPolice);
router.post('/police', createPolice);
router.put('/police/:id', updatePolice);
router.delete('/police/:id', deletePolice);

// Complaint Management
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id', updateComplaintStatus);
router.get('/complaints/:stationId/officers', getOfficersByStation);
router.put('/complaints/:complaintId/assign', assignComplaintToOfficer);
router.put('/complaints/:complaintId/unassign', unassignComplaint);

// Police Station Management
router.get('/stations', getAllStations);
router.post('/stations', createStation);
router.put('/stations/:id', updateStation);
router.delete('/stations/:id', deleteStation);

module.exports = router;
