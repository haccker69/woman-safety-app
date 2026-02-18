import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { Shield, Search, Plus, Edit, Trash2, Mail, Phone, MapPin, UserPlus, AlertCircle, User, Lock, X, ChevronDown, Camera, Loader } from 'lucide-react';
import api from '../../services/api';

// Separate AddPoliceModal component to prevent re-renders
const AddPoliceModal = React.memo(({ 
  isOpen, 
  onClose, 
  editingPolice, 
  formData, 
  onFormDataChange, 
  stations, 
  onSubmit,
  fileInputRef,
  uploadingPhoto,
  onPhotoUpload
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {editingPolice ? 'Edit Officer' : 'Add Police Officer'}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {editingPolice ? 'Update officer details' : 'Create a new police account'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-5">
            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoUpload}
                className="hidden"
              />
              <div 
                className="relative w-20 h-20 cursor-pointer group"
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              >
                {formData.profilePhoto ? (
                  <img
                    src={formData.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Click to add photo</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="officer@example.com"
                  value={formData.email}
                  onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingPolice ? 'New password (optional)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required={!editingPolice}
                    placeholder={editingPolice ? 'Leave blank to keep' : 'Min 6 characters'}
                    value={formData.password}
                    onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Station */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Police Station</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={formData.stationId}
                  onChange={(e) => onFormDataChange({ ...formData, stationId: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="">Select a station</option>
                  {stations.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.area}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/30 transition-all"
            >
              <Shield className="w-4 h-4" />
              {editingPolice ? 'Update Officer' : 'Create Officer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddPoliceModal.displayName = 'AddPoliceModal';

// Separate DeleteConfirmModal component
const DeleteConfirmModal = React.memo(({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-12 h-12 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            <p className="text-gray-600">
              Are you sure you want to delete this police officer? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Officer
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmModal.displayName = 'DeleteConfirmModal';

const ManagePoliceAccountsPage = () => {
  const role = 'admin';
  const [police, setPolice] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPolice, setEditingPolice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    stationId: '',
    profilePhoto: ''
  });

  useEffect(() => {
    fetchPolice();
    fetchStations();
  }, [currentPage, searchTerm]);

  const fetchPolice = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/police', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm
        }
      });
      
      setPolice(response?.data?.data?.police || []);
      setTotalPages(response?.data?.data?.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching police:', error);
      setPolice([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await api.get('/admin/stations', {
        params: { limit: 100 }
      });
      
      setStations(response?.data?.data?.stations || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setStations([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolice) {
        await api.put(`/admin/police/${editingPolice._id}`, formData);
      } else {
        await api.post('/admin/police', formData);
      }
      
      fetchPolice();
      setShowAddForm(false);
      setEditingPolice(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        stationId: '',
        profilePhoto: ''
      });
    } catch (error) {
      console.error('Error saving police officer:', error);
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to save police officer'));
    }
  };

  const deletePoliceOfficer = async (policeId) => {
    try {
      await api.delete(`/admin/police/${policeId}`);
      setPolice((prev) => prev.filter(p => p._id !== policeId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting police officer:', error);
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to delete police officer'));
    }
  };

  const handleFormDataChange = useCallback((newData) => {
    setFormData(newData);
  }, []);

  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddForm(false);
    setEditingPolice(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      stationId: '',
      profilePhoto: ''
    });
  }, []);

  const handleOpenAddForm = useCallback(() => {
    setEditingPolice(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      stationId: '',
      profilePhoto: ''
    });
    setShowAddForm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) {
      deletePoliceOfficer(deleteConfirm);
    }
  }, [deleteConfirm]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleEdit = useCallback((officer) => {
    setEditingPolice(officer);
    setFormData({
      name: officer.name || '',
      email: officer.email || '',
      password: '',
      phone: officer.phone || '',
      stationId: officer.stationId?._id || '',
      profilePhoto: officer.profilePhoto || ''
    });
    setShowAddForm(true);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-green-100 text-green-800';
    if (status === 'Inactive') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const PoliceCard = ({ officer }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {officer.profilePhoto ? (
              <img
                src={officer.profilePhoto}
                alt={officer.name}
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{officer.name}</h3>
              <p className="text-sm text-gray-600">{officer.email}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {officer.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            <span>{officer.phone}</span>
          </div>
          {officer.stationId && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{officer.stationId.name} - {officer.stationId.area}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Added {officer.createdAt ? new Date(officer.createdAt).toLocaleDateString() : 'N/A'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(officer)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirm(officer._id)}
              className="text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar role={role} />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Police Accounts</h1>
              <p className="text-gray-600 mt-2">View and manage all police officers</p>
            </div>
            <button
              onClick={handleOpenAddForm}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Police Officer
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Officers</p>
                  <p className="text-2xl font-bold text-blue-600">{police.length}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Stations</p>
                  <p className="text-2xl font-bold text-green-600">{stations.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search police officers by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Police Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : police.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No police officers found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search terms' : 'No police officers have been added yet'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add First Police Officer
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {police.map((officer) => (
                  <PoliceCard key={officer._id} officer={officer} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center space-x-2 bg-white rounded-lg shadow-lg px-4 py-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 text-sm font-medium rounded-md transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <AddPoliceModal
          isOpen={showAddForm}
          onClose={handleCloseModal}
          editingPolice={editingPolice}
          formData={formData}
          onFormDataChange={handleFormDataChange}
          stations={stations}
          onSubmit={handleSubmit}
          fileInputRef={fileInputRef}
          uploadingPhoto={uploadingPhoto}
          onPhotoUpload={handlePhotoUpload}
        />
        <DeleteConfirmModal
          isOpen={!!deleteConfirm}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </div>
  );
};

export default ManagePoliceAccountsPage;
