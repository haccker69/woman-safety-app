import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import TravelBuddyChatRoom from '../../components/TravelBuddyChatRoom';
import { useAuth } from '../../context/AuthContext';
import { travelBuddyAPI } from '../../services/api';
import {
  Users,
  MapPin,
  Clock,
  Plus,
  X,
  Search,
  Send,
  Check,
  XCircle,
  Navigation,
  Phone,
  User,
  Loader,
  ChevronDown,
  ChevronUp,
  Ban,
  CheckCircle,
  AlertCircle,
  Route,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// Location search component using OpenStreetMap Nominatim
const LocationSearchInput = ({ label, color, value, onSelect, placeholder, icon }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(data);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(text), 400);
  };

  const handleSelect = (item) => {
    const name = item.display_name.split(',').slice(0, 3).join(', ');
    setQuery(name);
    setShowDropdown(false);
    setSuggestions([]);
    onSelect({
      name,
      lat: item.lat,
      lng: item.lon
    });
  };

  const borderColor = color === 'green' ? 'border-green-200 focus:ring-green-400' : 'border-red-200 focus:ring-red-400';

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          className={`w-full px-3 py-2 pr-8 border ${borderColor} rounded-lg text-sm focus:ring-2 focus:border-transparent`}
          required
        />
        {searching ? (
          <Loader className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400" />
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>{item.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TravelBuddyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'create' | 'my-trips'
  const [trips, setTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [chatTripId, setChatTripId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const [formData, setFormData] = useState({
    fromName: '',
    fromLat: '',
    fromLng: '',
    toName: '',
    toLat: '',
    toLng: '',
    departureTime: '',
    note: ''
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await travelBuddyAPI.findTrips({});
      setTrips(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await travelBuddyAPI.getMyTrips();
      setMyTrips(response?.data?.data || []);
    } catch (error) {
      console.error('Error fetching my trips:', error);
      toast.error('Failed to load your trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'find') fetchTrips();
    else if (activeTab === 'my-trips') fetchMyTrips();
  }, [activeTab, fetchTrips, fetchMyTrips]);

  const handleUseCurrentLocation = (field) => {
    if (!userLocation) {
      toast.error('Location not available. Please enable location services.');
      return;
    }
    if (field === 'from') {
      setFormData(prev => ({
        ...prev,
        fromLat: userLocation.lat.toString(),
        fromLng: userLocation.lng.toString(),
        fromName: prev.fromName || 'My Current Location'
      }));
      toast.success('Current location set as starting point');
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    
    if (!formData.fromName || !formData.fromLat || !formData.fromLng || 
        !formData.toName || !formData.toLat || !formData.toLng || !formData.departureTime) {
      if (!formData.fromLat || !formData.toLat) {
        toast.error('Please select locations from the search suggestions');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    setCreating(true);
    try {
      await travelBuddyAPI.createTrip({
        from: {
          name: formData.fromName,
          coordinates: [parseFloat(formData.fromLng), parseFloat(formData.fromLat)]
        },
        to: {
          name: formData.toName,
          coordinates: [parseFloat(formData.toLng), parseFloat(formData.toLat)]
        },
        departureTime: formData.departureTime,
        note: formData.note
      });

      toast.success('Trip posted! Others can now find and join you.');
      setFormData({ fromName: '', fromLat: '', fromLng: '', toName: '', toLat: '', toLng: '', departureTime: '', note: '' });
      setActiveTab('my-trips');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const handleSendRequest = async (tripId) => {
    try {
      setSendingRequest(tripId);
      await travelBuddyAPI.sendRequest(tripId, { message: requestMessage });
      toast.success('Join request sent!');
      setRequestMessage('');
      setSendingRequest(null);
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
      setSendingRequest(null);
    }
  };

  const handleAcceptRequest = async (tripId, requestId) => {
    try {
      await travelBuddyAPI.acceptRequest(tripId, requestId);
      toast.success('Request accepted! You are now travel buddies.');
      fetchMyTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (tripId, requestId) => {
    try {
      await travelBuddyAPI.rejectRequest(tripId, requestId);
      toast.info('Request rejected');
      fetchMyTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancelTrip = async (tripId) => {
    try {
      await travelBuddyAPI.cancelTrip(tripId);
      toast.success('Trip cancelled');
      fetchMyTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await travelBuddyAPI.completeTrip(tripId);
      toast.success('Trip marked as completed!');
      fetchMyTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete trip');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-green-100 text-green-700',
      Matched: 'bg-blue-100 text-blue-700',
      Completed: 'bg-gray-100 text-gray-700',
      Cancelled: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Travel Buddy</h1>
                  <p className="text-gray-600 mt-1">Find a safe travel companion going the same way</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-md border border-gray-100">
            {[
              { id: 'find', label: 'Find Companions', icon: Search },
              { id: 'create', label: 'Post a Trip', icon: Plus },
              { id: 'my-trips', label: 'My Trips', icon: Route }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Find Companions Tab */}
          {activeTab === 'find' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : trips.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips available right now</h3>
                  <p className="text-gray-500 mb-6">Be the first to post a trip and find a travel companion!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Post a Trip
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {trip.userId?.profilePhoto ? (
                            <img
                              src={trip.userId.profilePhoto}
                              alt={trip.userId.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{trip.userId?.name || 'User'}</h3>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {(Array.isArray(trip.matchedWith) ? trip.matchedWith.length : 0) + 1}/5 members
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-medium">From:</span> {trip.from.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="font-medium">To:</span> {trip.to.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatDate(trip.departureTime)}
                              </div>
                            </div>
                            {trip.note && (
                              <p className="text-sm text-gray-500 mt-2 italic">"{trip.note}"</p>
                            )}
                          </div>
                        </div>

                        <div>
                          {trip.userId?._id === user?._id ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-lg">
                              Your Trip
                            </span>
                          ) : trip.matchedWith?.some(m => (m._id || m) === user?._id || m._id?.toString() === user?._id) ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg">
                              Joined
                            </span>
                          ) : trip.requests?.some(r => (r.userId?._id || r.userId) === user?._id || (r.userId?._id || r.userId)?.toString() === user?._id) ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-lg">
                              Request Sent
                            </span>
                          ) : trip.matchedWith?.length >= 4 ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-600 rounded-lg">
                              Full
                            </span>
                          ) : sendingRequest === trip._id ? (
                            <div className="flex flex-col items-end gap-2">
                              <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                placeholder="Hi! I'm also heading that way..."
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSendingRequest(null); setRequestMessage(''); }}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSendRequest(trip._id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  <Send className="w-3 h-3" />
                                  Send
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSendingRequest(trip._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Request to Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Trip Tab */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Navigation className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Post Your Trip</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Share where you're going so others heading the same way can join you for a safer journey.
              </p>

              <form onSubmit={handleCreateTrip} className="space-y-6">
                {/* From Location */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Starting Point
                  </label>
                  <LocationSearchInput
                    color="green"
                    value={formData.fromName}
                    placeholder="Search starting location (e.g., Central Mall, Sector 15)"
                    onSelect={({ name, lat, lng }) => setFormData(prev => ({ ...prev, fromName: name, fromLat: lat, fromLng: lng }))}
                  />
                  {formData.fromLat && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Location selected
                    </p>
                  )}
                </div>

                {/* To Location */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Destination
                  </label>
                  <LocationSearchInput
                    color="red"
                    value={formData.toName}
                    placeholder="Search destination (e.g., Railway Station, Airport)"
                    onSelect={({ name, lat, lng }) => setFormData(prev => ({ ...prev, toName: name, toLat: lat, toLng: lng }))}
                  />
                  {formData.toLat && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Location selected
                    </p>
                  )}
                </div>

                {/* Departure Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4" />
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Note (Optional)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="E.g., Taking an auto, prefer to walk, leaving from the east gate..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {creating ? 'Posting...' : 'Post Trip'}
                </button>
              </form>
            </div>
          )}

          {/* My Trips Tab */}
          {activeTab === 'my-trips' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : myTrips.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                  <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h3>
                  <p className="text-gray-500 mb-6">Post your first trip to find a safe companion!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Post a Trip
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTrips.map(trip => (
                    <div key={trip._id} className="bg-white rounded-xl shadow-md border border-gray-100">
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedTrip(expandedTrip === trip._id ? null : trip._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusBadge(trip.status)}
                              <span className="text-xs text-gray-400">{formatDate(trip.createdAt)}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-medium">From:</span> {trip.from.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="font-medium">To:</span> {trip.to.name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                Departure: {formatDate(trip.departureTime)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {trip.userId?._id === user?._id && trip.requests?.filter(r => r.status === 'Pending').length > 0 && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {trip.requests.filter(r => r.status === 'Pending').length} pending
                              </span>
                            )}
                            {trip.userId?._id !== user?._id && trip.status === 'Matched' && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Matched
                              </span>
                            )}
                            {trip.userId?._id !== user?._id && trip.status === 'Active' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {expandedTrip === trip._id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedTrip === trip._id && (
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                          {/* Matched Buddy */}
                          {trip.status === 'Matched' && (() => {
                            const isOwner = trip.userId?._id === user?._id;
                            // For owner: show all matched buddies. For buddy: show trip owner + other buddies.
                            const buddies = [];
                            if (!isOwner && trip.userId) buddies.push(trip.userId);
                            if (Array.isArray(trip.matchedWith)) {
                              trip.matchedWith.forEach(b => {
                                if (b && b._id !== user?._id) buddies.push(b);
                              });
                            }
                            return buddies.length > 0 ? (
                              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Travel Buddies ({buddies.length + 1}/5)
                                </h4>
                                <div className="space-y-3">
                                  {buddies.map(buddy => (
                                    <div key={buddy._id} className="flex items-center gap-3">
                                      {buddy.profilePhoto ? (
                                        <img
                                          src={buddy.profilePhoto}
                                          alt={buddy.name}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                                          <User className="w-5 h-5 text-blue-700" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-gray-900">{buddy.name}</p>
                                        <a href={`tel:${buddy.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                          <Phone className="w-3 h-3" />
                                          {buddy.phone}
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <div className="w-2 h-2 rounded-full bg-green-500" />
                                      <span className="font-medium">From:</span> {trip.from.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <div className="w-2 h-2 rounded-full bg-red-500" />
                                      <span className="font-medium">To:</span> {trip.to.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      Departure: {formatDate(trip.departureTime)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setChatTripId(trip._id); setChatOpen(true); }}
                                    className="w-full mt-3 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat with Travel Buddies
                                  </button>
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Pending request status for non-owners */}
                          {trip.userId?._id !== user?._id && trip.status === 'Active' && (() => {
                            const myRequest = trip.requests?.find(r => r.userId?._id === user?._id);
                            if (!myRequest) return null;
                            return (
                              <div className={`mb-4 p-4 rounded-lg border ${
                                myRequest.status === 'Pending' ? 'bg-yellow-50 border-yellow-100' :
                                myRequest.status === 'Rejected' ? 'bg-red-50 border-red-100' :
                                'bg-green-50 border-green-100'
                              }`}>
                                <p className={`text-sm font-medium ${
                                  myRequest.status === 'Pending' ? 'text-yellow-700' :
                                  myRequest.status === 'Rejected' ? 'text-red-700' :
                                  'text-green-700'
                                }`}>
                                  {myRequest.status === 'Pending' && '⏳ Your request is pending approval...'}
                                  {myRequest.status === 'Rejected' && '❌ Your request was declined.'}
                                  {myRequest.status === 'Accepted' && '✅ Your request was accepted!'}
                                </p>
                              </div>
                            );
                          })()}

                          {/* Join Requests — only show to trip owner */}
                          {trip.userId?._id === user?._id && trip.requests && trip.requests.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Join Requests</h4>
                              <div className="space-y-2">
                                {trip.requests.map(req => (
                                  <div key={req._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {req.userId?.profilePhoto ? (
                                        <img
                                          src={req.userId.profilePhoto}
                                          alt={req.userId.name}
                                          className="w-9 h-9 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                                          <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{req.userId?.name}</p>
                                        {req.message && (
                                          <p className="text-xs text-gray-500 italic">"{req.message}"</p>
                                        )}
                                      </div>
                                    </div>

                                    {req.status === 'Pending' ? (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleAcceptRequest(trip._id, req._id); }}
                                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                          <Check className="w-3 h-3" />
                                          Accept
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleRejectRequest(trip._id, req._id); }}
                                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                          <XCircle className="w-3 h-3" />
                                          Reject
                                        </button>
                                      </div>
                                    ) : (
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        req.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {req.status}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions — only for trip owner */}
                          {trip.userId?._id === user?._id && (trip.status === 'Active' || trip.status === 'Matched') && (
                            <div className="flex gap-3 pt-2">
                              {trip.status === 'Matched' && (
                                <button
                                  onClick={() => handleCompleteTrip(trip._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark as Completed
                                </button>
                              )}
                              <button
                                onClick={() => handleCancelTrip(trip._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                <Ban className="w-4 h-4" />
                                Cancel Trip
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Travel Buddy Chat Modal */}
      <TravelBuddyChatRoom
        tripId={chatTripId}
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatTripId(null); }}
      />
    </div>
  );
};

export default TravelBuddyPage;

