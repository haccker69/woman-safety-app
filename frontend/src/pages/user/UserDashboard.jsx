import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { 
  AlertCircle, 
  Users, 
  MapPin, 
  FileText, 
  Shield,
  Navigation,
  Activity,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { complaintAPI, guardianAPI } from '../../services/api';

// StatCard component moved outside to avoid ReferenceError
const StatCard = ({ icon: Icon, title, value, color, iconBg, link }) => (
  <Link to={link} className="block">
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Icon className={`w-5 h-5 ${color} mr-2`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${iconBg} shadow-inner`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  </Link>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    guardians: 0,
    complaints: 0,
    nearbyStations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchRecentActivity();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const fetchRecentActivity = async () => {
    setRecentActivityLoading(true);
    try {
      const complaintsRes = await complaintAPI.getUserComplaints();
      const complaintsRaw = complaintsRes?.data?.data ?? complaintsRes?.data ?? [];
      const complaintsList = Array.isArray(complaintsRaw) ? complaintsRaw : [];

      const complaintActivities = complaintsList.slice(0, 8).map((complaint) => {
        const desc = complaint.description || '';
        const shortDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
        const rawStatus = (complaint.status || 'Pending').toString().toLowerCase();
        const statusMap = { pending: 'Pending', 'in progress': 'In Progress', resolved: 'Resolved' };
        const normalizedStatus = statusMap[rawStatus] || 'Pending';
        const ts = complaint.createdAt;
        const timestamp = ts != null ? (typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : ts) : null;
        return {
          id: complaint._id,
          type: 'complaint',
          title: 'Complaint filed',
          description: shortDesc || 'No description',
          status: normalizedStatus,
          timestamp: timestamp && !isNaN(timestamp.getTime()) ? timestamp.toISOString() : null,
          icon: FileText,
          color: 'purple',
          link: '/user/complaints',
        };
      });

      let guardiansCount = 0;
      try {
        const guardiansRes = await guardianAPI.getGuardians();
        const guardians = guardiansRes?.data?.data ?? guardiansRes?.data ?? [];
        guardiansCount = Array.isArray(guardians) ? guardians.length : 0;
      } catch (_) {}

      const activities = [...complaintActivities];
      if (guardiansCount > 0) {
        activities.push({
          id: 'guardians-summary',
          type: 'guardians',
          title: 'Emergency guardians',
          description: `${guardiansCount} guardian${guardiansCount !== 1 ? 's' : ''} set up`,
          timestamp: null,
          icon: Users,
          color: 'green',
          link: '/user/guardians',
        });
      }

      const withTimestamp = activities
        .filter((a) => a.timestamp != null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const guardiansSummary = activities.find((a) => a.id === 'guardians-summary');
      const activityList = guardiansSummary
        ? [...withTimestamp.slice(0, 4), guardiansSummary]
        : withTimestamp.slice(0, 5);
      setRecentActivity(activityList);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setRecentActivityLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (timestamp == null || timestamp === '') return '—';
    const now = new Date();
    const past = new Date(timestamp);
    if (isNaN(past.getTime())) return '—';
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatActivityDate = (timestamp) => {
    if (timestamp == null || timestamp === '') return null;
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const activityIconBg = (color) =>
    color === 'green' ? 'bg-green-100' : 'bg-purple-100';
  const activityIconColor = (color) =>
    color === 'green' ? 'text-green-600' : 'text-purple-600';

  const fetchDashboardStats = async () => {
    try {
      // Get guardians count from API so it stays up to date
      let guardiansCount = 0;
      try {
        const guardiansRes = await guardianAPI.getGuardians();
        const guardians = guardiansRes?.data?.data ?? guardiansRes?.data ?? [];
        guardiansCount = Array.isArray(guardians) ? guardians.length : 0;
      } catch (_) {}

      // Get user's complaints count from API
      const complaintsResponse = await complaintAPI.getUserComplaints();
      const complaintsData = complaintsResponse?.data?.data ?? complaintsResponse?.data ?? [];
      const complaintsCount = Array.isArray(complaintsData) ? complaintsData.length : 0;
      
      // Get nearby stations count (requires user location)
      let nearbyStationsCount = 0;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const stationsResponse = await api.get('/stations/nearby', {
                params: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
              });
              nearbyStationsCount = stationsResponse.data.data?.length || 0;
              
              setStats({
                guardians: guardiansCount,
                complaints: complaintsCount,
                nearbyStations: nearbyStationsCount
              });
            } catch (error) {
              console.error('Error fetching nearby stations:', error);
              setStats({
                guardians: guardiansCount,
                complaints: complaintsCount,
                nearbyStations: 0
              });
            }
          },
          () => {
            // Location denied, set stations count to 0
            setStats({
              guardians: guardiansCount,
              complaints: complaintsCount,
              nearbyStations: 0
            });
          }
        );
      } else {
        // Geolocation not supported
        setStats({
          guardians: guardiansCount,
          complaints: complaintsCount,
          nearbyStations: 0
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'File Complaint',
      description: 'Report an incident',
      icon: FileText,
      link: '/user/create-complaint',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700'
    },
    {
      title: 'View Guardians',
      description: 'Manage emergency contacts',
      icon: Users,
      link: '/user/guardians',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      title: 'SOS Alert',
      description: 'Send emergency signal',
      icon: AlertCircle,
      link: '/user/sos',
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700'
    },
    {
      title: 'Find Stations',
      description: 'Locate nearby police',
      icon: MapPin,
      link: '/user/nearby-police',
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700'
    }
  ];

  const statCards = [
    {
      name: 'My Guardians',
      value: stats.guardians,
      icon: Users,
      color: 'text-blue-500',
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      link: '/user/guardians'
    },
    {
      name: 'My Complaints',
      value: stats.complaints,
      icon: FileText,
      color: 'text-orange-500',
      iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      link: '/user/complaints'
    },
    {
      name: 'Nearby Stations',
      value: stats.nearbyStations,
      icon: MapPin,
      color: 'text-green-500',
      iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
      link: '/user/nearby-police'
    }
  ];

  return (
    <div className="flex">
      <Sidebar role="user" />
      
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Your safety is our priority. Here's your safety overview and quick access to emergency features.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            [1, 2, 3].map((index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-300 rounded mb-2 w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-12"></div>
                  </div>
                  <div className="p-3 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            ))
          ) : (
            statCards.map((stat, index) => (
              <StatCard 
                key={index} 
                icon={stat.icon} 
                title={stat.name} 
                value={stat.value} 
                color={stat.color} 
                iconBg={stat.iconBg} 
                link={stat.link} 
              />
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link 
                  key={index} 
                  to={action.link} 
                  className="block group"
                >
                  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-purple-200 group-hover:shadow-purple-100">
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                      <div className="mt-3">
                        <span className="inline-flex items-center text-xs text-purple-600 font-medium">
                          Get Started
                          <Navigation className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button
              type="button"
              onClick={() => fetchRecentActivity()}
              disabled={recentActivityLoading}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${recentActivityLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            {recentActivityLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-0">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  const fullDate = formatActivityDate(activity.timestamp);
                  return (
                    <Link
                      key={activity.id}
                      to={activity.link}
                      className={`flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors ${index < recentActivity.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${activityIconBg(activity.color)}`}>
                        <Icon className={`h-5 w-5 ${activityIconColor(activity.color)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                          {fullDate && <span className="text-xs text-gray-400">· {fullDate}</span>}
                        </div>
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{activity.description}</p>
                        )}
                        {activity.status && (
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                            activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            activity.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            activity.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Your complaints and updates will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
