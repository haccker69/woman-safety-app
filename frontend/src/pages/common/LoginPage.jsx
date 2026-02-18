import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (loginError) setLoginError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email' && value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
    }
    if (name === 'password' && value && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      let response;
      
      // Call appropriate API based on user type
      switch (userType) {
        case 'user':
          response = await authAPI.loginUser(formData);
          break;
        case 'police':
          response = await authAPI.loginPolice(formData);
          break;
        case 'admin':
          response = await authAPI.loginAdmin(formData);
          break;
        default:
          throw new Error('Invalid user type');
      }

      const { data } = response.data;
      
      // Login with user data, token, and role
      login(data, data.token, data.role);
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      // If email not verified, redirect to verify page
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        toast.info(error.response.data.message);
        navigate('/verify-email', { state: { email: formData.email } });
        return;
      }
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* User Type Selection */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => setUserType('user')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userType === 'user'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setUserType('police')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userType === 'police'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Police
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userType === 'admin'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {loginError && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{loginError}</p>
            </div>
          )}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
