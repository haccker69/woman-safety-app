import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { Users, Search, Eye, Trash2, Calendar, Mail, Phone, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';

const ManageUsersPage = () => {
  const role = 'admin';
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm
        }
      });
      
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      
      setSelectedUser(response.data.data);
      setShowUserDetails(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      
      setUsers(users.filter(user => user._id !== userId));
      setDeleteConfirm(null);
      if (showUserDetails) {
        setShowUserDetails(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const UserCard = ({ user }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {user.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt={user.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Mail className="w-4 h-4 mr-1" />
              {user.email}
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Phone className="w-4 h-4 mr-1" />
              {user.phone}
            </div>
            {user.location && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.location.coordinates[1].toFixed(4)}, {user.location.coordinates[0].toFixed(4)}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchUserDetails(user._id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(user._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <Calendar className="w-4 h-4 mr-1" />
        Joined {new Date(user.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  if (showUserDetails && selectedUser) {
    return (
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Users
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  {selectedUser.user.profilePhoto ? (
                    <img 
                      src={selectedUser.user.profilePhoto} 
                      alt={selectedUser.user.name} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xl">
                        {selectedUser.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedUser.user.name}</h3>
                    <p className="text-gray-600">{selectedUser.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.user.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.user.phone}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        Joined {new Date(selectedUser.user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedUser.user.guardians?.length || 0} Guardians
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Complaint History ({selectedUser.complaints.length})
                  </h4>
                  {selectedUser.complaints.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No complaints filed</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.complaints.map((complaint) => (
                        <div key={complaint._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-900">{complaint.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span>{complaint.stationId?.name}</span>
                                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                              complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage all registered users</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Grid */}
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
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No users have registered yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard key={user._id} user={user} />
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
                Are you sure you want to delete this user? This action will also delete all their complaints and cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteConfirm)}
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

export default ManageUsersPage;
