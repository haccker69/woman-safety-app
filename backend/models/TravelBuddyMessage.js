const mongoose = require('mongoose');

const travelBuddyMessageSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelBuddy',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'audio', 'location'],
    default: 'text'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  audioData: {
    type: String // Base64 encoded audio
  },
  audioDuration: {
    type: Number // Duration in seconds
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
travelBuddyMessageSchema.index({ tripId: 1, createdAt: 1 });

module.exports = mongoose.model('TravelBuddyMessage', travelBuddyMessageSchema);
