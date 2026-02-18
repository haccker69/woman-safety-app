import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';

// Common Pages
import LandingPage from './pages/common/LandingPage';
import LoginPage from './pages/common/LoginPage';
import RegisterPage from './pages/common/RegisterPage';
import VerifyEmailPage from './pages/common/VerifyEmailPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import SOSPage from './pages/user/SOSPage';
import GuardiansPage from './pages/user/GuardiansPage';
import NearbyPolicePage from './pages/user/NearbyPolicePage';
import CreateComplaintPage from './pages/user/CreateComplaintPage';
import UserComplaintsPage from './pages/user/UserComplaintsPage';
import UserProfilePage from './pages/user/UserProfilePage';
import TravelBuddyPage from './pages/user/TravelBuddyPage';

// Police Pages
import PoliceDashboard from './pages/police/PoliceDashboard';
import PoliceComplaintsPage from './pages/police/PoliceComplaintsPage';
import PoliceSOSAlertsPage from './pages/police/PoliceSOSAlertsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStationsPage from './pages/admin/ManageStationsPage';
import ManagePoliceAccountsPage from './pages/admin/ManagePoliceAccountsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import EmergencyLocationsPage from './pages/admin/EmergencyLocationsPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/sos"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <SOSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/guardians"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <GuardiansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/nearby-police"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <NearbyPolicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/create-complaint"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <CreateComplaintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/complaints"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/travel-buddy"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <TravelBuddyPage />
              </ProtectedRoute>
            }
          />

          {/* Police Routes */}
          <Route
            path="/police/dashboard"
            element={
              <ProtectedRoute allowedRoles={['police']}>
                <PoliceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/police/complaints"
            element={
              <ProtectedRoute allowedRoles={['police']}>
                <PoliceComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/police/sos-alerts"
            element={
              <ProtectedRoute allowedRoles={['police']}>
                <PoliceSOSAlertsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/police-accounts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagePoliceAccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/emergency-locations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmergencyLocationsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </AuthProvider>
  );
}

export default App;
