import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const Navbar = () => {
  const { isAuthenticated, user, role, logout, updateUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refresh police profile photo on mount
  useEffect(() => {
    const refreshPoliceProfile = async () => {
      if (isAuthenticated && role === 'police') {
        try {
          const response = await authAPI.getPoliceProfile();
          const profileData = response?.data?.data;
          if (profileData && profileData.profilePhoto !== user?.profilePhoto) {
            updateUser({ ...user, profilePhoto: profileData.profilePhoto });
          }
        } catch (error) {
          console.error('Failed to refresh police profile:', error);
        }
      }
    };
    refreshPoliceProfile();
  }, [isAuthenticated, role]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    switch (role) {
      case 'user':
        return '/user/dashboard';
      case 'police':
        return '/police/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const roleBadgeColor = {
    user: 'bg-emerald-100 text-emerald-700',
    police: 'bg-blue-100 text-blue-700',
    admin: 'bg-amber-100 text-amber-700',
  }[role] || 'bg-gray-100 text-gray-700';

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              to={isAuthenticated ? getDashboardLink() : '/'}
              className="flex items-center gap-3 group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 text-white shadow-md shadow-red-500/25 group-hover:shadow-red-500/40 transition-shadow">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Women Safety</span>
            </Link>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center flex-shrink-0 gap-5">
            {!isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-red-500/25 hover:shadow-red-500/40 transition-all"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50/80 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                  Dashboard
                </Link>
                <div className="h-7 w-px bg-gray-200 flex-shrink-0" aria-hidden />
                <div className="flex items-center gap-4 pl-0.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {user?.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user?.name} 
                        className="flex-shrink-0 w-9 h-9 rounded-full object-cover shadow-inner"
                      />
                    ) : (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-semibold shadow-inner">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <div className="min-w-0 hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user?.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium capitalize ${roleBadgeColor}`}>
                        {role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50/80 border border-transparent hover:border-red-100 transition-all flex-shrink-0"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-gray-50/50">
          <div className="px-4 py-4 space-y-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm mb-3">
                  {user?.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt={user?.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium capitalize ${roleBadgeColor}`}>
                      {role}
                    </span>
                  </div>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg text-base font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
