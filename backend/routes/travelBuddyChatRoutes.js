const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getChatInfo
} = require('../controllers/travelBuddyChatController');

// All routes are protected - only users can access
router.use(protect);

router.route('/:tripId/messages')
  .get(authorize('user'), getMessages)
  .post(authorize('user'), sendMessage);

router.get('/:tripId/info', authorize('user'), getChatInfo);

module.exports = router;
