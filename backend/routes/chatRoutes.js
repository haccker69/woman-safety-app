const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getChatInfo
} = require('../controllers/chatController');

// All routes are protected
router.use(protect);

// Chat routes - accessible by user, police, and admin
router.route('/:sosAlertId/messages')
  .get(authorize('user', 'police', 'admin'), getMessages)
  .post(authorize('user', 'police', 'admin'), sendMessage);

router.get('/:sosAlertId/info', authorize('user', 'police', 'admin'), getChatInfo);

module.exports = router;
