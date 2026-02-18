const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/women_safety_db';
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const dbName = conn.connection.db.databaseName;
    console.log(`MongoDB Connected: ${conn.connection.host} | Database: "${dbName}"`);
    
    // Create geospatial index for PoliceStation
    await mongoose.connection.db.collection('policestations').createIndex({
      location: '2dsphere'
    });
    
    console.log('Geospatial indexes created successfully');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
