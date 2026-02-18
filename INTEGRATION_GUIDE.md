# 🔗 FULL STACK INTEGRATION GUIDE
## Connecting React Frontend to Node.js Backend

---

## 📋 Overview

This guide explains how to connect the React frontend to the Node.js/Express backend for the Women Safety & Security System.

---

## 🚀 Quick Integration (5 Minutes)

### Step 1: Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB and email credentials
node seedAdmin.js
npm run dev
```
Backend runs at: **http://localhost:5000**

### Step 2: Start Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env to point to backend
npm run dev
```
Frontend runs at: **http://localhost:3000**

### Step 3: Test Connection
1. Open http://localhost:3000
2. Click "Login"
3. Use admin credentials:
   - Email: `admin@womensafety.com`
   - Password: `admin123`
4. If login succeeds → Integration working! ✅

---

## 🔧 Detailed Setup

### Prerequisites

✅ MongoDB installed and running  
✅ Node.js 16+ installed  
✅ Both backend and frontend dependencies installed  

### Backend Configuration

**1. Environment Variables** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/women_safety_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**2. CORS Configuration** (already set in backend):
```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**3. Start Backend**:
```bash
cd backend
npm run dev
```

Verify at: http://localhost:5000/api/health

### Frontend Configuration

**1. Environment Variables** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_APP_NAME=Women Safety System
```

**2. Proxy Configuration** (already set in frontend):
```javascript
// frontend/vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

**3. Start Frontend**:
```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

---

## 🧪 Testing the Integration

### Test 1: Health Check

**Backend Health:**
```bash
curl http://localhost:5000/api/health
```

Expected:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: Admin Login

**Via Browser:**
1. Go to http://localhost:3000/login
2. Select "Admin"
3. Enter:
   - Email: `admin@womensafety.com`
   - Password: `admin123`
4. Click "Sign in"

**Expected Result:**
- Redirects to `/admin/dashboard`
- Shows admin name in navbar
- Sidebar shows admin menu

**Via API (curl):**
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@womensafety.com","password":"admin123"}'
```

### Test 3: User Registration

**Via Browser:**
1. Go to http://localhost:3000/register
2. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Phone: 1234567890
   - Password: test123
3. Click "Create Account"

**Expected Result:**
- Success message
- Redirects to `/login`
- Can now login with these credentials

### Test 4: User Login

**Via Browser:**
1. Login with registered user
2. Should redirect to `/user/dashboard`
3. Dashboard should show:
   - Welcome message with user name
   - Quick action cards
   - Statistics

### Test 5: SOS Alert

**Prerequisites**: Add at least one guardian first

1. Navigate to `/user/sos`
2. Click "Get My Location" (allow browser permission)
3. Location should display
4. Click the SOS button
5. Confirm alert

**Expected Result:**
- Success toast notification
- Email sent to all guardians
- Last alert info displayed

---

## 🔍 API Integration Points

### Authentication Flow

```
Frontend                          Backend
   |                                |
   |  POST /api/auth/user/login     |
   |------------------------------>|
   |                                |
   |      { email, password }       |
   |                                |
   |                                | Verify credentials
   |                                | Generate JWT token
   |                                |
   |  { user, token, role }        |
   |<------------------------------|
   |                                |
   | Store in localStorage:         |
   | - token                        |
   | - user                         |
   | - role                         |
   |                                |
   | Subsequent requests:           |
   | Authorization: Bearer {token}  |
   |------------------------------>|
```

### Data Flow Examples

**1. Guardian Management**

```javascript
// Frontend: src/pages/user/GuardiansPage.jsx
const fetchGuardians = async () => {
  const response = await guardianAPI.getGuardians();
  // Axios automatically adds Authorization header
  setGuardians(response.data.data);
};
```

**2. SOS Alert**

```javascript
// Frontend: src/pages/user/SOSPage.jsx
const triggerSOS = async () => {
  const response = await sosAPI.triggerSOS({
    lat: location.lat,
    lng: location.lng,
  });
  // Backend sends emails to guardians
  toast.success('Alert sent!');
};
```

**3. Complaint Creation**

```javascript
// Frontend: Create complaint form
const handleSubmit = async (formData) => {
  await complaintAPI.createComplaint({
    description: formData.description,
    stationId: selectedStation._id,
    lat: userLocation.lat,
    lng: userLocation.lng,
  });
  navigate('/user/complaints');
};
```

---

## 🛡️ Security Integration

### JWT Token Flow

**Login:**
```javascript
// Frontend stores token
localStorage.setItem('token', response.data.data.token);
```

**Authenticated Requests:**
```javascript
// Axios interceptor (src/services/api.js) automatically adds:
headers: { Authorization: `Bearer ${token}` }
```

**Backend Verification:**
```javascript
// Middleware checks token validity
// Attaches user to req.user
// Verifies role permissions
```

### Role-Based Access

```
User Login
    ↓
Frontend checks role
    ↓
Redirects to appropriate dashboard
    ↓
All subsequent routes protected
    ↓
Backend validates role on each request
```

---

## 🚨 Common Integration Issues

### Issue 1: CORS Error

**Error:**
```
Access to fetch at 'http://localhost:5000/api/...' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```javascript
// Backend: server.js - Update CORS origin
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Or in .env
FRONTEND_URL=http://localhost:3000
```

### Issue 2: 401 Unauthorized

**Error:**
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

**Solution:**
1. Check token exists in localStorage
2. Verify Axios interceptor is adding header
3. Check token hasn't expired
4. Re-login if needed

### Issue 3: Connection Refused

**Error:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:**
1. Ensure backend is running
2. Check port 5000 is not in use
3. Verify `VITE_API_URL` in frontend `.env`

### Issue 4: 404 Not Found

**Error:**
```json
{
  "success": false,
  "message": "Route not found"
}
```

**Solution:**
1. Check API endpoint path
2. Verify route exists in backend
3. Check HTTP method (GET/POST/PUT/DELETE)

---

## 📊 Request/Response Examples

### User Registration

**Request:**
```javascript
POST /api/auth/user/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "1234567890",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Add Guardian

**Request:**
```javascript
POST /api/guardians
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j1",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    }
  ]
}
```

---

## 🔄 State Synchronization

### User State Management

```javascript
// Frontend: AuthContext
const [user, setUser] = useState(null);

// On login
setUser(response.data.data);
localStorage.setItem('user', JSON.stringify(response.data.data));

// On logout
setUser(null);
localStorage.removeItem('user');
localStorage.removeItem('token');
localStorage.removeItem('role');
```

### Real-time Updates

For features like complaint status updates:

```javascript
// Frontend: Poll for updates
useEffect(() => {
  const interval = setInterval(() => {
    fetchComplaints();
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## 📱 Mobile Considerations

### Geolocation on Mobile

```javascript
// Works on mobile browsers
const location = await getCurrentLocation();
// Request permission automatically
```

### Touch Events

```javascript
// SOS button - works with touch
<button
  onClick={triggerSOS}  // Works for both click and touch
  className="..."
>
```

### Responsive Breakpoints

```
Mobile: < 768px     → Sidebar collapses
Tablet: 768-1024px  → Adjusted grid
Desktop: > 1024px   → Full layout
```

---

## 🚀 Production Deployment

### Backend (Heroku/Railway/Render)

1. Set environment variables
2. Update MongoDB URI (MongoDB Atlas)
3. Update FRONTEND_URL to production URL
4. Deploy

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Set environment variables:
   - `VITE_API_URL=https://your-backend.herokuapp.com/api`
3. Deploy `dist/` folder
4. Configure redirects for SPA routing

### CORS for Production

```javascript
// Backend: server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'
  ],
  credentials: true
}));
```

---

## ✅ Integration Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Admin account seeded
- [ ] Environment variables set (both)
- [ ] CORS configured correctly
- [ ] Can access http://localhost:5000/api/health
- [ ] Can access http://localhost:3000
- [ ] Admin login works
- [ ] User registration works
- [ ] User login works
- [ ] Token stored in localStorage
- [ ] Protected routes redirect correctly
- [ ] API calls include Authorization header
- [ ] Guardians CRUD works
- [ ] SOS alert works (emails sent)
- [ ] Nearby stations display
- [ ] Complaint creation works
- [ ] No CORS errors in console
- [ ] No 401 errors in console

---

## 🎯 Testing the Complete Flow

### Complete User Journey

1. **Register**
   - Go to /register
   - Create account
   - Verify redirect to /login

2. **Login**
   - Login with credentials
   - Verify redirect to /user/dashboard
   - Check token in localStorage

3. **Add Guardians**
   - Navigate to /user/guardians
   - Add 2-3 guardians
   - Verify API call successful

4. **Update Location**
   - Go to /user/sos
   - Get current location
   - Verify coordinates displayed

5. **Trigger SOS**
   - Click SOS button
   - Confirm alert
   - Check email (guardians should receive)

6. **File Complaint**
   - Go to /user/create-complaint
   - Fill form
   - Submit
   - Check /user/complaints for new entry

7. **Logout**
   - Click logout
   - Verify redirect to /login
   - Check localStorage cleared

---

**Integration Complete! 🎉**

Your full-stack MERN application is now connected and ready to use!

---
