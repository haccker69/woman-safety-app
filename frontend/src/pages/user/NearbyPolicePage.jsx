import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Sidebar';
import { MapPin, Phone, Navigation, Search, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const userIcon = L.divIcon({
  className: 'nearby-user-marker',
  html: '<div style="background:#dc2626;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const stationIcon = L.divIcon({
  className: 'nearby-station-marker',
  html: '<div style="background:#2563eb;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const NearbyPolicePage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) fetchNearbyStations();
  }, [userLocation]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      },
      () => {
        setLocationError('Unable to get your location. Please enable location access.');
        setLoading(false);
      }
    );
  };

  const fetchNearbyStations = async () => {
    if (!userLocation) return;
    try {
      setLoading(true);
      const response = await api.get('/stations/nearby', {
        params: { lat: userLocation.lat, lng: userLocation.lng }
      });
      setStations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = useMemo(() => {
    if (!searchTerm.trim()) return stations;
    const q = searchTerm.toLowerCase();
    return stations.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.area && s.area.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
  }, [stations, searchTerm]);

  const getStationCoords = (station) => {
    if (station.latitude != null && station.longitude != null)
      return { lat: Number(station.latitude), lng: Number(station.longitude) };
    if (station.location?.coordinates?.length === 2)
      return { lat: station.location.coordinates[1], lng: station.location.coordinates[0] };
    return null;
  };

  const getDirectionsUrl = (station) => {
    const coords = getStationCoords(station);
    if (coords) return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    return '#';
  };

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : null;

  if (locationError) {
    return (
      <div className="flex">
        <Sidebar role="user" />
        <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50/80 p-4 md:p-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Location required</h2>
              <p className="text-gray-600 text-sm mb-6">{locationError}</p>
              <button
                onClick={getUserLocation}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50/80 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Nearby police stations
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Within 5 km of your location
                  {userLocation && (
                    <span className="text-gray-400 ml-1">
                      · {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setRefreshing(true); getUserLocation(); setTimeout(() => setRefreshing(false), 1500); }}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-white hover:border-gray-300 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh location
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, area, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
              />
            </div>
          </div>

          {/* Map */}
          {mapCenter && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Map — you and nearby stations</span>
              </div>
              <div className="h-80">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCenter} icon={userIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  {filteredStations.map((station) => {
                    const coords = getStationCoords(station);
                    if (!coords) return null;
                    return (
                      <Marker key={station._id} position={[coords.lat, coords.lng]} icon={stationIcon}>
                        <Popup>
                          <strong>{station.name}</strong>
                          <br />
                          {station.area}
                          {station.city && `, ${station.city}`}
                          <br />
                          {station.distance && <span className="text-gray-500">{station.distance}</span>}
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              <div className="px-4 py-2 flex gap-4 text-xs text-gray-500 border-t border-gray-100">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Your location</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Police stations</span>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="mt-3 text-sm text-gray-500">Finding nearby stations…</p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No stations found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Try a different search' : 'No police stations within 5 km'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStations.map((station) => (
                <div
                  key={station._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{station.name}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          {[station.area, station.city].filter(Boolean).join(', ') || '—'}
                        </p>
                      </div>
                    </div>
                    {station.distance && (
                      <span className="text-sm font-medium text-blue-600 shrink-0">{station.distance}</span>
                    )}
                  </div>
                  {station.helpline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {station.helpline}
                    </div>
                  )}
                  <a
                    href={getDirectionsUrl(station)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Get directions
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyPolicePage;
