const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Cancelled'],
    default: 'Active'
  },
  guardianNotified: {
    type: Boolean,
    default: false
  },
  guardianCount: {
    type: Number,
    default: 0
  },
  nearestStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    default: null
  },
  assignedOfficers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Police'
    }
  ],
  distanceToStation: {
    type: Number,
    default: null
  },
  assignmentStatus: {
    type: String,
    enum: ['Unassigned', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Unassigned'
  },
  assignedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for geospatial queries
sosAlertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
