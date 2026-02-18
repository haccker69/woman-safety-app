import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login attempts — let the login page handle its own errors
      const url = error.config?.url || '';
      const isLoginRequest = url.includes('/login');
      if (!isLoginRequest) {
        // Unauthorized on a protected route — clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH APIs ============
export const authAPI = {
  // User
  registerUser: (data) => api.post('/auth/user/register', data),
  loginUser: (data) => api.post('/auth/user/login', data),
  verifyEmail: (data) => api.post('/auth/user/verify-email', data),
  resendOTP: (data) => api.post('/auth/user/resend-otp', data),
  getUserProfile: () => api.get('/auth/user/profile'),
  updateUserProfile: (data) => api.put('/auth/user/profile', data),
  updateProfilePhoto: (photoData) => api.put('/auth/user/profile/photo', { profilePhoto: photoData }),

  // Police
  loginPolice: (data) => api.post('/auth/police/login', data),
  getPoliceProfile: () => api.get('/auth/police/profile'),

  // Admin
  loginAdmin: (data) => api.post('/auth/admin/login', data),
  getAdminProfile: () => api.get('/auth/admin/profile'),
};

// ============ GUARDIAN APIs ============
export const guardianAPI = {
  getGuardians: () => api.get('/guardians'),
  addGuardian: (data) => api.post('/guardians', data),
  updateGuardian: (id, data) => api.put(`/guardians/${id}`, data),
  deleteGuardian: (id) => api.delete(`/guardians/${id}`),
};

// ============ SOS APIs ============
export const sosAPI = {
  updateLocation: (data) => api.put('/sos/location', data),
  getLocation: () => api.get('/sos/location'),
  triggerSOS: (data) => api.post('/sos/alert', data),
  getUserActiveAlert: () => api.get('/sos/alert/active'),
  // Admin endpoints
  getActiveAlerts: () => api.get('/sos/alerts'),
  assignOfficers: (alertId, stationId) => api.put(`/sos/alerts/${alertId}/assign-officers`, { stationId }),
  resolveAlert: (alertId) => api.put(`/sos/alerts/${alertId}/resolve`),
  cancelAlert: (alertId) => api.put(`/sos/alerts/${alertId}/cancel`),
};

// ============ STATION APIs ============
export const stationAPI = {
  getNearbyStations: (lat, lng) => api.get(`/stations/nearby?lat=${lat}&lng=${lng}`),
  getAllStations: () => api.get('/stations'),
  createStation: (data) => api.post('/stations', data),
  createPoliceAccount: (data) => api.post('/stations/create-police', data),
};

// ============ COMPLAINT APIs ============
export const complaintAPI = {
  createComplaint: (data) => api.post('/complaints', data),
  getUserComplaints: () => api.get('/complaints/my-complaints'),
  getStationComplaints: () => api.get('/complaints/station'),
  updateComplaintStatus: (id, status) => api.put(`/complaints/${id}/status`, { status }),
  getAllComplaints: () => api.get('/complaints/all'),
  getEmergencyLocations: () => api.get('/complaints/emergency-locations'),
};

// ============ POLICE APIs ============
export const policeAPI = {
  getDashboard: () => api.get('/police/dashboard'),
  getComplaints: () => api.get('/police/complaints'),
  updateComplaintStatus: (id, status) => api.put(`/police/complaints/${id}`, { status }),
  updateProfile: (data) => api.put('/police/profile', data),
};

// ============ TRAVEL BUDDY APIs ============
export const travelBuddyAPI = {
  createTrip: (data) => api.post('/travel-buddy', data),
  findTrips: (params) => api.get('/travel-buddy/find', { params }),
  getMyTrips: () => api.get('/travel-buddy/my-trips'),
  sendRequest: (tripId, data) => api.post(`/travel-buddy/${tripId}/request`, data),
  acceptRequest: (tripId, requestId) => api.put(`/travel-buddy/${tripId}/request/${requestId}/accept`),
  rejectRequest: (tripId, requestId) => api.put(`/travel-buddy/${tripId}/request/${requestId}/reject`),
  cancelTrip: (tripId) => api.put(`/travel-buddy/${tripId}/cancel`),
  completeTrip: (tripId) => api.put(`/travel-buddy/${tripId}/complete`),
};

// ============ TRAVEL BUDDY CHAT APIs ============
export const travelBuddyChatAPI = {
  getMessages: (tripId, since) => {
    const params = since ? `?since=${since}` : '';
    return api.get(`/travel-buddy-chat/${tripId}/messages${params}`);
  },
  sendMessage: (tripId, message) => api.post(`/travel-buddy-chat/${tripId}/messages`, { message, messageType: 'text' }),
  sendAudioMessage: (tripId, audioData, audioDuration) => api.post(`/travel-buddy-chat/${tripId}/messages`, {
    messageType: 'audio',
    audioData,
    audioDuration
  }),
  sendLocationMessage: (tripId, location) => api.post(`/travel-buddy-chat/${tripId}/messages`, {
    messageType: 'location',
    location
  }),
  getChatInfo: (tripId) => api.get(`/travel-buddy-chat/${tripId}/info`),
};

// ============ CHAT APIs ============
export const chatAPI = {
  getMessages: (sosAlertId, since) => {
    const params = since ? `?since=${since}` : '';
    return api.get(`/chat/${sosAlertId}/messages${params}`);
  },
  sendMessage: (sosAlertId, message) => api.post(`/chat/${sosAlertId}/messages`, { message, messageType: 'text' }),
  sendAudioMessage: (sosAlertId, audioData, audioDuration) => api.post(`/chat/${sosAlertId}/messages`, { 
    messageType: 'audio', 
    audioData, 
    audioDuration 
  }),
  sendLocationMessage: (sosAlertId, location) => api.post(`/chat/${sosAlertId}/messages`, { 
    messageType: 'location', 
    location 
  }),
  getChatInfo: (sosAlertId) => api.get(`/chat/${sosAlertId}/info`),
};

export default api;
