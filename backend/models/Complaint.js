const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please provide complaint description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Police',
    default: null
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
  }
}, {
  timestamps: true
});

// Index for geospatial queries
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
