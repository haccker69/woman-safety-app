# Women Safety & Security System - Frontend

A modern, responsive React frontend built with Vite, Tailwind CSS, and React Router for the Women Safety & Security System.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Available Routes](#available-routes)
- [Component Guide](#component-guide)
- [API Integration](#api-integration)

## ✨ Features

### User Module
- ✅ User Registration & Login
- ✅ Emergency SOS Alert Button with Location
- ✅ Guardian Management (Add/Edit/Delete up to 5)
- ✅ Nearby Police Stations with Google Maps
- ✅ Complaint Filing & Tracking
- ✅ User Profile & Dashboard

### Police Module
- ✅ Police Dashboard with Statistics
- ✅ View & Manage Station Complaints
- ✅ Update Complaint Status (Pending/In Progress/Resolved)

### Admin Module
- ✅ Admin Dashboard Overview
- ✅ Create & Manage Police Stations
- ✅ Create Police Accounts
- ✅ View All Complaints
- ✅ Monitor Emergency User Locations

## 🛠 Tech Stack

- **Framework**: React 18.2 with Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS 3.3
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Maps**: @react-google-maps/api

## 📁 Project Structure

```
frontend/
├── public/                       # Static assets
├── src/
│   ├── components/              # Reusable components
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── Sidebar.jsx         # Role-based sidebar navigation
│   │   └── Loading.jsx         # Loading spinner
│   │
│   ├── pages/                  # Page components
│   │   ├── common/             # Public pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── user/               # User module pages
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── SOSPage.jsx
│   │   │   ├── GuardiansPage.jsx
│   │   │   ├── NearbyPolicePage.jsx
│   │   │   ├── CreateComplaintPage.jsx
│   │   │   ├── UserComplaintsPage.jsx
│   │   │   └── UserProfilePage.jsx
│   │   │
│   │   ├── police/             # Police module pages
│   │   │   ├── PoliceDashboard.jsx
│   │   │   └── PoliceComplaintsPage.jsx
│   │   │
│   │   └── admin/              # Admin module pages
│   │       ├── AdminDashboard.jsx
│   │       ├── ManageStationsPage.jsx
│   │       ├── ManagePoliceAccountsPage.jsx
│   │       ├── AdminComplaintsPage.jsx
│   │       └── EmergencyLocationsPage.jsx
│   │
│   ├── context/                # React Context
│   │   └── AuthContext.jsx    # Authentication state management
│   │
│   ├── routes/                 # Route components
│   │   └── ProtectedRoute.jsx # Role-based route protection
│   │
│   ├── services/               # API services
│   │   └── api.js             # Axios instance & API calls
│   │
│   ├── utils/                  # Utility functions
│   │   └── location.js        # Geolocation utilities
│   │
│   ├── App.jsx                # Main app component with routes
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles with Tailwind
│
├── .env.example               # Environment variables template
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── vite.config.js             # Vite configuration

```

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm installed
- Backend API running on `http://localhost:5000` (or update VITE_API_URL)

### Steps

1. **Navigate to frontend directory**
```bash
cd frontend
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

## 🔐 Environment Setup

Edit `.env` file with your configuration:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Google Maps API Key (Get from https://console.cloud.google.com)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
VITE_APP_NAME=Women Safety System
```

### Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials → API Key
5. Restrict the key (optional but recommended)
6. Copy the API key to `.env`

## ▶️ Running the Application

### Development Mode
```bash
npm run dev
```

App will start at: `http://localhost:3000`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📡 Available Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page (User/Police/Admin)
- `/register` - User registration

### User Routes (Protected)
- `/user/dashboard` - User dashboard
- `/user/sos` - Emergency SOS button
- `/user/guardians` - Manage guardians
- `/user/nearby-police` - Find nearby police stations
- `/user/create-complaint` - File new complaint
- `/user/complaints` - View my complaints
- `/user/profile` - User profile

### Police Routes (Protected)
- `/police/dashboard` - Police dashboard
- `/police/complaints` - View & update station complaints

### Admin Routes (Protected)
- `/admin/dashboard` - Admin dashboard
- `/admin/stations` - Manage police stations
- `/admin/police-accounts` - Manage police accounts
- `/admin/complaints` - View all complaints
- `/admin/emergency-locations` - Monitor emergency locations

## 🧩 Component Guide

### Authentication Context (`AuthContext.jsx`)

Manages authentication state across the app:

```jsx
import { useAuth } from './context/AuthContext';

const MyComponent = () => {
  const { user, role, token, isAuthenticated, login, logout } = useAuth();
  
  // Use auth state...
};
```

**Available Methods:**
- `login(userData, token, role)` - Login user and store credentials
- `logout()` - Logout and clear credentials
- `updateUser(userData)` - Update user data
- `isAuthenticated` - Boolean flag
- `user`, `role`, `token` - Current auth state

### Protected Routes (`ProtectedRoute.jsx`)

Protects routes based on authentication and roles:

```jsx
<Route
  path="/user/dashboard"
  element={
    <ProtectedRoute allowedRoles={['user']}>
      <UserDashboard />
    </ProtectedRoute>
  }
/>
```

### Navbar (`Navbar.jsx`)

Responsive navigation bar with:
- Logo and app name
- Login/Register buttons (when not authenticated)
- User info and logout (when authenticated)
- Mobile hamburger menu

### Sidebar (`Sidebar.jsx`)

Role-based sidebar navigation:

```jsx
<Sidebar role="user" />  // Shows user menu items
<Sidebar role="police" /> // Shows police menu items
<Sidebar role="admin" />  // Shows admin menu items
```

## 🔌 API Integration

### API Service (`services/api.js`)

Centralized API calls with Axios:

```javascript
import { authAPI, sosAPI, guardianAPI, stationAPI, complaintAPI } from './services/api';

// Examples:
const response = await authAPI.loginUser({ email, password });
const guardians = await guardianAPI.getGuardians();
await sosAPI.triggerSOS({ lat, lng });
```

**Available API Groups:**
- `authAPI` - User/Police/Admin authentication
- `guardianAPI` - Guardian CRUD operations
- `sosAPI` - Location updates & SOS alerts
- `stationAPI` - Police station management
- `complaintAPI` - Complaint management

### Interceptors

Automatic handling of:
- Adding JWT token to requests
- Redirecting to login on 401 errors
- Error response handling

## 🎨 Styling

### Tailwind CSS

Customized theme in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#ef4444', // Red-500
    600: '#dc2626', // Red-600
    // ... more shades
  }
}
```

### Custom Classes

- `.animate-pulse-slow` - Slow pulsing animation (for SOS button)
- Responsive utilities: `md:`, `lg:`, `xl:`
- Color scheme: Red primary, complementary colors

## 🗺 Location Utilities

### Using Location Services

```javascript
import { getCurrentLocation, watchLocation, stopWatchingLocation } from './utils/location';

// Get current location once
const location = await getCurrentLocation();
// { lat: 28.6139, lng: 77.2090 }

// Watch location changes
const watchId = watchLocation(
  (location) => console.log('New location:', location),
  (error) => console.error('Error:', error)
);

// Stop watching
stopWatchingLocation(watchId);
```

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Key responsive features:
- Collapsible sidebar on mobile
- Hamburger menu in navbar
- Grid layouts adapt to screen size
- Touch-friendly buttons

## 🔧 Development Tips

### Adding New Pages

1. Create component in appropriate pages folder
2. Add route in `App.jsx`
3. Update sidebar menu if needed (in `Sidebar.jsx`)

### Adding New API Calls

1. Add function to appropriate API group in `services/api.js`
2. Use in component with try-catch
3. Show toast notification for feedback

### State Management

- Use `useState` for local state
- Use `useAuth` for auth state
- Pass props for component communication
- Use Context for global state (if needed)

## 🐛 Troubleshooting

### CORS Errors
```
Solution: Ensure backend CORS allows frontend origin
Backend .env: FRONTEND_URL=http://localhost:3000
```

### API Not Connecting
```
Solution: Check VITE_API_URL in .env
Verify backend is running on port 5000
```

### Location Permission Denied
```
Solution: Enable location in browser settings
Use HTTPS in production (HTTP only works on localhost)
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📝 Code Quality

### Best Practices Followed

- ✅ Functional components with hooks
- ✅ Proper error handling with try-catch
- ✅ Loading states for async operations
- ✅ Toast notifications for user feedback
- ✅ Mobile-first responsive design
- ✅ Clean code with consistent formatting
- ✅ Semantic HTML
- ✅ Accessibility considerations

## 🔐 Security Features

- JWT token stored in localStorage
- Automatic token refresh via interceptor
- Protected routes with role-based access
- Input validation on forms
- XSS protection via React
- HTTPS recommended for production

## 🚀 Deployment

### Vercel / Netlify
```bash
npm run build
# Deploy 'dist' folder
```

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to web server
# Configure server to serve index.html for all routes
```

## 📞 Support

For issues or questions:
1. Check this README
2. Review component documentation
3. Check browser console for errors
4. Verify API connectivity

## 📄 License

This project is part of the Women Safety & Security System.

---

**Happy Coding! 👩‍💻👨‍💻**

Built with ❤️ using React + Vite + Tailwind CSS
