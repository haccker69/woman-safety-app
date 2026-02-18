import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import { 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Navigation, 
  ExternalLink,
  MapPin,
  Phone,
  Users,
  Clock,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { toast } from 'react-toastify';

const sosLocationIcon = L.divIcon({
  className: 'sos-location-marker',
  html: '<div style="background:#dc2626;width:28px;height:28px;border-radius:50%;border:4px solid white;box-shadow:0 2px 12px rgba(220,38,38,0.6);animation:pulse 2s infinite;"></div><style>@keyframes pulse{0%,100%{box-shadow:0 2px 12px rgba(220,38,38,0.6)}50%{box-shadow:0 2px 20px rgba(220,38,38,0.9)}}</style>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const PoliceSOSAlertsPage = () => {
  const role = 'police';
  const [assignedSOSAlerts, setAssignedSOSAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState(null);
  const [chatAlertId, setChatAlertId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = (alertId) => {
    setChatAlertId(alertId);
    setChatOpen(true);
  };

  // Helper to get user data (handles both flattened and nested structures)
  const getUserData = (alert) => ({
    name: alert.name || alert.userId?.name || 'Unknown User',
    phone: alert.phone || alert.userId?.phone || null,
    email: alert.email || alert.userId?.email || null,
    profilePhoto: alert.profilePhoto || alert.userId?.profilePhoto || null,
  });

  useEffect(() => {
    fetchSOSAlerts();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchSOSAlerts();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const fetchSOSAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sos/alerts/police/assigned');
      setAssignedSOSAlerts(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
      toast.error('Failed to load SOS alerts');
      setAssignedSOSAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSOSAlerts();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleResolveAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to mark this SOS alert as resolved?')) {
      return;
    }

    try {
      setResolvingAlert(alertId);
      await api.put(`/sos/alerts/${alertId}/resolve`);
      setAssignedSOSAlerts(alerts => alerts.filter(alert => alert._id !== alertId));
      toast.success('SOS Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setResolvingAlert(null);
    }
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return 'N/A';
    if (meters > 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const mapCenter = assignedSOSAlerts.length > 0 && assignedSOSAlerts[0].location
    ? [assignedSOSAlerts[0].location.lat, assignedSOSAlerts[0].location.lng]
    : [28.7041, 77.1025]; // Default to Delhi

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              SOS Alerts
            </h1>
            <p className="text-gray-600 mt-2">Emergency alerts assigned to you - Respond immediately</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{loading ? '—' : assignedSOSAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 h-96 animate-pulse">
              <div className="w-full h-full bg-gray-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="h-3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : assignedSOSAlerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active SOS alerts</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              You're all caught up! When SOS alerts are assigned to you, they will appear here for immediate response.
            </p>
            <button
              onClick={fetchSOSAlerts}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map */}
            {assignedSOSAlerts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Emergency Map — Your Assigned SOS Locations</span>
                </div>
                <div className="h-96 relative z-0">
                  <MapContainer
                    center={mapCenter}
                    zoom={assignedSOSAlerts.length === 1 ? 15 : 12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {assignedSOSAlerts.map((alert) => {
                      if (!alert.location?.lat || !alert.location?.lng) return null;
                      const user = getUserData(alert);
                      return (
                        <Marker
                          key={alert._id}
                          position={[alert.location.lat, alert.location.lng]}
                          icon={sosLocationIcon}
                        >
                          <Popup>
                            <div className="text-sm max-w-xs">
                              <strong className="block text-gray-900 mb-2 text-red-600">⚠️ SOS ALERT</strong>
                              <strong className="block text-gray-900">{user.name}</strong>
                              {user.phone ? (
                                <span className="text-gray-600 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs">No phone available</span>
                              )}
                              <span className="text-gray-500 text-xs block mt-2">
                                {alert.location.lat.toFixed(5)}, {alert.location.lng.toFixed(5)}
                              </span>
                              {alert.guardianCount > 0 && (
                                <span className="text-gray-500 text-xs block mt-1">
                                  {alert.guardianCount} guardian(s) notified
                                </span>
                              )}
                              {alert.nearestStation && (
                                <span className="text-gray-500 text-xs block mt-1">
                                  Station: {alert.nearestStation.name} ({formatDistance(alert.distanceToStation)})
                                </span>
                              )}
                              {alert.createdAt && (
                                <span className="text-gray-500 text-xs block mt-1">
                                  {formatTimeAgo(alert.createdAt)}
                                </span>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedSOSAlerts.map((alert) => {
                const user = getUserData(alert);
                return (
                <div
                  key={alert._id}
                  className="bg-white rounded-xl shadow-lg border-2 border-red-200 overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse" />
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {user.profilePhoto ? (
                          <img 
                            src={user.profilePhoto} 
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-red-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Zap className="w-5 h-5 text-red-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            🚨 {user.name}
                          </h3>
                          {user.phone ? (
                            <p className="text-sm text-gray-600 truncate flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              {user.phone}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 truncate">No phone available</p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex-shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        ACTIVE
                      </span>
                    </div>

                    {/* Location */}
                    {alert.location && (
                      <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">📍 Coordinates:</span>{' '}
                        {alert.location.lat?.toFixed(5)}, {alert.location.lng?.toFixed(5)}
                      </div>
                    )}

                    {/* Guardians */}
                    {alert.guardianCount > 0 && (
                      <div className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded border border-blue-100">
                        ✓ {alert.guardianCount} guardian(s) notified
                      </div>
                    )}

                    {/* Nearest Station */}
                    {alert.nearestStation && (
                      <div className="text-xs text-gray-700 mb-3 p-2 bg-amber-50 rounded border border-amber-100">
                        <div className="font-medium flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          Nearest Station
                        </div>
                        <div className="text-gray-600">
                          <p className="font-medium">{alert.nearestStation.name}</p>
                          <p className="text-gray-500">{alert.nearestStation.area}, {alert.nearestStation.city}</p>
                          {alert.distanceToStation != null && (
                            <p className="text-gray-500">Distance: {formatDistance(alert.distanceToStation)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Time */}
                    {alert.createdAt && (
                      <div className="text-xs text-gray-500 mb-4">
                        Alert triggered: {formatTimeAgo(alert.createdAt)}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      <button
                        type="button"
                        onClick={() => openInMaps(alert.location?.lat, alert.location?.lng)}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Navigate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openInMaps(alert.location?.lat, alert.location?.lng)}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-600 text-white text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Maps</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openChat(alert._id)}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert._id)}
                        disabled={resolvingAlert === alert._id}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{resolvingAlert === alert._id ? 'Resolving...' : 'Resolve'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Chat Room Modal */}
        <ChatRoom
          sosAlertId={chatAlertId}
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setChatAlertId(null);
          }}
        />
      </div>
    </div>
  );
};

export default PoliceSOSAlertsPage;
