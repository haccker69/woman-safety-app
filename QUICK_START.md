# 🚀 QUICK START GUIDE
## Women Safety & Security System - Backend Setup

---

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/women_safety_db
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

**Gmail Setup for Emails:**
1. Enable 2-Factor Authentication in Google Account
2. Go to: Account → Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Copy 16-character password to `EMAIL_PASSWORD`

### Step 3: Start MongoDB
```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Update MONGODB_URI with Atlas connection string
```

### Step 4: Create Admin Account
```bash
node seedAdmin.js
```

**Default Admin Credentials:**
- Email: `admin@womensafety.com`
- Password: `admin123`
- ⚠️ Change after first login!

### Step 5: Start Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server runs at: `http://localhost:5000`

---

## 🧪 Test the API

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@womensafety.com",
    "password": "admin123"
  }'
```

### 3. Use Postman
1. Import endpoints from `TESTING.md`
2. Follow the step-by-step testing guide
3. Test all user flows: Register → Add Guardians → SOS Alert

---

## 📁 Project Structure

```
backend/
├── config/           # Database connection
├── controllers/      # Business logic
├── middleware/       # Auth & error handling
├── models/          # MongoDB schemas
├── routes/          # API endpoints
├── utils/           # Helper functions
├── .env             # Environment variables
├── server.js        # Entry point
├── seedAdmin.js     # Create admin
└── package.json     # Dependencies
```

---

## 🔑 Key Features Implemented

✅ **Authentication System**
- JWT-based auth for User, Police, Admin
- Secure password hashing (bcrypt)
- Role-based access control

✅ **User Module**
- Registration & Login
- Guardian Management (CRUD)
- Location Tracking
- SOS Emergency Alerts
- Nearby Police Station Search
- Complaint Filing

✅ **Police Module**
- Login System
- View Station Complaints
- Update Complaint Status

✅ **Admin Module**
- Police Station Management
- Police Account Creation
- View All Complaints
- Monitor Emergency Locations

✅ **Additional Features**
- Email Alerts with Google Maps links
- Geospatial queries (5km radius)
- Production-ready error handling
- Comprehensive API documentation

---

## 📚 Documentation Files

- **README.md** - Complete API documentation
- **TESTING.md** - Postman testing guide with all endpoints
- **PROJECT_DOCUMENTATION.md** - Technical architecture & workflows

---

## 🛠 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Create admin account
node seedAdmin.js

# Check if MongoDB is running
mongosh
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB with `mongod` command

### Email Not Sending
**Solution**: 
1. Check Gmail App Password (not regular password)
2. Verify EMAIL_USER and EMAIL_PASSWORD in .env
3. Ensure 2FA is enabled on Gmail account

### JWT Token Invalid
**Solution**: Check JWT_SECRET matches in .env file

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in .env or kill process using port 5000

---

## 📊 Database Collections Created

1. **users** - User accounts with guardians & location
2. **police** - Police accounts linked to stations
3. **admins** - Admin accounts
4. **policestations** - Station info with coordinates
5. **complaints** - User complaints with tracking

All collections have proper indexes including 2dsphere for geospatial queries.

---

## 🔐 Default Credentials

**Admin Account:**
- Email: admin@womensafety.com
- Password: admin123

**Create Your Own:**
- User: Register via `/api/auth/user/register`
- Police: Admin creates via `/api/stations/create-police`

---

## 🎯 Next Steps

1. ✅ Backend is complete and ready
2. ⏳ Frontend development (React app)
3. ⏳ Deploy to production server
4. ⏳ Mobile app development (optional)

---

## 💡 Pro Tips

1. **Use Postman Environment Variables** for easy testing
2. **Read TESTING.md** for complete API testing workflow
3. **Check logs** if SOS emails fail - likely email config issue
4. **Use MongoDB Compass** for visual database management
5. **Enable CORS** for frontend once it's built

---

## 📞 Need Help?

- Check README.md for detailed API docs
- Review TESTING.md for endpoint examples
- Read PROJECT_DOCUMENTATION.md for architecture details

---

**You're all set! 🎉**

The backend is production-ready. You can now:
1. Test all APIs using Postman
2. Build the React frontend
3. Deploy to cloud platforms

---

*Happy coding! 👩‍💻👨‍💻*
