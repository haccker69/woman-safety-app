import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  Users, 
  Shield, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  UserPlus,
  Activity,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
  const role = 'admin';
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when page becomes visible (navigation back to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard');
      
      setStats(response.data.data.stats);
      setRecentComplaints(response.data.data.recentComplaints);
      setRecentUsers(response.data.data.recentUsers);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, iconBg }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">{value || 0}</p>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${iconBg} shadow-inner flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of the Women Safety System</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                System Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Active Users: <strong>{stats?.totalUsers || 0}</strong></span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Active Police: <strong>{stats?.totalPolice || 0}</strong></span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Total Stations: <strong>{stats?.totalStations || 0}</strong></span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Total Complaints: <strong>{stats?.totalComplaints || 0}</strong></span>
                </div>
              </div>
            </div>
            <div className="text-right mt-4 lg:mt-0">
              <span className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats?.totalUsers || 0}
            color="bg-blue-500"
            iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            icon={Shield}
            title="Total Police"
            value={stats?.totalPolice || 0}
            color="bg-green-500"
            iconBg="bg-gradient-to-br from-green-400 to-green-600"
          />
          <StatCard
            icon={MapPin}
            title="Police Stations"
            value={stats?.totalStations || 0}
            color="bg-purple-500"
            iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
          />
          <StatCard
            icon={FileText}
            title="Total Complaints"
            value={stats?.totalComplaints || 0}
            color="bg-orange-500"
            iconBg="bg-gradient-to-br from-orange-400 to-orange-600"
          />
        </div>

        {/* Complaint Status Cards with Logos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={AlertTriangle}
            title="Pending Complaints"
            value={stats?.pendingComplaints || 0}
            iconBg="bg-gradient-to-br from-red-400 to-red-600"
          />
          <StatCard
            icon={Clock}
            title="In Progress"
            value={stats?.inProgressComplaints || 0}
            iconBg="bg-gradient-to-br from-yellow-400 to-yellow-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved"
            value={stats?.resolvedComplaints || 0}
            iconBg="bg-gradient-to-br from-green-400 to-green-600"
          />
        </div>

        {/* Recent Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Complaints */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="p-6">
              {recentComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No recent complaints</p>
                  <p className="text-sm text-gray-400 mt-1">Recent complaints will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentComplaints.map((complaint) => (
                    <div key={complaint._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-blue-500">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2 gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">
                              {complaint.userId?.name || 'Unknown User'}
                            </p>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                              complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {complaint.status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {complaint.description?.substring(0, 100) || 'No description'}...
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-2 gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span>{complaint.stationId?.name || 'Unknown Station'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">New Users</h2>
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="p-6">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No new users</p>
                  <p className="text-sm text-gray-400 mt-1">New users from the last 7 days will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentUsers.map((user) => (
                    <div key={user._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email || 'No email'}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
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
  );
};

export default AdminDashboard;
