const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const policeSchema = new mongoose.Schema({
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
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: [true, 'Please assign a police station']
  },
  profilePhoto: {
    type: String,
    default: null
  },
  role: {
    type: String,
    default: 'police',
    enum: ['police']
  }
}, {
  timestamps: true
});

// Hash password before saving
policeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
policeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Police', policeSchema);
