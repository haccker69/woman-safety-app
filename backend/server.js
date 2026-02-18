const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://haccker69.github.io',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/police', require('./routes/policeRoutes'));
app.use('/api/guardians', require('./routes/guardianRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/stations', require('./routes/stationRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/travel-buddy', require('./routes/travelBuddyRoutes'));
app.use('/api/travel-buddy-chat', require('./routes/travelBuddyChatRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Email test route (for debugging deployment)
app.get('/api/health/email-test', async (req, res) => {
  const testTo = req.query.to;
  if (!testTo) return res.status(400).json({ message: 'Add ?to=youremail@gmail.com' });
  try {
    const { sendVerificationEmail } = require('./utils/emailService');
    await sendVerificationEmail(testTo, 'Test User', '123456');
    res.json({ success: true, message: `Test email sent to ${testTo}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.code });
  }
});

// Error handler (must be after routes)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Women Safety & Security System - Backend Server    ║
║                                                       ║
║   Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
