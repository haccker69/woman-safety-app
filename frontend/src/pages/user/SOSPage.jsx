import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import { sosAPI, guardianAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Users,
  CheckCircle,
  Mail,
  ExternalLink,
  Loader,
  RefreshCw,
  Shield,
  MessageCircle
} from 'lucide-react';
import { getCurrentLocation } from '../../utils/location';

// Marker icon for "you are here"
const youAreHereIcon = L.divIcon({
  className: 'sos-marker',
  html: '<div style="background:#dc2626;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Marker icon for police station
const policeStationIcon = L.divIcon({
  className: 'police-station-marker',
  html: '<div style="background:#2563eb;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:14px;font-weight:bold;">P</span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const openInMaps = (lat, lng) => {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
};

const SOSPage = () => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [guardiansLoading, setGuardiansLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [cancellingAlert, setCancellingAlert] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const activeAlertRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    activeAlertRef.current = activeAlert;
  }, [activeAlert]);

  useEffect(() => {
    getLocation();
    checkActiveAlert();
    
    // Poll for alert status updates every 5 seconds (to detect admin resolution)
    const pollInterval = setInterval(() => {
      checkActiveAlertSilent();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const checkActiveAlert = async () => {
    try {
      const response = await sosAPI.getUserActiveAlert();
      if (response?.data?.data) {
        setActiveAlert(response.data.data);
      } else {
        setActiveAlert(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setActiveAlert(null);
      } else {
        console.error('Failed to check active alert:', err);
      }
    }
  };

  // Silent check that shows toast if alert was resolved
  const checkActiveAlertSilent = async () => {
    try {
      const response = await sosAPI.getUserActiveAlert();
      const hadAlert = activeAlertRef.current !== null;
      
      if (response?.data?.data) {
        setActiveAlert(response.data.data);
      } else {
        if (hadAlert) {
          toast.info('Your SOS alert has been resolved', { autoClose: 5000 });
        }
        setActiveAlert(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        const hadAlert = activeAlertRef.current !== null;
        if (hadAlert) {
          toast.info('Your SOS alert has been resolved', { autoClose: 5000 });
        }
        setActiveAlert(null);
      }
    }
  };

  useEffect(() => {
    const fetchGuardians = async () => {
      try {
        setGuardiansLoading(true);
        const response = await guardianAPI.getGuardians();
        setGuardians(response?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch guardians:', err);
        setGuardians([]);
      } finally {
        setGuardiansLoading(false);
      }
    };
    fetchGuardians();
  }, []);

  const getLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      toast.success('Location updated');
    } catch (error) {
      console.error('Location error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerSOS = async () => {
    if (!location) {
      toast.error('Location not available. Try refreshing.');
      return;
    }

    const guardianCount = guardians.length;
    const confirmMessage = guardianCount > 0
      ? `Send emergency alert to ${guardianCount} guardian(s) and nearby police station?`
      : 'No guardians added. Send emergency alert to nearby police station only?';
      
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setSendingAlert(true);
    try {
      const response = await sosAPI.triggerSOS({ lat: location.lat, lng: location.lng });
      const alertData = response?.data?.data;
      
      // Refresh to get full active alert data with populated station
      await checkActiveAlert();
      
      if (guardianCount > 0) {
        toast.success(`Alert sent to ${guardianCount} guardian(s) and police`, { autoClose: 5000 });
      } else {
        toast.success('Alert sent to nearby police station', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('SOS error:', error);
      toast.error(error.response?.data?.message || 'Failed to send SOS. Try again.');
    } finally {
      setSendingAlert(false);
    }
  };

  const cancelAlert = async () => {
    if (!activeAlert?._id) return;

    const confirmed = window.confirm('Are you sure you want to cancel the active SOS alert?');
    if (!confirmed) return;

    setCancellingAlert(true);
    try {
      await sosAPI.cancelAlert(activeAlert._id);
      setActiveAlert(null);
      toast.success('SOS alert cancelled');
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel alert');
    } finally {
      setCancellingAlert(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar role="user" />

      <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50/80 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Emergency SOS
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Send your location to guardians in an emergency
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SOS Button Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
                <p className="text-gray-600 text-sm mb-6 text-center">
                  Press the button to send your current location to your guardians and nearby police.
                </p>
                <button
                  onClick={triggerSOS}
                  disabled={sendingAlert || !location || activeAlert}
                  className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all shadow-lg ${
                    sendingAlert || !location || activeAlert
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/30 active:scale-95'
                  }`}
                >
                  {sendingAlert ? (
                    <>
                      <Loader className="w-10 h-10 text-white animate-spin mb-2" />
                      <span className="text-white font-semibold text-sm">Sending…</span>
                    </>
                  ) : activeAlert ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-white mb-2" />
                      <span className="text-white font-bold text-lg">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-10 h-10 text-white mb-2" />
                      <span className="text-white font-bold text-xl">SOS</span>
                    </>
                  )}
                </button>
                {activeAlert && (
                  <button
                    onClick={cancelAlert}
                    disabled={cancellingAlert}
                    className="mt-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancellingAlert ? 'Cancelling...' : 'Cancel Active Alert'}
                  </button>
                )}
                {(!location) && !activeAlert && (
                  <p className="mt-4 text-xs text-amber-600 text-center">
                    {!location && 'Get your location below.'}
                  </p>
                )}
                {!guardians.length && !activeAlert && location && (
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Tip: Add guardians to also notify them
                  </p>
                )}
              </div>
            </div>

            {/* Guardians */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Guardians</h2>
                <span className="text-sm text-gray-400">({guardiansLoading ? '…' : guardians.length})</span>
              </div>
              {guardiansLoading ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> Loading guardians…
                </p>
              ) : guardians.length > 0 ? (
                <ul className="space-y-3">
                  {guardians.slice(0, 5).map((g) => (
                    <li key={g._id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="font-medium text-gray-900 text-sm">{g.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {g.phone}
                      </div>
                      {g.email && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {g.email}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No guardians added yet.</p>
              )}
            </div>
          </div>

          {/* Your Location */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-semibold text-gray-900">Your location</h2>
              </div>
              <button
                onClick={getLocation}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {loading ? 'Fetching…' : 'Refresh location'}
              </button>
            </div>
            <div className="p-6">
              {loading && !location ? (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  <Loader className="w-6 h-6 animate-spin mr-2" />
                  Getting your location…
                </div>
              ) : !location ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm mb-4">Location not available.</p>
                  <button
                    onClick={getLocation}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                  >
                    Get my location
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-700">Lat</span> {location.lat.toFixed(6)}
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-700">Lng</span> {location.lng.toFixed(6)}
                  </span>
                  <button
                    onClick={() => openInMaps(location.lat, location.lng)}
                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Alert with Assigned Station Map */}
          {activeAlert && (
            <div className="mt-6 bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-semibold text-red-900">Active SOS Alert</h2>
              </div>
              <div className="p-6 space-y-4">
                {activeAlert.nearestStation && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Assigned Police Station</h3>
                    </div>
                    <p className="text-sm text-blue-800 font-medium">{activeAlert.nearestStation.name}</p>
                    <p className="text-sm text-blue-700">{activeAlert.nearestStation.area}, {activeAlert.nearestStation.city}</p>
                    {activeAlert.nearestStation.helpline && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-blue-700">
                        <Phone className="w-4 h-4" />
                        <span>{activeAlert.nearestStation.helpline}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {activeAlert.assignedOfficers && activeAlert.assignedOfficers.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Assigned Officers</h3>
                    <ul className="space-y-2">
                      {activeAlert.assignedOfficers.map((officer, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm text-gray-700">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{officer.name || officer}</span>
                          {officer.phone && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{officer.phone}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Map showing user location and assigned station */}
                {location && activeAlert.nearestStation?.location?.coordinates && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 h-72 relative z-0">
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {/* User location marker */}
                      <Marker position={[location.lat, location.lng]} icon={youAreHereIcon}>
                        <Popup>
                          <strong>Your Location</strong><br />
                          Lat: {location.lat.toFixed(6)}<br />
                          Lng: {location.lng.toFixed(6)}
                        </Popup>
                      </Marker>
                      {/* Police station marker */}
                      <Marker 
                        position={[
                          activeAlert.nearestStation.location.coordinates[1],
                          activeAlert.nearestStation.location.coordinates[0]
                        ]} 
                        icon={policeStationIcon}
                      >
                        <Popup>
                          <strong>{activeAlert.nearestStation.name}</strong><br />
                          {activeAlert.nearestStation.area}, {activeAlert.nearestStation.city}<br />
                          {activeAlert.nearestStation.helpline && `Helpline: ${activeAlert.nearestStation.helpline}`}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>Your Location</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span>Police Station</span>
                  </div>
                </div>

                {/* Chat Button */}
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Police & Admin
                </button>
              </div>
            </div>
          )}

          {/* Chat Room Modal */}
          {activeAlert && (
            <ChatRoom
              sosAlertId={activeAlert._id}
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSPage;
