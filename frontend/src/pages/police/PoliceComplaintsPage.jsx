import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { FileText, Search, Filter, User, MapPin, Calendar, Phone, AlertTriangle, Clock, CheckCircle, XCircle, Badge, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const PoliceComplaintsPage = () => {
  const role = 'police';
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, searchTerm, statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/police/complaints', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter
        }
      });
      
      setComplaints(response.data.data.complaints || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await api.put(`/police/complaints/${complaintId}`, 
        { status: newStatus }
      );
      
      setComplaints(complaints.map(complaint => 
        complaint._id === complaintId ? response.data.data : complaint
      ));
      
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert(error.response?.data?.message || 'Failed to update complaint status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePriorityFilter = (value) => {
    setPriorityFilter(value);
    setCurrentPage(1);
  };

  const statusFilters = [
    { value: '', label: 'All Status', icon: Filter },
    { value: 'Pending', label: 'Pending', icon: AlertTriangle },
    { value: 'In Progress', label: 'In Progress', icon: Clock },
    { value: 'Resolved', label: 'Resolved', icon: CheckCircle },
  ];

  const priorityFilters = [
    { value: '', label: 'All Priority', color: 'gray' },
    { value: 'Critical', label: 'Critical', color: 'red' },
    { value: 'High', label: 'High', color: 'orange' },
    { value: 'Medium', label: 'Medium', color: 'yellow' },
    { value: 'Low', label: 'Low', color: 'blue' },
  ];

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Pending':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority) => {
    return <Badge className="w-4 h-4" />;
  };

  const ComplaintCard = ({ complaint }) => (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer overflow-hidden group"
      onClick={() => viewComplaintDetails(complaint)}
    >
      <div className={`h-1 w-full ${getPriorityColor(complaint.priority || 'Medium')}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {complaint.userId?.profilePhoto ? (
              <img 
                src={complaint.userId.profilePhoto} 
                alt={complaint.userId?.name || 'User'}
                className="w-12 h-12 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-lg truncate">{complaint.userId?.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-600 truncate">{complaint.userId?.phone || 'No phone'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
            {getStatusIcon(complaint.status)}
            {complaint.status}
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority || 'Medium')}`}>
            {getPriorityIcon(complaint.priority || 'Medium')}
            {complaint.priority || 'Medium'}
          </span>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-2 text-sm leading-relaxed">{complaint.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center group-hover:translate-x-1 transition-transform">
            View
            <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (showDetails && selectedComplaint) {
    return (
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setShowDetails(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <span className="mr-2">←</span>
                Back to Complaints
              </button>
              <div className="text-sm text-gray-500">
                ID: {selectedComplaint._id.slice(-8)}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusIcon(selectedComplaint.status)}
                      {selectedComplaint.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedComplaint.priority || 'Medium')}`}>
                      {getPriorityIcon(selectedComplaint.priority || 'Medium')}
                      {selectedComplaint.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <h4 className="font-medium text-blue-900 mb-3">User Information</h4>
                    <div className="flex items-start gap-3 mb-3">
                      {selectedComplaint.userId?.profilePhoto ? (
                        <img 
                          src={selectedComplaint.userId.profilePhoto} 
                          alt={selectedComplaint.userId?.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-blue-900 truncate">{selectedComplaint.userId?.name || 'Unknown'}</p>
                        <p className="text-sm text-blue-700 truncate">{selectedComplaint.userId?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                        <span className="text-blue-800">{selectedComplaint.userId?.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                    <h4 className="font-medium text-purple-900 mb-3">Complaint Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                        <span className="text-purple-800">Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedComplaint.location?.coordinates && (
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                          <span className="text-purple-800">
                            {selectedComplaint.location.coordinates[1].toFixed(5)}, {selectedComplaint.location.coordinates[0].toFixed(5)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Badge className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                        <span className="text-purple-800">Priority: {selectedComplaint.priority || 'Medium'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Complaint Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Update Status</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'Pending')}
                      disabled={selectedComplaint.status === 'Pending' || updatingStatus}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.status === 'Pending'
                          ? 'bg-red-100 text-red-800 cursor-not-allowed border border-red-200'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 border border-red-600'
                      }`}
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'In Progress')}
                      disabled={selectedComplaint.status === 'In Progress' || updatingStatus}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed border border-yellow-200'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 border border-yellow-600'
                      }`}
                    >
                      Mark as In Progress
                    </button>
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'Resolved')}
                      disabled={selectedComplaint.status === 'Resolved' || updatingStatus}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.status === 'Resolved'
                          ? 'bg-green-100 text-green-800 cursor-not-allowed border border-green-200'
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 border border-green-600'
                      }`}
                    >
                      Mark as Resolved
                    </button>
                  </div>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Complaints</h1>
              <p className="text-gray-600 mt-2">Review and respond to complaints from your station</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {complaints.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  {complaints.filter(c => c.status === 'Pending').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {complaints.filter(c => c.status === 'Resolved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by user name, phone, or description..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 mr-1">Status:</span>
              {statusFilters.map(({ value, label, icon: Icon }) => {
                const isActive = statusFilter === value;
                return (
                  <button
                    key={value || 'all'}
                    type="button"
                    onClick={() => handleStatusFilter(value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? value === ''
                          ? 'bg-gray-900 text-white border-gray-900'
                          : getStatusColor(value).replace('bg-', 'bg-').replace('border', 'border')
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 mr-1">Priority:</span>
              {priorityFilters.map(({ value, label }) => {
                const isActive = priorityFilter === value;
                const priorityColorMap = {
                  'Critical': 'bg-red-100 text-red-800 border-red-200',
                  'High': 'bg-orange-100 text-orange-800 border-orange-200',
                  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  'Low': 'bg-blue-100 text-blue-800 border-blue-200',
                };
                return (
                  <button
                    key={value || 'all'}
                    type="button"
                    onClick={() => handlePriorityFilter(value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? value === ''
                          ? 'bg-gray-900 text-white border-gray-900'
                          : priorityColorMap[value] || 'bg-gray-100 text-gray-800 border-gray-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
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
        ) : complaints.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No complaints found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || statusFilter || priorityFilter 
                ? 'Try adjusting your search or filter criteria' 
                : 'No complaints have been filed for your station yet'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPriorityFilter('');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map((complaint) => (
                <ComplaintCard key={complaint._id} complaint={complaint} />
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
    </div>
  );
};

export default PoliceComplaintsPage;
