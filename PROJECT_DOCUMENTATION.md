# Women Safety & Security System
## Complete Project Documentation

---

## 📌 PROJECT OVERVIEW

A full-stack MERN application designed to enhance women's safety through real-time emergency alerts, complaint management, and location-based police station services.

### Key Capabilities
- **Emergency SOS System**: One-tap alerts to guardians with GPS location
- **Smart Police Station Finder**: Geospatial search within 5km radius
- **Complaint Management**: End-to-end tracking from filing to resolution
- **Role-Based Access**: Separate interfaces for Users, Police, and Admins
- **Email Notifications**: Automated emergency alerts with Google Maps integration

---

## 🏗 SYSTEM ARCHITECTURE

### Backend Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│         (React App / Mobile App / Postman)              │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTP/HTTPS
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                │   │
│  │  • CORS                                          │   │
│  │  • Body Parser                                   │   │
│  │  • JWT Authentication                            │   │
│  │  • Role Authorization                            │   │
│  │  • Error Handler                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Route Layer                                     │   │
│  │  /api/auth      → Authentication routes         │   │
│  │  /api/guardians → Guardian management           │   │
│  │  /api/sos       → Emergency SOS                  │   │
│  │  /api/stations  → Police stations                │   │
│  │  /api/complaints → Complaint management          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Controller Layer                                │   │
│  │  Business logic & request handling               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Layer                                   │   │
│  │  • Email Service (Nodemailer)                    │   │
│  │  • Token Generation (JWT)                        │   │
│  │  • Location Services                             │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ Mongoose ODM
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                        │
│                    MongoDB                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Collections:                                    │   │
│  │  • users (with 2dsphere index)                   │   │
│  │  • police                                        │   │
│  │  • admins                                        │   │
│  │  • policestations (with 2dsphere index)          │   │
│  │  • complaints (with 2dsphere index)              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA DESIGN

### 1. User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  phone: String,
  guardians: [
    {
      _id: ObjectId,
      name: String,
      phone: String,
      email: String
    }
  ],
  location: {
    type: "Point",
    coordinates: [longitude, latitude]  // GeoJSON format
  },
  role: "user",
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- email (unique)
- location (2dsphere for geospatial queries)
```

### 2. Police Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  phone: String,
  stationId: ObjectId (ref: PoliceStation),
  role: "police",
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- email (unique)
- stationId (for query optimization)
```

### 3. Admin Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### 4. PoliceStation Collection
```javascript
{
  _id: ObjectId,
  name: String,
  area: String,
  city: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  helpline: String,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- location (2dsphere for nearby search)
```

### 5. Complaint Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  stationId: ObjectId (ref: PoliceStation),
  description: String,
  status: Enum["Pending", "In Progress", "Resolved"],
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- userId (for user queries)
- stationId (for police queries)
- status (for filtering)
- location (2dsphere)
```

---

## 🔐 SECURITY IMPLEMENTATION

### 1. Authentication Flow
```
User Login Request
      ↓
Email/Password Validation
      ↓
bcrypt.compare(password, hashedPassword)
      ↓
Generate JWT Token
{
  payload: { id: userId, role: userRole },
  secret: JWT_SECRET,
  expiresIn: 30d
}
      ↓
Return Token to Client
      ↓
Client stores in localStorage/sessionStorage
      ↓
Include in subsequent requests:
Authorization: Bearer <token>
```

### 2. Authorization Middleware
```javascript
// Protect middleware
1. Extract token from Authorization header
2. Verify token using JWT_SECRET
3. Decode payload { id, role }
4. Fetch user from database
5. Attach user to req.user
6. Call next()

// Authorize middleware
1. Check if req.userRole matches allowed roles
2. If yes → next()
3. If no → 403 Forbidden
```

### 3. Password Security
- Hashing Algorithm: bcryptjs
- Salt Rounds: 10
- Pre-save hook encrypts passwords automatically
- Passwords never returned in API responses (select: false)

---

## 📧 EMAIL SYSTEM ARCHITECTURE

### SOS Email Flow
```
User Triggers SOS
      ↓
1. Validate user has guardians
2. Update user location in DB
      ↓
3. For each guardian:
   ┌─────────────────────────────┐
   │ Create Email Content        │
   │ - Emergency header          │
   │ - User details              │
   │ - Current location          │
   │ - Google Maps link          │
   │ - Timestamp                 │
   └─────────────────────────────┘
      ↓
4. Send via Nodemailer
   {
     host: smtp.gmail.com,
     port: 587,
     auth: { user, pass }
   }
      ↓
5. Promise.all() - Send to all guardians
      ↓
6. Return success response
```

### Email Template Structure
```html
<div style="background: #fff3cd; border: 2px solid #ff0000;">
  <h1>⚠️ EMERGENCY ALERT ⚠️</h1>
  
  <div>User: {userName}</div>
  <div>Phone: {userPhone}</div>
  <div>Location: {lat}, {lng}</div>
  
  <a href="https://www.google.com/maps?q={lat},{lng}">
    📍 VIEW LOCATION ON GOOGLE MAPS
  </a>
  
  <div>Timestamp: {timestamp}</div>
</div>
```

---

## 🗺 GEOSPATIAL QUERIES

### MongoDB 2dsphere Indexes
```javascript
// Automatically created in db.js
db.policestations.createIndex({ location: "2dsphere" })
db.users.createIndex({ location: "2dsphere" })
db.complaints.createIndex({ location: "2dsphere" })
```

### Nearby Police Station Query
```javascript
PoliceStation.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: 5000  // 5km in meters
    }
  }
}).limit(10)
```

### Distance Calculation (Haversine Formula)
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * π / 180;
  const dLon = (lon2 - lon1) * π / 180;
  
  const a = 
    sin(dLat/2) * sin(dLat/2) +
    cos(lat1 * π/180) * cos(lat2 * π/180) *
    sin(dLon/2) * sin(dLon/2);
  
  const c = 2 * atan2(sqrt(a), sqrt(1-a));
  return R * c;
}
```

---

## 🔄 API WORKFLOW DIAGRAMS

### User Registration & Login Flow
```
┌──────────────┐
│ User Signup  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ POST /api/auth/user/register │
│ { name, email, password,     │
│   phone }                    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Validate Input           │
│ Check email uniqueness   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Hash password (bcrypt)   │
│ Create user document     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Generate JWT token       │
│ Return user + token      │
└──────────────────────────┘
```

### SOS Alert Flow
```
┌────────────────┐
│ User presses   │
│ SOS Button     │
└────────┬───────┘
         │
         ▼
┌─────────────────────────┐
│ POST /api/sos/alert     │
│ { lat, lng }            │
│ Authorization: Bearer   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Verify JWT token        │
│ Get user from DB        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Check guardians exist   │
│ (at least 1 required)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Update user location    │
│ coordinates: [lng, lat] │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ For each guardian:      │
│ • Build email HTML      │
│ • Create Maps link      │
│ • Send via Nodemailer   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Return success          │
│ { guardianCount,        │
│   location, timestamp } │
└─────────────────────────┘
```

### Complaint Filing Flow
```
┌────────────────┐
│ User files     │
│ complaint      │
└────────┬───────┘
         │
         ▼
┌──────────────────────────────┐
│ Search nearby stations       │
│ GET /api/stations/nearby     │
│ ?lat={lat}&lng={lng}         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ User selects station         │
│ Fills description            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ POST /api/complaints         │
│ { description, stationId,    │
│   lat, lng }                 │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Validate station exists      │
│ Create complaint doc         │
│ Status: "Pending"            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return complaint with        │
│ populated station & user     │
└──────────────────────────────┘
```

### Police Status Update Flow
```
┌────────────────┐
│ Police login   │
└────────┬───────┘
         │
         ▼
┌──────────────────────────────┐
│ GET /api/complaints/station  │
│ Authorization: Bearer        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Filter by police stationId   │
│ Return assigned complaints   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Police updates status        │
│ PUT /api/complaints/:id      │
│ { status: "In Progress" }    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Verify complaint belongs to  │
│ police station               │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Update status                │
│ Return updated complaint     │
└──────────────────────────────┘
```

---

## 📁 COMPLETE FILE STRUCTURE

```
women-safety-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── adminAuthController.js   # Admin authentication
│   │   ├── complaintController.js   # Complaint CRUD
│   │   ├── guardianController.js    # Guardian management
│   │   ├── policeAuthController.js  # Police authentication
│   │   ├── sosController.js         # SOS & location
│   │   ├── stationController.js     # Station management
│   │   └── userAuthController.js    # User authentication
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── errorHandler.js          # Error handling
│   │
│   ├── models/
│   │   ├── Admin.js                 # Admin schema
│   │   ├── Complaint.js             # Complaint schema
│   │   ├── Police.js                # Police schema
│   │   ├── PoliceStation.js         # Station schema
│   │   └── User.js                  # User schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── complaintRoutes.js       # Complaint endpoints
│   │   ├── guardianRoutes.js        # Guardian endpoints
│   │   ├── sosRoutes.js             # SOS endpoints
│   │   └── stationRoutes.js         # Station endpoints
│   │
│   ├── utils/
│   │   ├── emailService.js          # Email sending
│   │   └── generateToken.js         # JWT generation
│   │
│   ├── .env.example                 # Environment template
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Dependencies
│   ├── README.md                    # Documentation
│   ├── seedAdmin.js                 # Create admin
│   ├── server.js                    # Entry point
│   └── TESTING.md                   # API testing guide
│
└── frontend/                        # (To be created)
    └── (React app files)
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Configuration
- [ ] Change JWT_SECRET to strong random string
- [ ] Update MONGODB_URI for production database
- [ ] Configure email credentials (Gmail App Password)
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Set secure CORS origin

### Security Hardening
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Add helmet.js for security headers
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Implement input sanitization
- [ ] Add request validation

### Database Optimization
- [ ] Create necessary indexes
- [ ] Set up MongoDB replica set
- [ ] Configure automatic backups
- [ ] Monitor query performance
- [ ] Implement connection pooling

### Monitoring & Logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Implement logging (Winston/Morgan)
- [ ] Monitor API performance
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failures

---

## 📈 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- Use PM2 cluster mode for Node.js
- Deploy multiple backend instances
- Implement load balancing (NGINX)
- Use Redis for session management

### Database Scaling
- MongoDB sharding for large datasets
- Read replicas for query distribution
- Index optimization for frequent queries
- Archive old complaints periodically

### Caching Strategy
- Redis for frequently accessed data
- Cache police station locations
- Cache user guardian lists
- Implement cache invalidation

---

## 🔧 MAINTENANCE TASKS

### Daily
- Monitor error logs
- Check email delivery status
- Review SOS alert triggers

### Weekly
- Database backup verification
- API performance review
- Security log audit

### Monthly
- Dependency updates
- Security patches
- Database cleanup (old data)
- Performance optimization

---

## 📞 SUPPORT & DOCUMENTATION

### For Developers
- Backend README.md - Complete API documentation
- TESTING.md - Postman testing guide
- Code comments for complex logic
- Environment variable documentation

### For Users
- (Frontend documentation to be created)
- User manual
- FAQ section
- Video tutorials

---

**Project Status**: Backend Complete ✅
**Next Step**: Frontend Development with React
**Technology**: MERN Stack (MongoDB, Express, React, Node.js)

---

*Built with ❤️ for Women Safety & Security*
