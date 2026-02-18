import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Shield, Mail, RefreshCw, CheckCircle } from 'lucide-react';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authAPI.verifyEmail({ email, otp: otpString });
      setVerified(true);
      toast.success(res.data.message || 'Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');

    try {
      const res = await authAPI.resendOTP({ email });
      toast.success(res.data.message || 'New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit OTP to
          </p>
          <p className="text-sm font-semibold text-red-600">{email}</p>
        </div>

        {verified ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-green-700">Email Verified!</h3>
            <p className="text-gray-600">Redirecting to login page...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleVerify}>
            {/* Email icon */}
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full">
                <Mail className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Enter the 6-digit verification code
            </p>

            {/* OTP Input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                    error ? 'border-red-400 bg-red-50' : digit ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <p className="text-center text-sm text-red-600 font-medium">{error}</p>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="font-medium text-red-600 hover:text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {resending ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
