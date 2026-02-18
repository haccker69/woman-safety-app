import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Home, 
  AlertCircle, 
  AlertTriangle,
  Users, 
  MapPin, 
  FileText, 
  User,
  Building2,
  UserCog,
  Shield,
  MapPinned,
  Phone,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const userMenuItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: Home },
    { name: 'SOS Alert', path: '/user/sos', icon: AlertCircle },
    { name: 'Guardians', path: '/user/guardians', icon: Users },
    { name: 'Nearby Police', path: '/user/nearby-police', icon: MapPin },
    { name: 'File Complaint', path: '/user/create-complaint', icon: FileText },
    { name: 'My Complaints', path: '/user/complaints', icon: FileText },
    { name: 'Travel Buddy', path: '/user/travel-buddy', icon: Users },
    { name: 'Profile', path: '/user/profile', icon: User }
  ];

  const policeMenuItems = [
    { name: 'Dashboard', path: '/police/dashboard', icon: Home },
    { name: 'Complaints', path: '/police/complaints', icon: FileText },
    { name: 'SOS Alerts', path: '/police/sos-alerts', icon: AlertTriangle },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Police Stations', path: '/admin/stations', icon: Building2 },
    { name: 'Police Accounts', path: '/admin/police-accounts', icon: UserCog },
    { name: 'All Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Emergency Locations', path: '/admin/emergency-locations', icon: MapPinned },
  ];

  const getMenuItems = () => {
    switch (role) {
      case 'user':
        return userMenuItems;
      case 'police':
        return policeMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const sidebarContent = (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="text-sm font-semibold text-gray-700 uppercase">
              {role} Panel
            </span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-50 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-16">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
