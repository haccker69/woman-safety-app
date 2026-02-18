# API Testing Guide - Postman Collection

## Step-by-Step Testing Instructions

### Prerequisites
1. Start MongoDB server
2. Start backend server: `npm run dev`
3. Create admin account: `node seedAdmin.js`

---

## 1. ADMIN WORKFLOW

### 1.1 Admin Login
```
POST http://localhost:5000/api/auth/admin/login

Body (JSON):
{
  "email": "admin@womensafety.com",
  "password": "admin123"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "System Admin",
    "email": "admin@womensafety.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

💾 Save the token as 'adminToken'
```

### 1.2 Create Police Station
```
POST http://localhost:5000/api/stations
Authorization: Bearer {{adminToken}}

Body (JSON):
{
  "name": "Central Police Station",
  "area": "Connaught Place",
  "city": "New Delhi",
  "latitude": 28.6304,
  "longitude": 77.2177,
  "helpline": "100"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Central Police Station",
    "area": "Connaught Place",
    "city": "New Delhi",
    "latitude": 28.6304,
    "longitude": 77.2177,
    "helpline": "100"
  }
}

💾 Save the station '_id' as 'stationId'
```

### 1.3 Create Police Account
```
POST http://localhost:5000/api/stations/create-police
Authorization: Bearer {{adminToken}}

Body (JSON):
{
  "name": "Officer Rajesh Kumar",
  "email": "rajesh@police.com",
  "password": "police123",
  "phone": "9876543210",
  "stationId": "{{stationId}}"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Officer Rajesh Kumar",
    "email": "rajesh@police.com",
    "phone": "9876543210",
    "station": "Central Police Station"
  }
}
```

### 1.4 View All Stations
```
GET http://localhost:5000/api/stations
Authorization: Bearer {{adminToken}}
```

---

## 2. USER WORKFLOW

### 2.1 User Registration
```
POST http://localhost:5000/api/auth/user/register

Body (JSON):
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "user123",
  "phone": "9123456789"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "9123456789",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

💾 Save the token as 'userToken'
```

### 2.2 User Login
```
POST http://localhost:5000/api/auth/user/login

Body (JSON):
{
  "email": "priya@example.com",
  "password": "user123"
}

💾 Save the token as 'userToken'
```

### 2.3 Add Guardian #1
```
POST http://localhost:5000/api/guardians
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "name": "Amit Sharma",
  "phone": "9988776655",
  "email": "amit@example.com"
}

Expected Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Amit Sharma",
      "phone": "9988776655",
      "email": "amit@example.com"
    }
  ]
}

💾 Save guardian '_id' as 'guardianId'
```

### 2.4 Add Guardian #2
```
POST http://localhost:5000/api/guardians
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "name": "Neha Verma",
  "phone": "8877665544",
  "email": "neha@example.com"
}
```

### 2.5 Get All Guardians
```
GET http://localhost:5000/api/guardians
Authorization: Bearer {{userToken}}
```

### 2.6 Update Guardian
```
PUT http://localhost:5000/api/guardians/{{guardianId}}
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "name": "Amit Kumar Sharma",
  "phone": "9988776655",
  "email": "amitkumar@example.com"
}
```

### 2.7 Update User Location
```
PUT http://localhost:5000/api/sos/location
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "lat": 28.6139,
  "lng": 77.2090
}

Expected Response:
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "lat": 28.6139,
    "lng": 77.2090
  }
}
```

### 2.8 Search Nearby Police Stations
```
GET http://localhost:5000/api/stations/nearby?lat=28.6139&lng=77.2090
Authorization: Bearer {{userToken}}

Expected Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "name": "Central Police Station",
      "area": "Connaught Place",
      "city": "New Delhi",
      "latitude": 28.6304,
      "longitude": 77.2177,
      "helpline": "100",
      "distance": "2.34 km"
    }
  ]
}

💾 Save station '_id' for complaint filing
```

### 2.9 Trigger SOS Alert (⚠️ This sends real emails!)
```
POST http://localhost:5000/api/sos/alert
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "lat": 28.6139,
  "lng": 77.2090
}

Expected Response:
{
  "success": true,
  "message": "SOS alert sent to 2 guardian(s)",
  "data": {
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "guardianCount": 2,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}

✅ Guardians will receive emergency email with Google Maps link
```

### 2.10 Create Complaint
```
POST http://localhost:5000/api/complaints
Authorization: Bearer {{userToken}}

Body (JSON):
{
  "description": "Eve-teasing incident near bus stop. Need immediate attention.",
  "stationId": "{{stationId}}",
  "lat": 28.6139,
  "lng": 77.2090
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "description": "Eve-teasing incident near bus stop...",
    "status": "Pending",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "station": {
      "_id": "...",
      "name": "Central Police Station",
      "area": "Connaught Place",
      "city": "New Delhi",
      "helpline": "100"
    },
    "user": {
      "_id": "...",
      "name": "Priya Sharma",
      "phone": "9123456789",
      "email": "priya@example.com"
    },
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}

💾 Save complaint '_id' as 'complaintId'
```

### 2.11 View My Complaints
```
GET http://localhost:5000/api/complaints/my-complaints
Authorization: Bearer {{userToken}}
```

---

## 3. POLICE WORKFLOW

### 3.1 Police Login
```
POST http://localhost:5000/api/auth/police/login

Body (JSON):
{
  "email": "rajesh@police.com",
  "password": "police123"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Officer Rajesh Kumar",
    "email": "rajesh@police.com",
    "phone": "9876543210",
    "role": "police",
    "station": {
      "_id": "...",
      "name": "Central Police Station",
      "area": "Connaught Place",
      "city": "New Delhi",
      "helpline": "100"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

💾 Save the token as 'policeToken'
```

### 3.2 View Station Complaints
```
GET http://localhost:5000/api/complaints/station
Authorization: Bearer {{policeToken}}

Expected Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "description": "Eve-teasing incident near bus stop...",
      "status": "Pending",
      "location": {
        "lat": 28.6139,
        "lng": 77.2090
      },
      "user": {
        "_id": "...",
        "name": "Priya Sharma",
        "phone": "9123456789",
        "email": "priya@example.com"
      },
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

### 3.3 Update Complaint to "In Progress"
```
PUT http://localhost:5000/api/complaints/{{complaintId}}/status
Authorization: Bearer {{policeToken}}

Body (JSON):
{
  "status": "In Progress"
}

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "description": "Eve-teasing incident near bus stop...",
    "status": "In Progress",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "user": {...},
    "station": {...},
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 3.4 Update Complaint to "Resolved"
```
PUT http://localhost:5000/api/complaints/{{complaintId}}/status
Authorization: Bearer {{policeToken}}

Body (JSON):
{
  "status": "Resolved"
}
```

---

## 4. ADMIN MONITORING

### 4.1 View All Complaints
```
GET http://localhost:5000/api/complaints/all
Authorization: Bearer {{adminToken}}
```

### 4.2 View Emergency Locations
```
GET http://localhost:5000/api/complaints/emergency-locations
Authorization: Bearer {{adminToken}}

Expected Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "name": "Priya Sharma",
      "phone": "9123456789",
      "email": "priya@example.com",
      "location": {
        "lat": 28.6139,
        "lng": 77.2090
      }
    }
  ]
}
```

---

## 5. ERROR TESTING

### 5.1 Test Invalid Login
```
POST http://localhost:5000/api/auth/user/login

Body (JSON):
{
  "email": "wrong@example.com",
  "password": "wrongpass"
}

Expected Response (401):
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 5.2 Test Unauthorized Access
```
GET http://localhost:5000/api/guardians
(No Authorization header)

Expected Response (401):
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

### 5.3 Test Role Authorization
```
GET http://localhost:5000/api/stations
Authorization: Bearer {{userToken}}
(User trying to access admin route)

Expected Response (403):
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

### 5.4 Test Duplicate Email Registration
```
POST http://localhost:5000/api/auth/user/register

Body (JSON):
{
  "name": "Test User",
  "email": "priya@example.com",
  "password": "test123",
  "phone": "1111111111"
}

Expected Response (400):
{
  "success": false,
  "message": "User already exists with this email"
}
```

---

## 📝 Postman Environment Variables

Create these variables in Postman environment:

```
baseUrl: http://localhost:5000/api
userToken: (set after user login)
policeToken: (set after police login)
adminToken: (set after admin login)
stationId: (set after creating station)
guardianId: (set after adding guardian)
complaintId: (set after creating complaint)
```

---

## ✅ Complete Test Checklist

- [ ] Admin can login
- [ ] Admin can create police stations
- [ ] Admin can create police accounts
- [ ] Admin can view all stations
- [ ] Admin can view all complaints
- [ ] Admin can view emergency locations
- [ ] User can register
- [ ] User can login
- [ ] User can add guardians (max 5)
- [ ] User can edit guardians
- [ ] User can delete guardians
- [ ] User can update location
- [ ] User can search nearby stations
- [ ] User can trigger SOS (emails sent)
- [ ] User can create complaints
- [ ] User can view their complaints
- [ ] Police can login
- [ ] Police can view station complaints
- [ ] Police can update complaint status
- [ ] Unauthorized requests are blocked
- [ ] Role-based access works
- [ ] Invalid credentials are rejected

---

## 🎯 Quick Test Sequence

1. Run seed: `node seedAdmin.js`
2. Login as admin → Create station → Create police
3. Register user → Add guardians → Update location
4. Search nearby stations → File complaint
5. Login as police → View complaints → Update status
6. Test SOS alert (verify emails)
7. Login as admin → Monitor all data

---

**Note**: Before testing SOS alerts, ensure your email credentials in `.env` are correctly configured!
