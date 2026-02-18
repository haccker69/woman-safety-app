import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import { MapPinned, User, Mail, Phone, ExternalLink, Navigation, AlertCircle, RefreshCw, Search, AlertTriangle, CheckCircle, Users, MapPin, Zap, MessageCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const sosLocationIcon = L.divIcon({
  className: 'sos-location-marker',
  html: '<div style="background:#dc2626;width:28px;height:28px;border-radius:50%;border:4px solid white;box-shadow:0 2px 12px rgba(220,38,38,0.6);animation:pulse 2s infinite;"></div><style>@keyframes pulse{0%,100%{box-shadow:0 2px 12px rgba(220,38,38,0.6)}50%{box-shadow:0 2px 20px rgba(220,38,38,0.9)}}</style>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stationIcon = L.divIcon({
  className: 'station-marker',
  html: '<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in meters
};

const EmergencyLocationsPage = () => {
  const role = 'admin';
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState(null);
  const [assigningOfficers, setAssigningOfficers] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableStations, setAvailableStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [allStations, setAllStations] = useState([]);
  const [selectedAlertLocation, setSelectedAlertLocation] = useState(null);
  const [stationsInRange, setStationsInRange] = useState([]);
  const [rangeKm, setRangeKm] = useState(5); // Default 5km
  const [showAllStations, setShowAllStations] = useState(false); // Debug: show all stations
  const [chatAlertId, setChatAlertId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = (alertId) => {
    setChatAlertId(alertId);
    setChatOpen(true);
  };

  useEffect(() => {
    fetchEmergencyLocations();
    fetchAllStations();
  }, []);
  
  // Separate effect for auto-refresh to avoid stale closures
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Fetch locations without clearing selection state
      api.get('/sos/alerts')
        .then(response => {
          const newLocations = response?.data?.data || [];
          setLocations(newLocations);
        })
        .catch(err => {
          console.error('Error auto-refreshing locations:', err);
        });
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (selectedAlertLocation) {
      filterStationsInRange(selectedAlertLocation, rangeKm);
    } else {
      setStationsInRange([]);
    }
  }, [selectedAlertLocation, rangeKm, allStations]);

  const fetchEmergencyLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/sos/alerts');
      const newLocations = response?.data?.data || [];
      setLocations(newLocations);
      
      // Clear selectedAlertLocation if it no longer exists in the updated list
      // Use functional update to access current state value
      setSelectedAlertLocation(current => {
        if (current && !newLocations.find(loc => loc._id === current._id)) {
          setStationsInRange([]);
          return null;
        }
        return current;
      });
    } catch (err) {
      console.error('Error fetching emergency locations:', err);
      setError(err.response?.data?.message || 'Failed to load emergency locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStations = async () => {
    try {
      const response = await api.get('/stations');
      const stations = response?.data?.data || response?.data || [];
      const validStations = Array.isArray(stations) ? stations : [];
      setAllStations(validStations);
    } catch (err) {
      console.error('Error fetching all stations:', err);
      setAllStations([]);
    }
  };

  const fetchAvailableStations = async (alertLat, alertLng) => {
    try {
      const response = await api.get('/stations');
      let stations = response?.data?.data || [];
      
      // Sort stations by distance from alert location
      stations = stations.map(station => {
        let distance = null;
        if (station.location && station.location.coordinates) {
          const [stationLng, stationLat] = station.location.coordinates;
          distance = calculateDistance(alertLat, alertLng, stationLat, stationLng);
        }
        return { ...station, calculatedDistance: distance };
      });
      
      // Sort by distance (nearest first)
      stations.sort((a, b) => {
        if (a.calculatedDistance === null) return 1;
        if (b.calculatedDistance === null) return -1;
        return a.calculatedDistance - b.calculatedDistance;
      });
      
      setAvailableStations(stations);
    } catch (err) {
      console.error('Error fetching stations:', err);
      toast.error('Failed to load available stations');
    }
  };

  const filterStationsInRange = (alertLocation, rangeKm) => {
    if (!alertLocation || !alertLocation.lat || !alertLocation.lng) {
      setStationsInRange([]);
      return;
    }

    if (!allStations || allStations.length === 0) {
      setStationsInRange([]);
      return;
    }

    const rangeMeters = rangeKm * 1000;
    
    const inRange = allStations
      .map((station) => {
        let stationLat, stationLng;
        
        // Backend returns latitude/longitude directly (from /api/stations)
        if (station.latitude != null && station.longitude != null) {
          stationLat = Number(station.latitude);
          stationLng = Number(station.longitude);
        } 
        // Or GeoJSON format: location.coordinates = [lng, lat]
        else if (station.location && Array.isArray(station.location.coordinates)) {
          [stationLng, stationLat] = station.location.coordinates;
        } 
        // Or nested lat/lng
        else if (station.location && station.location.lat && station.location.lng) {
          stationLat = Number(station.location.lat);
          stationLng = Number(station.location.lng);
        } 
        else {
          return null;
        }

        if (isNaN(stationLat) || isNaN(stationLng)) {
          return null;
        }

        const distance = calculateDistance(alertLocation.lat, alertLocation.lng, stationLat, stationLng);
        
        if (distance <= rangeMeters) {
          return { ...station, distanceToAlert: distance, stationLat, stationLng };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceToAlert - b.distanceToAlert);

    setStationsInRange(inRange);
  };

  const handleAlertClick = (location) => {
    const alertLoc = location.location || location;
    if (!alertLoc || !alertLoc.lat || !alertLoc.lng) {
      return;
    }
    
    if (selectedAlertLocation && 
        selectedAlertLocation.lat === alertLoc.lat && 
        selectedAlertLocation.lng === alertLoc.lng) {
      setSelectedAlertLocation(null);
    } else {
      // Store both location and alert ID for proper tracking
      setSelectedAlertLocation({ 
        ...alertLoc, 
        _id: location._id 
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmergencyLocations();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAssignOfficers = async (alertId) => {
    const alert = locations.find(loc => loc._id === alertId);
    setSelectedAlert(alert);
    setSelectedStation(alert.nearestStation?._id || null);
    await fetchAvailableStations(alert.location?.lat, alert.location?.lng);
    setShowAssignModal(true);
  };

  const confirmAssignOfficers = async () => {
    if (!selectedStation) {
      toast.error('Please select a police station');
      return;
    }

    try {
      setAssigningOfficers(selectedAlert._id);
      await api.put(`/sos/alerts/${selectedAlert._id}/assign-officers`, {
        stationId: selectedStation
      });

      // Update the locations list
      const updatedLocations = locations.map(loc => {
        if (loc._id === selectedAlert._id) {
          const station = availableStations.find(s => s._id === selectedStation);
          return {
            ...loc,
            nearestStation: station,
            assignmentStatus: 'Assigned'
          };
        }
        return loc;
      });
      setLocations(updatedLocations);

      toast.success('Officers assigned successfully');
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error assigning officers:', err);
      toast.error(err.response?.data?.message || 'Failed to assign officers');
    } finally {
      setAssigningOfficers(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to resolve this SOS alert?')) {
      return;
    }

    try {
      setResolvingAlert(alertId);
      await api.put(`/sos/alerts/${alertId}/resolve`);
      
      // Remove the resolved alert from the list
      setLocations(locations.filter(loc => loc._id !== alertId));
      
      // Clear selected alert location if it's the one being resolved
      if (selectedAlertLocation?._id === alertId) {
        setSelectedAlertLocation(null);
        setStationsInRange([]);
      }
      
      toast.success('SOS Alert resolved successfully');
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast.error(err.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setResolvingAlert(null);
    }
  };

  const filteredLocations = useMemo(() => {
    let filtered = locations;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = locations.filter(
        (loc) =>
          (loc.name && loc.name.toLowerCase().includes(q)) ||
          (loc.email && loc.email.toLowerCase().includes(q)) ||
          (loc.phone && loc.phone.toLowerCase().includes(q))
      );
    }
    // Calculate distance if missing and nearestStation exists
    return filtered.map(loc => {
      if (loc.distanceToStation == null && loc.nearestStation && loc.location && loc.nearestStation.location && Array.isArray(loc.nearestStation.location.coordinates) && loc.nearestStation.location.coordinates.length >= 2) {
        const [stationLng, stationLat] = loc.nearestStation.location.coordinates;
        if (typeof stationLat === 'number' && typeof stationLng === 'number' && typeof loc.location.lat === 'number' && typeof loc.location.lng === 'number') {
          const distance = calculateDistance(loc.location.lat, loc.location.lng, stationLat, stationLng);
          return { ...loc, distanceToStation: distance };
        }
      }
      return loc;
    });
  }, [locations, searchTerm]);

  const mapCenter = useMemo(() => {
    if (locations.length === 0) return [28.7041, 77.1025]; // Default to Delhi
    const avgLat = locations.reduce((sum, loc) => sum + (loc.location?.lat || 0), 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + (loc.location?.lng || 0), 0) / locations.length;
    return [avgLat, avgLng];
  }, [locations]);

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

  const getAssignmentStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Unassigned':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Active SOS Alerts</h1>
                <p className="text-gray-600 mt-1">
                  Real-time emergency locations with police officer assignments
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-white hover:border-gray-300 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{loading ? '—' : locations.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '—' : locations.filter(l => l.assignmentStatus === 'Assigned').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? '—' : locations.filter(l => l.assignmentStatus === 'Unassigned').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading && locations.length === 0 ? (
          <div className="space-y-6">
            {/* Map skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 h-96 animate-pulse">
              <div className="w-full h-full bg-gray-200 rounded-lg" />
            </div>
            {/* List skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MapPinned className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active SOS alerts</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              When users trigger SOS alerts, their emergency locations will appear here for immediate response coordination.
            </p>
            <button
              onClick={fetchEmergencyLocations}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Emergency Map — Active SOS Locations</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Range:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={rangeKm}
                      onChange={(e) => setRangeKm(Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-600">km</span>
                  </label>
                  {selectedAlertLocation && (
                    <>
                      <button
                        onClick={() => setSelectedAlertLocation(null)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={() => setShowAllStations(!showAllStations)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          showAllStations 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        title="Show all stations on map (for testing)"
                      >
                        {showAllStations ? 'Hide All' : 'Show All'} Stations
                      </button>
                      <span className="text-xs text-gray-600 hidden sm:inline">
                        Stations: {allStations.length} | In range: {stationsInRange.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-96 relative z-0">
                <MapContainer
                  center={selectedAlertLocation ? [selectedAlertLocation.lat, selectedAlertLocation.lng] : mapCenter}
                  zoom={selectedAlertLocation ? 13 : locations.length === 1 ? 15 : 12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                  key={`map-${selectedAlertLocation?._id || 'default'}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Range circle around selected alert */}
                  {selectedAlertLocation && (
                    <Circle
                      center={[selectedAlertLocation.lat, selectedAlertLocation.lng]}
                      radius={rangeKm * 1000}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    />
                  )}
                  {/* SOS Alert Markers */}
                  {filteredLocations.map((location) => {
                    if (!location.location?.lat || !location.location?.lng) return null;
                    const isSelected = selectedAlertLocation && 
                      selectedAlertLocation.lat === location.location.lat && 
                      selectedAlertLocation.lng === location.location.lng;
                    return (
                      <Marker
                        key={location._id}
                        position={[location.location.lat, location.location.lng]}
                        icon={sosLocationIcon}
                        eventHandlers={{
                          click: () => handleAlertClick(location)
                        }}
                      >
                        <Popup>
                          <div className="text-sm max-w-xs">
                            <strong className="block text-gray-900 mb-2 text-red-600">⚠️ SOS ALERT</strong>
                            <strong className="block text-gray-900">{location.name}</strong>
                            <span className="text-gray-600">{location.email}</span>
                            {location.phone && <span className="block text-gray-600">{location.phone}</span>}
                            <span className="text-gray-500 text-xs block mt-2">
                              {location.location.lat.toFixed(5)}, {location.location.lng.toFixed(5)}
                            </span>
                            {location.guardianCount && (
                              <span className="text-gray-500 text-xs block mt-1">
                                {location.guardianCount} guardian(s) notified
                              </span>
                            )}
                            {location.nearestStation && (
                              <span className="text-gray-500 text-xs block mt-1">
                                Station: {location.nearestStation.name} ({formatDistance(location.distanceToStation)})
                              </span>
                            )}
                            {location.createdAt && (
                              <span className="text-gray-500 text-xs block mt-1">
                                {formatTimeAgo(location.createdAt)}
                              </span>
                            )}
                            {isSelected && stationsInRange.length > 0 && (
                              <span className="text-blue-600 text-xs block mt-2 font-medium">
                                {stationsInRange.length} station(s) within {rangeKm}km
                              </span>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  {/* Police Stations in Range (or all stations if showAllStations is true) */}
                  {selectedAlertLocation && (showAllStations ? allStations : stationsInRange).map((station, idx) => {
                    // Use pre-calculated coordinates from filterStationsInRange, or extract them
                    let stationLat = station.stationLat;
                    let stationLng = station.stationLng;
                    
                    if (stationLat == null || stationLng == null) {
                      // Fallback: extract from various formats
                      if (station.latitude != null && station.longitude != null) {
                        stationLat = Number(station.latitude);
                        stationLng = Number(station.longitude);
                      } else if (station.location && Array.isArray(station.location.coordinates)) {
                        [stationLng, stationLat] = station.location.coordinates;
                      } else if (station.location && station.location.lat && station.location.lng) {
                        stationLat = Number(station.location.lat);
                        stationLng = Number(station.location.lng);
                      } else {
                        return null;
                      }
                    }

                    if (isNaN(stationLat) || isNaN(stationLng)) {
                      return null;
                    }

                    // Calculate distance if not already calculated
                    const distance = station.distanceToAlert != null 
                      ? station.distanceToAlert 
                      : (selectedAlertLocation 
                          ? calculateDistance(selectedAlertLocation.lat, selectedAlertLocation.lng, stationLat, stationLng)
                          : null);

                    return (
                      <Marker
                        key={station._id || `station-${idx}-${stationLat}-${stationLng}`}
                        position={[stationLat, stationLng]}
                        icon={stationIcon}
                      >
                        <Popup>
                          <div className="text-sm max-w-xs">
                            <strong className="block text-gray-900 mb-1 text-blue-600">🏢 Police Station</strong>
                            <strong className="block text-gray-900">{station.name}</strong>
                            <p className="text-gray-600 text-xs mt-1">{station.area}, {station.city}</p>
                            {station.helpline && (
                              <p className="text-gray-600 text-xs mt-1">📞 {station.helpline}</p>
                            )}
                            {distance != null && (
                              <p className="text-blue-600 text-xs mt-2 font-medium">
                                Distance: {formatDistance(distance)}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              <div className="px-4 py-3 flex gap-4 text-xs text-gray-500 border-t border-gray-100 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Active SOS Location
                </span>
                {selectedAlertLocation && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500" /> Police Station ({stationsInRange.length} in range)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-dashed bg-blue-100" /> {rangeKm}km Range
                    </span>
                    {allStations.length === 0 && (
                      <span className="text-amber-600 text-xs">Loading stations...</span>
                    )}
                    {allStations.length > 0 && stationsInRange.length === 0 && (
                      <span className="text-gray-500 text-xs">No stations found in range</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stations in Range Summary */}
            {selectedAlertLocation && stationsInRange.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {stationsInRange.length} Police Station{stationsInRange.length !== 1 ? 's' : ''} within {rangeKm}km
                      </p>
                      <p className="text-sm text-gray-600">
                        Click on SOS alert markers to view nearby stations
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {stationsInRange.slice(0, 6).map((station) => (
                    <div key={station._id} className="bg-white rounded-lg p-2 text-xs border border-blue-100">
                      <p className="font-medium text-gray-900 truncate">{station.name}</p>
                      <p className="text-gray-600">{formatDistance(station.distanceToAlert)} away</p>
                    </div>
                  ))}
                  {stationsInRange.length > 6 && (
                    <div className="bg-white rounded-lg p-2 text-xs border border-blue-100 flex items-center justify-center text-gray-500">
                      +{stationsInRange.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white"
                />
              </div>
            </div>

            {/* List */}
            {filteredLocations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                <MapPinned className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">No matching SOS alerts</h3>
                <p className="text-sm text-gray-500">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocations.map((item) => {
                  const isSelected = selectedAlertLocation && 
                    item.location &&
                    selectedAlertLocation.lat === item.location.lat && 
                    selectedAlertLocation.lng === item.location.lng;
                  return (
                  <div
                    key={item._id}
                    onClick={() => item.location && handleAlertClick(item)}
                    className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all flex flex-col ${
                      isSelected 
                        ? 'border-blue-500 border-2 ring-2 ring-blue-200 cursor-pointer' 
                        : 'border-red-200 cursor-pointer'
                    }`}
                  >
                    <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse" />
                    <div className="p-6 flex-1 flex flex-col">
                      {/* User Info */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {(item.profilePhoto || item.userId?.profilePhoto) ? (
                            <img 
                              src={item.profilePhoto || item.userId?.profilePhoto} 
                              alt={item.name}
                              className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-red-200"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              {item.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex-shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            SOS
                          </span>
                          {isSelected && stationsInRange.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <MapPin className="w-2.5 h-2.5" />
                              {stationsInRange.length} in range
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact & Location */}
                      {item.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {item.phone}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">📍 Coordinates:</span>{' '}
                        {item.location?.lat?.toFixed(5)}, {item.location?.lng?.toFixed(5)}
                      </div>

                      {/* Guardians */}
                      {item.guardianCount > 0 && (
                        <div className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded border border-blue-100">
                          ✓ {item.guardianCount} guardian(s) notified
                        </div>
                      )}

                      {/* Assignment Status */}
                      <div className={`text-xs mb-3 p-2 rounded border ${getAssignmentStatusColor(item.assignmentStatus)}`}>
                        <span className="font-medium">Status:</span> {item.assignmentStatus}
                      </div>

                      {/* Nearest Station */}
                      {item.nearestStation && (
                        <div className="text-xs text-gray-700 mb-3 p-2 bg-amber-50 rounded border border-amber-100">
                          <div className="font-medium flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3" />
                            Nearest Station
                          </div>
                          <div className="text-gray-600">
                            <p className="font-medium">{item.nearestStation.name}</p>
                            <p className="text-gray-500">{item.nearestStation.area}, {item.nearestStation.city}</p>
                            <p className="text-gray-500">Distance: {formatDistance(item.distanceToStation)}</p>
                            {item.nearestStation.helpline && (
                              <p className="text-gray-500">Helpline: {item.nearestStation.helpline}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assigned Officers */}
                      {item.assignedOfficers && item.assignedOfficers.length > 0 && (
                        <div className="text-xs text-gray-700 mb-3 p-2 bg-green-50 rounded border border-green-100">
                          <div className="font-medium flex items-center gap-1 mb-2">
                            <Users className="w-3 h-3" />
                            Assigned Officers ({item.assignedOfficers.length})
                          </div>
                          <div className="space-y-1">
                            {item.assignedOfficers.map((officer) => (
                              <div key={officer._id} className="text-gray-600">
                                <p className="font-medium">{officer.name}</p>
                                <p className="text-gray-500">{officer.phone}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      {item.createdAt && (
                        <div className="text-xs text-gray-500 mb-4">
                          Alert triggered: {formatTimeAgo(item.createdAt)}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openInMaps(item.location?.lat, item.location?.lng)}
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Maps</span>
                        </button>
                        {item.assignmentStatus === 'Unassigned' && (
                          <button
                            type="button"
                            onClick={() => handleAssignOfficers(item._id)}
                            disabled={assigningOfficers === item._id}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-yellow-600 text-white text-xs sm:text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{assigningOfficers === item._id ? 'Assigning...' : 'Assign'}</span>
                          </button>
                        )}
                        {item.assignmentStatus === 'Assigned' && (
                          <button
                            type="button"
                            onClick={() => handleAssignOfficers(item._id)}
                            disabled={assigningOfficers === item._id}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{assigningOfficers === item._id ? 'Reassigning...' : 'Reassign'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openChat(item._id)}
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveAlert(item._id)}
                          disabled={resolvingAlert === item._id}
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{resolvingAlert === item._id ? 'Resolving...' : 'Resolve'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Assign Police Officers
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a police station to assign officers to this SOS alert
                </p>
              </div>

              <div className="p-6">
                {/* Alert Info */}
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-gray-900">{selectedAlert.name}</p>
                  <p className="text-xs text-gray-600">{selectedAlert.email}</p>
                </div>

                {/* Station Selection */}
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Police Station (sorted by nearest)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableStations.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No stations available</p>
                  ) : (
                    availableStations.map((station) => (
                      <button
                        key={station._id}
                        onClick={() => setSelectedStation(station._id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedStation === station._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{station.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {station.area}, {station.city}
                            </div>
                            {station.helpline && (
                              <div className="text-xs text-gray-500 mt-1">
                                📞 {station.helpline}
                              </div>
                            )}
                          </div>
                          {station.calculatedDistance !== null && (
                            <div className="text-xs font-semibold text-blue-600 whitespace-nowrap ml-2">
                              {formatDistance(station.calculatedDistance)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAssignOfficers}
                  disabled={!selectedStation || assigningOfficers === selectedAlert._id}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Assign Officers
                </button>
              </div>
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

export default EmergencyLocationsPage;
