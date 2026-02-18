import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { MapPin, Search, Plus, Edit, Trash2, Phone, Map, Navigation, Building, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ManageStationsPage = () => {
  const role = 'admin';
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [geocodingSuggestions, setGeocodingSuggestions] = useState([]);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const autocompleteTimeoutRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    city: '',
    helpline: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchStations();
  }, [currentPage, searchTerm]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, searchTerm]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stations', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm
        }
      });
      
      setStations(response.data.data.stations);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Geocode address using Nominatim API (free alternative to Google Maps API)
  const geocodeAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setGeocodingSuggestions([]);
      return;
    }

    setLoadingCoords(true);
    setGeocodingError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WomenSafetyApp'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const results = await response.json();
      setGeocodingSuggestions(
        results.map(result => ({
          name: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.address || {}
        }))
      );
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Unable to fetch location suggestions. You can enter coordinates manually.');
      setGeocodingSuggestions([]);
    } finally {
      setLoadingCoords(false);
    }
  }, []);

  const handleStationNameChange = useCallback((value) => {
    setFormData({ ...formData, name: value });
    
    // Debounce the geocoding request
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }
    
    autocompleteTimeoutRef.current = setTimeout(() => {
      geocodeAddress(value);
    }, 500);
  }, [formData, geocodeAddress]);

  const selectLocationSuggestion = (suggestion) => {
    setFormData({
      ...formData,
      name: formData.name || suggestion.address.amenity || suggestion.name.split(',')[0],
      latitude: suggestion.lat.toFixed(6),
      longitude: suggestion.lng.toFixed(6),
      area: formData.area || suggestion.address.neighbourhood || suggestion.address.suburb || '',
      city: formData.city || suggestion.address.city || suggestion.address.town || ''
    });
    setGeocodingSuggestions([]);
    setGeocodingError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await api.put(`/admin/stations/${editingStation._id}`, formData);
      } else {
        await api.post('/admin/stations', formData);
      }
      
      fetchStations();
      setShowAddForm(false);
      setEditingStation(null);
      setFormData({
        name: '',
        area: '',
        city: '',
        helpline: '',
        latitude: '',
        longitude: ''
      });
      setGeocodingSuggestions([]);
    } catch (error) {
      console.error('Error saving station:', error);
    }
  };

  const deleteStation = async (stationId) => {
    try {
      await api.delete(`/admin/stations/${stationId}`);
      
      setStations(stations.filter(s => s._id !== stationId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting station:', error);
      alert(error.response?.data?.message || 'Error deleting station');
    }
  };

  const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      area: station.area,
      city: station.city,
      helpline: station.helpline,
      latitude: station.location?.coordinates[1] || '',
      longitude: station.location?.coordinates[0] || ''
    });
    setShowAddForm(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const StationCard = ({ station }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{station.name}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {station.area}, {station.city}
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Phone className="w-4 h-4 mr-1" />
              {station.helpline}
            </div>
            {station.location && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Navigation className="w-4 h-4 mr-1" />
                {station.location.coordinates[1].toFixed(4)}, {station.location.coordinates[0].toFixed(4)}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(station)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(station._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (showAddForm) {
    return (
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStation(null);
                  setGeocodingSuggestions([]);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Police Stations
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStation ? 'Edit Police Station' : 'Add New Police Station'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Station Name with Autocomplete */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Station Name / Address
                      <span className="text-xs text-gray-500 ml-1">(Start typing to see suggestions)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleStationNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mumbai Central Police Station or 19.0760, 72.8777"
                      />
                      {loadingCoords && (
                        <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      
                      {/* Geocoding Suggestions Dropdown */}
                      {geocodingSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                          {geocodingSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectLocationSuggestion(suggestion)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {suggestion.address.amenity || suggestion.name.split(',')[0]}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {suggestion.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Lat: {suggestion.lat.toFixed(4)}, Lng: {suggestion.lng.toFixed(4)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {geocodingError && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
                          {geocodingError}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Helpline Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.helpline}
                      onChange={(e) => setFormData({...formData, helpline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                      {formData.latitude && <span className="text-xs text-green-600 ml-1">✓ Auto-filled</span>}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 19.0760"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                      {formData.longitude && <span className="text-xs text-green-600 ml-1">✓ Auto-filled</span>}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 72.8777"
                    />
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Auto-fill Coordinates:</p>
                    <p>Start typing the station name or address above. Suggestions will appear with automatic latitude and longitude values. Click any suggestion to fill all location fields.</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingStation(null);
                      setGeocodingSuggestions([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingStation ? 'Update' : 'Create'} Police Station
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Police Stations</h1>
            <p className="text-gray-600 mt-2">View and manage all police stations</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Police Station
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stations by name, area, or city..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No police stations found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No police stations have been added yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Police Station
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station) => (
                <StationCard key={station._id} station={station} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this police station? This action cannot be undone.
                Note: You cannot delete a station if police officers are assigned to it.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteStation(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStationsPage;
