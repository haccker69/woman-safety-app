const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide station name'],
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Please provide area'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide city'],
    trim: true
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
  helpline: {
    type: String,
    required: [true, 'Please provide helpline number'],
    trim: true
  }
}, {
  timestamps: true
});

// Create geospatial index
policeStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PoliceStation', policeStationSchema);
