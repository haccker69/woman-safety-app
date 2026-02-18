import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { FileText, Calendar, MapPin, AlertTriangle, CheckCircle, Clock, Eye, X, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const UserComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Pending':
        return { class: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
      case 'In Progress':
        return { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertTriangle };
      case 'Resolved':
        return { class: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      default:
        return { class: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const station = (c) => c.station || c.stationId;

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50/80 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">My Complaints</h1>
                  <p className="text-gray-500 text-sm mt-0.5">Track and manage your filed complaints</p>
                </div>
              </div>
              <Link
                to="/user/create-complaint"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                File new complaint
              </Link>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
              <p className="mt-4 text-sm text-gray-500">Loading your complaints…</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
                You haven&apos;t filed any complaints. Report an incident to get help from the nearest police station.
              </p>
              <Link
                to="/user/create-complaint"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                File your first complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const statusConfig = getStatusConfig(complaint.status);
                const StatusIcon = statusConfig.icon;
                const st = station(complaint);
                return (
                  <div
                    key={complaint._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
                  >
                    <div className="p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium line-clamp-2 pr-2">
                            {complaint.description.length > 80
                              ? `${complaint.description.substring(0, 80)}…`
                              : complaint.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(complaint.createdAt)}
                            </span>
                            {complaint.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {typeof complaint.location.lat === 'number'
                                  ? `${complaint.location.lat.toFixed(4)}, ${complaint.location.lng.toFixed(4)}`
                                  : `${complaint.location.lat}, ${complaint.location.lng}`}
                              </span>
                            )}
                            {st && (
                              <span className="text-gray-600 font-medium">{st.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${statusConfig.class}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {complaint.status}
                          </span>
                          <button
                            onClick={() => viewDetails(complaint)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Details Modal */}
          {showDetails && selectedComplaint && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDetails(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Complaint details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    {(() => {
                      const { class: statusClass, icon: StatusIcon } = getStatusConfig(selectedComplaint.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${statusClass}`}>
                          <StatusIcon className="w-4 h-4" />
                          {selectedComplaint.status}
                        </span>
                      );
                    })()}
                    <span className="text-sm text-gray-500">{formatDate(selectedComplaint.createdAt)}</span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-gray-900 bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Location</p>
                      <p className="text-gray-900">
                        {selectedComplaint.location
                          ? typeof selectedComplaint.location.lat === 'number'
                            ? `${selectedComplaint.location.lat.toFixed(5)}, ${selectedComplaint.location.lng.toFixed(5)}`
                            : `${selectedComplaint.location.lat}, ${selectedComplaint.location.lng}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {station(selectedComplaint) && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Assigned station</p>
                      <p className="font-semibold text-blue-900">{station(selectedComplaint).name}</p>
                      <p className="text-sm text-blue-700 mt-0.5">
                        {station(selectedComplaint).area}
                        {station(selectedComplaint).city && `, ${station(selectedComplaint).city}`}
                      </p>
                      {station(selectedComplaint).helpline && (
                        <p className="text-sm text-blue-700 mt-1">Helpline: {station(selectedComplaint).helpline}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserComplaintsPage;
