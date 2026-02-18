const mongoose = require('mongoose');

const travelBuddySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    name: {
      type: String,
      required: [true, 'Please provide a starting location name'],
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  to: {
    name: {
      type: String,
      required: [true, 'Please provide a destination name'],
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  departureTime: {
    type: Date,
    required: [true, 'Please provide departure time']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Matched', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  matchedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  requests: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for geospatial queries on "from" location
travelBuddySchema.index({ 'from.coordinates': '2dsphere' });
travelBuddySchema.index({ 'to.coordinates': '2dsphere' });

module.exports = mongoose.model('TravelBuddy', travelBuddySchema);
