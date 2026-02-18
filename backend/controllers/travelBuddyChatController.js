const TravelBuddyMessage = require('../models/TravelBuddyMessage');
const TravelBuddy = require('../models/TravelBuddy');

// Helper: check if user is a trip participant (owner or matched buddy)
// Works with both populated and unpopulated trip documents
const isTripParticipant = (trip, userId) => {
  const uid = userId.toString();
  const ownerId = trip.userId?._id || trip.userId;
  if (ownerId && ownerId.toString() === uid) return true;
  if (Array.isArray(trip.matchedWith)) {
    return trip.matchedWith.some(m => {
      const mid = m?._id || m;
      return mid && mid.toString() === uid;
    });
  }
  return false;
};

// @desc    Send a message in travel buddy chat
// @route   POST /api/travel-buddy-chat/:tripId/messages
// @access  Private (User - trip participant)
const sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message, messageType = 'text', audioData, audioDuration, location } = req.body;

    // Validate based on message type
    if (messageType === 'text' && (!message || !message.trim())) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (messageType === 'audio' && !audioData) {
      return res.status(400).json({ success: false, message: 'Audio data is required' });
    }
    if (messageType === 'location' && (!location || !location.lat || !location.lng)) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required' });
    }

    // Verify trip exists and user is a participant
    const trip = await TravelBuddy.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!isTripParticipant(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized - you are not part of this trip' });
    }

    const messageData = {
      tripId,
      sender: req.user._id,
      senderName: req.user.name,
      messageType
    };

    if (messageType === 'text') {
      messageData.message = message.trim();
    } else if (messageType === 'audio') {
      messageData.audioData = audioData;
      messageData.audioDuration = audioDuration || 0;
      messageData.message = '🎤 Voice message';
    } else if (messageType === 'location') {
      messageData.location = location;
      messageData.message = `📍 Location: ${location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}`;
    }

    const chatMessage = await TravelBuddyMessage.create(messageData);

    res.status(201).json({ success: true, data: chatMessage });
  } catch (error) {
    console.error('Error sending travel buddy message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages for a travel buddy chat
// @route   GET /api/travel-buddy-chat/:tripId/messages
// @access  Private (User - trip participant)
const getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { since } = req.query;

    const trip = await TravelBuddy.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!isTripParticipant(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let query = { tripId };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const messages = await TravelBuddyMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Error fetching travel buddy messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat info for a trip (participants, message count)
// @route   GET /api/travel-buddy-chat/:tripId/info
// @access  Private (User - trip participant)
const getChatInfo = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await TravelBuddy.findById(tripId)
      .populate('userId', 'name profilePhoto')
      .populate('matchedWith', 'name profilePhoto');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!isTripParticipant(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messageCount = await TravelBuddyMessage.countDocuments({ tripId });

    const participants = [];
    if (trip.userId) {
      participants.push({
        id: trip.userId._id,
        name: trip.userId.name,
        profilePhoto: trip.userId.profilePhoto || null,
        role: 'owner'
      });
    }
    if (Array.isArray(trip.matchedWith)) {
      trip.matchedWith.forEach(buddy => {
        participants.push({
          id: buddy._id,
          name: buddy.name,
          profilePhoto: buddy.profilePhoto || null,
          role: 'buddy'
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tripId,
        participants,
        messageCount,
        status: trip.status,
        from: trip.from.name,
        to: trip.to.name
      }
    });
  } catch (error) {
    console.error('Error fetching travel buddy chat info:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getMessages, getChatInfo };
