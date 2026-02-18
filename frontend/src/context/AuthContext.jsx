import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUser && storedRole) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData, userToken, userRole) => {
    setUser(userData);
    setToken(userToken);
    setRole(userRole);

    // Store in localStorage
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);

    // Redirect based on role
    redirectBasedOnRole(userRole);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    // Redirect to login
    navigate('/login');
  };

  // Redirect based on role
  const redirectBasedOnRole = (userRole) => {
    switch (userRole) {
      case 'user':
        navigate('/user/dashboard');
        break;
      case 'police':
        navigate('/police/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    role,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
