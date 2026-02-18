const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getGuardians,
  addGuardian,
  updateGuardian,
  deleteGuardian
} = require('../controllers/guardianController');

// All routes are protected and only for users
router.use(protect);
router.use(authorize('user'));

router.route('/')
  .get(getGuardians)
  .post(addGuardian);

router.route('/:id')
  .put(updateGuardian)
  .delete(deleteGuardian);

module.exports = router;
