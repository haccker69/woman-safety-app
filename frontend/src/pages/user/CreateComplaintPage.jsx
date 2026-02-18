import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../../components/Sidebar';
import { FileText, MapPin, AlertTriangle, Send, Navigation, Loader, Search } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Custom markers: red for incident, blue for police stations (no external images)
const createCircleIcon = (color, label = '') =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
const incidentIcon = createCircleIcon('#dc2626', '!');
const stationIcon = createCircleIcon('#2563eb', 'P');

const CreateComplaintPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeSearching, setPlaceSearching] = useState(false);
  const [stations, setStations] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    stationId: '',
    lat: '',
    lng: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const incidentPosition = formData.lat && formData.lng
    ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }
    : null;

  // Memoize so the map doesn't recenter on every render when user pans/zooms
  const mapCenter = useMemo(
    () => (incidentPosition ? [incidentPosition.lat, incidentPosition.lng] : null),
    [incidentPosition?.lat, incidentPosition?.lng]
  );

  const validateCoordinates = () => {
    const errors = {};
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (!formData.lat || isNaN(lat)) {
      errors.lat = 'Valid latitude is required';
    } else if (lat < -90 || lat > 90) {
      errors.lat = 'Latitude must be between -90 and 90';
    }

    if (!formData.lng || isNaN(lng)) {
      errors.lng = 'Valid longitude is required';
    } else if (lng < -180 || lng > 180) {
      errors.lng = 'Longitude must be between -180 and 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Get current location using browser's geolocation API
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Unable to get your location. Please enable location access.'));
        }
      );
    });
  };

  // Fetch nearby stations based on coordinates
  const fetchNearbyStations = async (lat, lng) => {
    try {
      const response = await api.get(`/stations/nearby?lat=${lat}&lng=${lng}`);
      
      if (response.data.success) {
        setStations(response.data.data || []);
        setHasLocation(true);
        toast.success(`Found ${response.data.data?.length || 0} nearby police stations`);
      } else {
        toast.error(response.data.message || 'No nearby stations found');
        setStations([]);
        setHasLocation(true);
      }
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
      toast.error('Failed to fetch nearby stations');
      setStations([]);
      setHasLocation(true);
    }
  };

  // Search place by name (OpenStreetMap Nominatim – no API key)
  const handleSearchPlace = async () => {
    const query = placeSearch.trim();
    if (!query) {
      toast.error('Enter a place name or address');
      return;
    }
    setPlaceSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { Accept: 'application/json', 'User-Agent': 'WomenSafetyApp/1.0' } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        toast.error('Place not found. Try a different name or address.');
        return;
      }
      const { lat, lon } = data[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      setFormData((prev) => ({ ...prev, lat: String(latitude), lng: String(longitude) }));
      setFormErrors((prev) => ({ ...prev, lat: undefined, lng: undefined }));
      await fetchNearbyStations(latitude, longitude);
      toast.success('Location set. Select a police station below.');
    } catch (err) {
      console.error('Geocode error:', err);
      toast.error('Could not find that place. Try again or use current location.');
    } finally {
      setPlaceSearching(false);
    }
  };

  // Handle location button click
  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        lat: location.lat.toString(),
        lng: location.lng.toString()
      }));
      
      // Fetch nearby stations based on this location
      await fetchNearbyStations(location.lat, location.lng);
      
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Location error:', error);
      toast.error(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle manual coordinate input
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If both coordinates are provided, fetch nearby stations
    if (name === 'lat' || name === 'lng') {
      const newLat = name === 'lat' ? value : formData.lat;
      const newLng = name === 'lng' ? value : formData.lng;
      
      if (newLat && newLng) {
        const lat = parseFloat(newLat);
        const lng = parseFloat(newLng);
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          fetchNearbyStations(lat, lng);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Use coordinate handler for lat/lng fields
    if (name === 'lat' || name === 'lng') {
      handleCoordinateChange(e);
    } else {
      // Normal handler for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCoordinates()) {
      toast.error('Please fix coordinate errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/complaints', formData);
      
      toast.success('Complaint filed successfully!');
      navigate('/user/complaints');
    } catch (error) {
      console.error('Error filing complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50/80 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">File a Complaint</h1>
                <p className="text-gray-500 text-sm mt-0.5">Report an incident to the nearest police station</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              {/* Step 1: Description */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 text-sm font-semibold">1</span>
                  <h2 className="text-base font-semibold text-gray-900">What happened?</h2>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-gray-600">Describe the incident in detail</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none resize-none"
                  placeholder="Include date, time, place, and what occurred. Be as specific as possible."
                />
              </section>

              <hr className="border-gray-100" />

              {/* Step 2: Location */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 text-sm font-semibold">2</span>
                  <h2 className="text-base font-semibold text-gray-900">Where did it happen?</h2>
                </div>

                <div className="space-y-4">
                  {/* Search place */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Search by place or address</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={placeSearch}
                          onChange={(e) => setPlaceSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPlace())}
                          placeholder="e.g. Connaught Place Delhi, MG Road Bangalore"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none placeholder-gray-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchPlace}
                        disabled={placeSearching}
                        className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2 transition-colors shrink-0"
                      >
                        {placeSearching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Or use your current location below.</p>
                  </div>

                  {/* Current location */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50/50 hover:text-red-700 disabled:opacity-50 transition-all"
                  >
                    {locationLoading ? (
                      <Loader className="w-5 h-5 animate-spin text-red-600" />
                    ) : (
                      <Navigation className="w-5 h-5" />
                    )}
                    <span className="font-medium">{locationLoading ? 'Getting location…' : 'Use my current location'}</span>
                  </button>

                  {/* Manual coords */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lat"
                        value={formData.lat}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none ${formErrors.lat ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="28.6139"
                      />
                      {formErrors.lat && <p className="mt-1 text-xs text-red-600">{formErrors.lat}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lng"
                        value={formData.lng}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none ${formErrors.lng ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="77.2090"
                      />
                      {formErrors.lng && <p className="mt-1 text-xs text-red-600">{formErrors.lng}</p>}
                    </div>
                  </div>

                  {/* Location success */}
                  {hasLocation && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-800 text-sm">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-200 text-green-800 text-xs font-bold">✓</span>
                      Location set · {stations.length} nearby station{stations.length !== 1 ? 's' : ''} found
                    </div>
                  )}

                  {/* Map */}
                  {hasLocation && incidentPosition && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Map — drag to pan, scroll to zoom</p>
                      <div className="rounded-xl border border-gray-200 overflow-hidden map-wrapper bg-gray-50">
                        <MapContainer
                          key={`${incidentPosition.lat}-${incidentPosition.lng}`}
                          center={mapCenter}
                          zoom={14}
                          style={{ height: 360, width: '100%' }}
                          scrollWheelZoom
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[incidentPosition.lat, incidentPosition.lng]} icon={incidentIcon}>
                            <Popup>Incident location</Popup>
                          </Marker>
                          {stations.map((station) => (
                            <Marker
                              key={station._id}
                              position={[Number(station.latitude), Number(station.longitude)]}
                              icon={stationIcon}
                            >
                              <Popup>
                                <strong>{station.name}</strong>
                                <br />
                                {station.area} · {station.distance}
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Incident</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Police stations</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Step 3: Station + Submit */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 text-sm font-semibold">3</span>
                  <h2 className="text-base font-semibold text-gray-900">Choose police station</h2>
                </div>

                {!hasLocation ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Set the incident location above first to see nearby stations.
                  </div>
                ) : stations.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    No police stations within 5 km. Try another location.
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Nearest stations</label>
                    <select
                      name="stationId"
                      value={formData.stationId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white"
                    >
                      <option value="">Select a station</option>
                      {stations.map((station) => (
                        <option key={station._id} value={station._id}>
                          {station.name} — {station.area} ({station.distance || 'Nearby'})
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading || !hasLocation || stations.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {loading ? 'Submitting…' : 'Submit complaint'}
                  </button>
                </div>
              </section>
            </div>
          </form>

          {/* Notice */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-100">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Please note</p>
                <ul className="text-amber-800/90 space-y-0.5 text-xs">
                  <li>· File only genuine complaints with accurate details.</li>
                  <li>· False complaints may lead to legal action.</li>
                  <li>· Track status under &quot;My Complaints&quot;.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateComplaintPage;