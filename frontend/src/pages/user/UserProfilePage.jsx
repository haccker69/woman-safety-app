import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { authAPI, guardianAPI } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Users,
  Camera,
  Loader
} from 'lucide-react';
import { toast } from 'react-toastify';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guardians, setGuardians] = useState([]);
  const [guardiansLoading, setGuardiansLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    setGuardiansLoading(true);
    try {
      const response = await guardianAPI.getGuardians();
      const guardiansData = response?.data?.data ?? response?.data ?? [];
      setGuardians(Array.isArray(guardiansData) ? guardiansData : []);
    } catch (error) {
      console.error('Error fetching guardians:', error);
      setGuardians([]);
    } finally {
      setGuardiansLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authAPI.updateUserProfile(formData);
      const updatedUser = response?.data?.data;
      if (updatedUser) {
        updateUser(updatedUser);
        setFormData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          address: updatedUser.address || ''
        });
      }
      toast.success(response?.data?.message || 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await authAPI.updateProfilePhoto(reader.result);
        const updatedUser = response?.data?.data;
        if (updatedUser) {
          updateUser(updatedUser);
        }
        toast.success('Profile photo updated!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to upload photo');
      } finally {
        setUploadingPhoto(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div 
                    className="relative w-24 h-24 mx-auto mb-4 cursor-pointer group"
                    onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                  >
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingPhoto ? (
                        <Loader className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Click to change photo</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{user?.name}</h2>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        {user?.address || 'Location not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user?.name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user?.email || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user?.phone || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user?.address || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contacts Summary */}
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Emergency Contacts</h2>
                  <span className="text-sm text-gray-500">
                    {guardians.length}/5 contact(s)
                  </span>
                </div>
                
                {guardiansLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : guardians.length > 0 ? (
                  <div className="space-y-3">
                    {guardians.map((guardian) => (
                      <div key={guardian._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{guardian.name}</p>
                            <p className="text-sm text-gray-600">{guardian.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{guardian.phone}</p>
                        </div>
                      </div>
                    ))}
                    {guardians.length < 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        You can add up to {5 - guardians.length} more contact{5 - guardians.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No emergency contacts added</p>
                    <p className="text-sm text-gray-400 mb-4">Add trusted contacts to receive emergency alerts</p>
                    <a href="/user/guardians" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      <Edit className="w-4 h-4 mr-2" />
                      Add Emergency Contacts
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
