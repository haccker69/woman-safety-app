const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();

// Connect to database
connectDB();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@womensafety.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log('Admin account already exists');
      process.exit();
    }

    // Create admin account
    const admin = await Admin.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword
    });

    console.log('✅ Admin account created successfully');
    console.log('Email:', adminEmail);
    console.log('⚠️  Please change the password after first login!');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
