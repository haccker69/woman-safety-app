const ChatMessage = require('../models/ChatMessage');
const SOSAlert = require('../models/SOSAlert');

// @desc    Send a message in SOS chat
// @route   POST /api/chat/:sosAlertId/messages
// @access  Private (User, Police, Admin)
const sendMessage = async (req, res) => {
  try {
    const { sosAlertId } = req.params;
    const { message, messageType = 'text', audioData, audioDuration, location } = req.body;

    // Validate based on message type
    if (messageType === 'text' && (!message || !message.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Message is required for text messages'
      });
    }

    if (messageType === 'audio' && !audioData) {
      return res.status(400).json({
        success: false,
        message: 'Audio data is required for audio messages'
      });
    }

    if (messageType === 'location' && (!location || !location.lat || !location.lng)) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required for location messages'
      });
    }

    // Verify SOS alert exists
    const sosAlert = await SOSAlert.findById(sosAlertId);
    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    // Determine sender info based on role
    let senderModel, senderRole, senderName;
    
    if (req.user.role === 'user') {
      senderModel = 'User';
      senderRole = 'user';
      senderName = req.user.name;
      
      // Verify user owns this SOS alert
      if (sosAlert.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this chat'
        });
      }
    } else if (req.user.role === 'police') {
      senderModel = 'Police';
      senderRole = 'police';
      senderName = req.user.name;
      
      // Verify police is assigned to this alert
      const isAssigned = sosAlert.assignedOfficers?.some(
        officer => officer.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this chat'
        });
      }
    } else if (req.user.role === 'admin') {
      senderModel = 'Admin';
      senderRole = 'admin';
      senderName = req.user.name || 'Admin';
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const messageData = {
      sosAlertId,
      sender: req.user._id,
      senderModel,
      senderName,
      senderRole,
      messageType
    };

    // Add type-specific data
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

    const chatMessage = await ChatMessage.create(messageData);

    res.status(201).json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages for an SOS chat
// @route   GET /api/chat/:sosAlertId/messages
// @access  Private (User, Police, Admin)
const getMessages = async (req, res) => {
  try {
    const { sosAlertId } = req.params;
    const { since } = req.query; // Optional: get messages since a timestamp

    // Verify SOS alert exists
    const sosAlert = await SOSAlert.findById(sosAlertId);
    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    // Verify access based on role
    if (req.user.role === 'user') {
      if (sosAlert.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this chat'
        });
      }
    } else if (req.user.role === 'police') {
      const isAssigned = sosAlert.assignedOfficers?.some(
        officer => officer.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this chat'
        });
      }
    }
    // Admin has access to all chats

    let query = { sosAlertId };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get chat info for an SOS alert (participants, message count)
// @route   GET /api/chat/:sosAlertId/info
// @access  Private (User, Police, Admin)
const getChatInfo = async (req, res) => {
  try {
    const { sosAlertId } = req.params;

    const sosAlert = await SOSAlert.findById(sosAlertId)
      .populate('userId', 'name')
      .populate('assignedOfficers', 'name');

    if (!sosAlert) {
      return res.status(404).json({
        success: false,
        message: 'SOS Alert not found'
      });
    }

    const messageCount = await ChatMessage.countDocuments({ sosAlertId });

    const participants = [];
    
    if (sosAlert.userId) {
      participants.push({
        id: sosAlert.userId._id,
        name: sosAlert.userId.name,
        role: 'user'
      });
    }

    if (sosAlert.assignedOfficers) {
      sosAlert.assignedOfficers.forEach(officer => {
        participants.push({
          id: officer._id,
          name: officer.name,
          role: 'police'
        });
      });
    }

    // Add admin as participant
    participants.push({
      id: 'admin',
      name: 'Admin',
      role: 'admin'
    });

    res.status(200).json({
      success: true,
      data: {
        sosAlertId,
        participants,
        messageCount,
        status: sosAlert.status
      }
    });
  } catch (error) {
    console.error('Error fetching chat info:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getChatInfo
};
