const PoliceStation = require('../models/PoliceStation');
const Police = require('../models/Police');

// @desc    Search nearby police stations
// @route   GET /api/stations/nearby?lat=value&lng=value
// @access  Private (User)
const getNearbyStations = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Find stations within 5km radius using MongoDB geospatial query
    const stations = await PoliceStation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 5000 // 5km in meters
        }
      }
    }).limit(10);

    // Calculate distance for each station
    const stationsWithDistance = stations.map(station => {
      const [stationLng, stationLat] = station.location.coordinates;
      const distance = calculateDistance(latitude, longitude, stationLat, stationLng);
      
      return {
        _id: station._id,
        name: station.name,
        area: station.area,
        city: station.city,
        latitude: stationLat,
        longitude: stationLng,
        helpline: station.helpline,
        distance: distance.toFixed(2) + ' km'
      };
    });

    res.status(200).json({
      success: true,
      count: stationsWithDistance.length,
      data: stationsWithDistance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all police stations (public)
// @route   GET /api/stations/all
// @access  Public
const getAllStationsPublic = async (req, res) => {
  try {
    const stations = await PoliceStation.find();

    const formattedStations = stations.map(station => {
      const [lng, lat] = station.location.coordinates;
      return {
        _id: station._id,
        name: station.name,
        area: station.area,
        city: station.city,
        latitude: lat,
        longitude: lng,
        helpline: station.helpline,
        createdAt: station.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedStations.length,
      data: formattedStations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all police stations
// @route   GET /api/stations
// @access  Private (Admin)
const getAllStations = async (req, res) => {
  try {
    const stations = await PoliceStation.find();

    const formattedStations = stations.map(station => {
      const [lng, lat] = station.location.coordinates;
      return {
        _id: station._id,
        name: station.name,
        area: station.area,
        city: station.city,
        latitude: lat,
        longitude: lng,
        helpline: station.helpline,
        createdAt: station.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedStations.length,
      data: formattedStations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create police station
// @route   POST /api/stations
// @access  Private (Admin)
const createStation = async (req, res) => {
  try {
    const { name, area, city, latitude, longitude, helpline } = req.body;

    if (!name || !area || !city || !latitude || !longitude || !helpline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const station = await PoliceStation.create({
      name,
      area,
      city,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      helpline
    });

    const [lng, lat] = station.location.coordinates;

    res.status(201).json({
      success: true,
      data: {
        _id: station._id,
        name: station.name,
        area: station.area,
        city: station.city,
        latitude: lat,
        longitude: lng,
        helpline: station.helpline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create police account
// @route   POST /api/stations/create-police
// @access  Private (Admin)
const createPoliceAccount = async (req, res) => {
  try {
    const { name, email, password, phone, stationId } = req.body;

    if (!name || !email || !password || !phone || !stationId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if station exists
    const station = await PoliceStation.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found'
      });
    }

    // Check if police email already exists
    const policeExists = await Police.findOne({ email });
    if (policeExists) {
      return res.status(400).json({
        success: false,
        message: 'Police account already exists with this email'
      });
    }

    // Create police account
    const police = await Police.create({
      name,
      email,
      password,
      phone,
      stationId
    });

    res.status(201).json({
      success: true,
      data: {
        _id: police._id,
        name: police.name,
        email: police.email,
        phone: police.phone,
        station: station.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

module.exports = {
  getNearbyStations,
  getAllStations,
  getAllStationsPublic,
  createStation,
  createPoliceAccount
};
