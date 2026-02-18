import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { FileText, Search, Filter, User, MapPin, Calendar, AlertTriangle, Clock, CheckCircle, XCircle, Badge, X, Users } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminComplaintsPage = () => {
  const role = 'admin';
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
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigningOfficer, setAssigningOfficer] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, searchTerm, statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/complaints', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter
        }
      });
      
      setComplaints(response.data.data.complaints);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficersByStation = async (stationId) => {
    try {
      setLoadingOfficers(true);
      const response = await api.get(`/admin/complaints/${stationId}/officers`);
      setOfficers(response.data.data);
      setSelectedOfficer('');
    } catch (error) {
      console.error('Error fetching officers:', error);
      toast.error('Failed to fetch officers');
      setOfficers([]);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleAssignClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
    // Handle both string ID and object format
    const stationId = typeof complaint.stationId === 'object' ? complaint.stationId._id : complaint.stationId;
    fetchOfficersByStation(stationId);
  };

  const handleAssignOfficer = async () => {
    if (!selectedOfficer) {
      toast.error('Please select an officer');
      return;
    }

    try {
      setAssigningOfficer(true);
      const response = await api.put(`/admin/complaints/${selectedComplaint._id}/assign`, {
        policeId: selectedOfficer
      });

      setComplaints(complaints.map(complaint =>
        complaint._id === selectedComplaint._id ? response.data.data : complaint
      ));

      if (showDetails) {
        setSelectedComplaint(response.data.data);
      }

      toast.success('Complaint assigned successfully');
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setAssigningOfficer(false);
    }
  };

  const handleUnassign = async (complaintId) => {
    if (!window.confirm('Are you sure you want to unassign this complaint?')) {
      return;
    }

    try {
      const response = await api.put(`/admin/complaints/${complaintId}/unassign`);

      setComplaints(complaints.map(complaint =>
        complaint._id === complaintId ? response.data.data : complaint
      ));

      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(response.data.data);
      }

      toast.success('Complaint unassigned successfully');
    } catch (error) {
      console.error('Error unassigning complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign complaint');
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await api.put(`/admin/complaints/${complaintId}`, 
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
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateComplaintPriority = async (complaintId, newPriority) => {
    try {
      setUpdatingPriority(true);
      const response = await api.put(`/admin/complaints/${complaintId}`, 
        { priority: newPriority }
      );
      
      setComplaints(complaints.map(complaint => 
        complaint._id === complaintId ? response.data.data : complaint
      ));
      
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error updating complaint priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setUpdatingPriority(false);
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
    { value: '', label: 'All', icon: Filter },
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
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const ComplaintCard = ({ complaint }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer overflow-hidden group" 
         onClick={() => viewComplaintDetails(complaint)}>
      {/* Status Badge */}
      <div className={`h-1 w-full ${getPriorityColor(complaint.priority || 'Medium')}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {complaint.userId?.profilePhoto ? (
              <img 
                src={complaint.userId.profilePhoto} 
                alt={complaint.userId?.name || 'User'}
                className="w-12 h-12 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{complaint.userId?.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-600">{complaint.userId?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)} shadow-sm`}>
              {getStatusIcon(complaint.status)}
              <span className="ml-1">{complaint.status}</span>
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority || 'Medium')}`}>
            <Badge className="w-3 h-3" />
            {complaint.priority || 'Medium'} Priority
          </span>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-2 text-sm leading-relaxed">{complaint.description}</p>
        
        {complaint.assignedTo && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">
              Assigned to: {complaint.assignedTo.name}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate max-w-[120px]">{complaint.stationId?.name || 'No Station'}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center group-hover:translate-x-1 transition-transform">
            View Details 
            <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Assignment Modal
  const AssignmentModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Assign Complaint</h3>
          </div>
          <button
            onClick={() => setShowAssignModal(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Complaint ID</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
              {selectedComplaint?._id?.slice(-8)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Police Station</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
              {selectedComplaint?.stationId?.name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Police Officer
            </label>
            {loadingOfficers ? (
              <div className="p-3 text-center text-gray-600">
                Loading officers...
              </div>
            ) : officers.length === 0 ? (
              <div className="p-3 text-center text-gray-600 bg-gray-50 rounded-lg">
                No officers available at this station
              </div>
            ) : (
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">-- Select an officer --</option>
                {officers.map((officer) => (
                  <option key={officer._id} value={officer._id}>
                    {officer.name} ({officer.email})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => setShowAssignModal(false)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignOfficer}
            disabled={assigningOfficer || !selectedOfficer}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {assigningOfficer ? 'Assigning...' : 'Assign'}
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
                Back to All Complaints
              </button>
              <div className="text-sm text-gray-500">
                Complaint ID: {selectedComplaint._id.slice(-8)}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusIcon(selectedComplaint.status)}
                      <span className="ml-1">{selectedComplaint.status}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedComplaint.priority || 'Medium')}`}>
                      <Badge className="w-4 h-4" />
                      {selectedComplaint.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Complainant Information</h4>
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
                        <p className="font-medium text-gray-900 truncate">{selectedComplaint.userId?.name}</p>
                        <p className="text-sm text-gray-600 truncate">{selectedComplaint.userId?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedComplaint.userId?.phone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Complaint Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedComplaint.stationId?.name}
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                      </div>
                      {selectedComplaint.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          Location: {selectedComplaint.location.coordinates[1].toFixed(4)}, {selectedComplaint.location.coordinates[0].toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="mb-6 rounded-lg bg-green-50 border border-green-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assigned Officer</h4>
                      {selectedComplaint.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            {selectedComplaint.assignedTo.name} ({selectedComplaint.assignedTo.email})
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No officer assigned yet</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAssignClick(selectedComplaint);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        {selectedComplaint.assignedTo ? 'Reassign' : 'Assign'} Officer
                      </button>
                      {selectedComplaint.assignedTo && (
                        <button
                          onClick={() => handleUnassign(selectedComplaint._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                          Unassign
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
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
                          ? 'bg-red-100 text-red-800 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                      }`}
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'In Progress')}
                      disabled={selectedComplaint.status === 'In Progress' || updatingStatus}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50'
                      }`}
                    >
                      Mark as In Progress
                    </button>
                    <button
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'Resolved')}
                      disabled={selectedComplaint.status === 'Resolved' || updatingStatus}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.status === 'Resolved'
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      }`}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Set Priority Level</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateComplaintPriority(selectedComplaint._id, 'Low')}
                      disabled={selectedComplaint.priority === 'Low' || updatingPriority}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.priority === 'Low'
                          ? 'bg-blue-100 text-blue-800 cursor-not-allowed border border-blue-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      Low Priority
                    </button>
                    <button
                      onClick={() => updateComplaintPriority(selectedComplaint._id, 'Medium')}
                      disabled={selectedComplaint.priority === 'Medium' || updatingPriority}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed border border-yellow-200'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50'
                      }`}
                    >
                      Medium Priority
                    </button>
                    <button
                      onClick={() => updateComplaintPriority(selectedComplaint._id, 'High')}
                      disabled={selectedComplaint.priority === 'High' || updatingPriority}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.priority === 'High'
                          ? 'bg-orange-100 text-orange-800 cursor-not-allowed border border-orange-200'
                          : 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'
                      }`}
                    >
                      High Priority
                    </button>
                    <button
                      onClick={() => updateComplaintPriority(selectedComplaint._id, 'Critical')}
                      disabled={selectedComplaint.priority === 'Critical' || updatingPriority}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedComplaint.priority === 'Critical'
                          ? 'bg-red-100 text-red-800 cursor-not-allowed border border-red-200'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                      }`}
                    >
                      Critical Priority
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showAssignModal && <AssignmentModal />}
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
              <p className="text-gray-600 mt-2">View and manage all user complaints</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                placeholder="Search complaints by description, user name, or email..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 mr-1">Status:</span>
              {statusFilters.map(({ value, label, icon: Icon }) => {
                const isActive = statusFilter === value;
                const activeStyles = value === ''
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : value === 'Pending'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : value === 'In Progress'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-green-100 text-green-800 border-green-200';
                const inactiveStyles = 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300';
                return (
                  <button
                    key={value || 'all'}
                    type="button"
                    onClick={() => handleStatusFilter(value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      isActive ? activeStyles : inactiveStyles
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
                const colorMap = {
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
                          : colorMap[value]
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
              {searchTerm || statusFilter || priorityFilter ? 'Try adjusting your search or filter criteria' : 'No complaints have been filed yet'}
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

        {/* Assignment Modal */}
        {showAssignModal && <AssignmentModal />}
      </div>
    </div>
  );
};

export default AdminComplaintsPage;
