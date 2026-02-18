# Women Safety & Security System - Backend

A production-ready backend API built with Node.js, Express.js, and MongoDB for a comprehensive women safety and security system.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)

## ✨ Features

### User Module
- JWT-based authentication
- Guardian management (add/edit/delete)
- Real-time location tracking
- SOS emergency alerts with email notifications
- Nearby police station search (5km radius)
- Complaint filing and tracking

### Police Module
- Secure login system
- View assigned complaints
- Update complaint status (Pending/In Progress/Resolved)

### Admin Module
- Police station management
- Police account creation
- View all complaints
- Monitor user emergency locations

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email Service**: Nodemailer
- **Geospatial Queries**: MongoDB 2dsphere indexes

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── adminAuthController.js
│   ├── complaintController.js
│   ├── guardianController.js
│   ├── policeAuthController.js
│   ├── sosController.js
│   ├── stationController.js
│   └── userAuthController.js
├── middleware/
│   ├── auth.js               # JWT authentication & authorization
│   └── errorHandler.js       # Global error handler
├── models/
│   ├── Admin.js
│   ├── Complaint.js
│   ├── Police.js
│   ├── PoliceStation.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── complaintRoutes.js
│   ├── guardianRoutes.js
│   ├── sosRoutes.js
│   └── stationRoutes.js
├── utils/
│   ├── emailService.js       # Email sending utility
│   └── generateToken.js      # JWT token generator
├── .env.example
├── .gitignore
├── package.json
├── seedAdmin.js              # Create initial admin account
└── server.js                 # Entry point
```

## 🚀 Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Update environment variables** (see next section)

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/women_safety_db

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# Email Configuration (Gmail Example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup for Nodemailer

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Use this password in `EMAIL_PASSWORD`

## 💾 Database Setup

1. **Install MongoDB**
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud)

2. **Start MongoDB** (if local)
```bash
mongod
```

3. **Create initial admin account**
```bash
npm run seed-admin
```

This will create:
- Email: `admin@womensafety.com`
- Password: `admin123`
- ⚠️ Change password after first login!

## ▶️ Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will start on `http://localhost:5000`

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### User Registration
```http
POST /auth/user/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

#### User Login
```http
POST /auth/user/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "password123"
}
```

#### Police Login
```http
POST /auth/police/login
Content-Type: application/json

{
  "email": "officer@police.com",
  "password": "password123"
}
```

#### Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@womensafety.com",
  "password": "admin123"
}
```

### Guardian Management (User Only)

#### Get All Guardians
```http
GET /guardians
Authorization: Bearer <token>
```

#### Add Guardian
```http
POST /guardians
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com"
}
```

#### Update Guardian
```http
PUT /guardians/:guardianId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "9876543210",
  "email": "johnsmith@example.com"
}
```

#### Delete Guardian
```http
DELETE /guardians/:guardianId
Authorization: Bearer <token>
```

### SOS Emergency (User Only)

#### Update Location
```http
PUT /sos/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "lat": 28.6139,
  "lng": 77.2090
}
```

#### Get Current Location
```http
GET /sos/location
Authorization: Bearer <token>
```

#### Trigger SOS Alert
```http
POST /sos/alert
Authorization: Bearer <token>
Content-Type: application/json

{
  "lat": 28.6139,
  "lng": 77.2090
}
```

Response: Sends email alerts to all guardians with Google Maps link.

### Police Stations

#### Search Nearby Stations (User Only)
```http
GET /stations/nearby?lat=28.6139&lng=77.2090
Authorization: Bearer <token>
```

Returns stations within 5km radius.

#### Get All Stations (Admin Only)
```http
GET /stations
Authorization: Bearer <token>
```

#### Create Police Station (Admin Only)
```http
POST /stations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Central Police Station",
  "area": "Downtown",
  "city": "New Delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "helpline": "100"
}
```

#### Create Police Account (Admin Only)
```http
POST /stations/create-police
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Officer Smith",
  "email": "smith@police.com",
  "password": "password123",
  "phone": "1234567890",
  "stationId": "station_mongodb_id"
}
```

### Complaints

#### Create Complaint (User Only)
```http
POST /complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Harassment complaint",
  "stationId": "station_mongodb_id",
  "lat": 28.6139,
  "lng": 77.2090
}
```

#### Get My Complaints (User Only)
```http
GET /complaints/my-complaints
Authorization: Bearer <token>
```

#### Get Station Complaints (Police Only)
```http
GET /complaints/station
Authorization: Bearer <token>
```

#### Update Complaint Status (Police Only)
```http
PUT /complaints/:complaintId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In Progress"
}
```

Status options: `Pending`, `In Progress`, `Resolved`

#### Get All Complaints (Admin Only)
```http
GET /complaints/all
Authorization: Bearer <token>
```

#### Get Emergency Locations (Admin Only)
```http
GET /complaints/emergency-locations
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

## 🔒 Security Features

1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access Control**: User, Police, Admin roles
4. **CORS Protection**: Configured for specific frontend origin
5. **Input Validation**: Mongoose schema validation
6. **Error Handling**: Centralized error handling middleware

## 🧪 Testing with Postman

1. Import the API endpoints into Postman
2. Create environment variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `userToken`: (set after login)
   - `policeToken`: (set after login)
   - `adminToken`: (set after login)

3. Test flow:
   - Register user
   - Login and save token
   - Add guardians
   - Update location
   - Search nearby stations
   - Trigger SOS alert
   - File complaint

## 📝 Notes

- Geospatial queries require MongoDB 2dsphere indexes (auto-created)
- SOS emails include Google Maps links for guardian convenience
- Maximum 5 guardians per user
- Distance calculations use Haversine formula
- All coordinates in [longitude, latitude] format (GeoJSON)

## 🤝 Support

For issues or questions, please check the documentation or create an issue.

---

Built with ❤️ for Women Safety & Security
