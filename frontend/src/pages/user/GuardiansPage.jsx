import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { guardianAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';

const GuardiansPage = () => {
  const { user, updateUser } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    try {
      const response = await guardianAPI.getGuardians();
      setGuardians(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch guardians');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingGuardian) {
        await guardianAPI.updateGuardian(editingGuardian._id, formData);
        toast.success('Guardian updated successfully');
      } else {
        await guardianAPI.addGuardian(formData);
        toast.success('Guardian added successfully');
      }
      fetchGuardians();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guardian?')) return;

    try {
      await guardianAPI.deleteGuardian(id);
      toast.success('Guardian deleted successfully');
      fetchGuardians();
    } catch (error) {
      toast.error('Failed to delete guardian');
    }
  };

  const openModal = (guardian = null) => {
    if (guardian) {
      setEditingGuardian(guardian);
      setFormData({ name: guardian.name, phone: guardian.phone, email: guardian.email });
    } else {
      setEditingGuardian(null);
      setFormData({ name: '', phone: '', email: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGuardian(null);
    setFormData({ name: '', phone: '', email: '' });
  };

  return (
    <div className="flex">
      <Sidebar role="user" />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Guardians</h1>
              <p className="text-gray-600 mt-2">Manage your emergency contacts (Max 5)</p>
            </div>
            <button
              onClick={() => openModal()}
              disabled={guardians.length >= 5}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              <span>Add Guardian</span>
            </button>
          </div>

          {guardians.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Guardians Added</h3>
              <p className="text-gray-600 mb-6">Add trusted contacts who will receive emergency alerts</p>
              <button onClick={() => openModal()} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                Add Your First Guardian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guardians.map((guardian) => (
                <div key={guardian._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <Users className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{guardian.name}</h3>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openModal(guardian)} className="text-blue-600 hover:text-blue-700">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(guardian._id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600"><span className="font-medium">Phone:</span> {guardian.phone}</p>
                    <p className="text-gray-600"><span className="font-medium">Email:</span> {guardian.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                      {loading ? 'Saving...' : editingGuardian ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardiansPage;
