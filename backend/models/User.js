const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guardianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  profilePhoto: {
    type: String, // Base64 encoded image
    default: null
  },
  guardians: [guardianSchema],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: {
    type: String,
    select: false
  },
  emailOTPExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update location
userSchema.methods.updateLocation = function(lat, lng) {
  this.location = {
    type: 'Point',
    coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
  };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
