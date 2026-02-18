const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sosAlertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOSAlert',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Police', 'Admin']
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['user', 'police', 'admin']
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
    type: String, // Base64 encoded audio
  },
  audioDuration: {
    type: Number // Duration in seconds
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  readBy: [{
    reader: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'readBy.readerModel'
    },
    readerModel: {
      type: String,
      enum: ['User', 'Police', 'Admin']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ sosAlertId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
