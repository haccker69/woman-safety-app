import { Link } from 'react-router-dom';
import { Shield, AlertCircle, MapPin, FileText, Users } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: AlertCircle,
      title: 'Emergency SOS',
      description: 'One-tap emergency alert to notify your guardians with your exact location',
    },
    {
      icon: MapPin,
      title: 'Nearby Police Stations',
      description: 'Find police stations within 5km radius with directions',
    },
    {
      icon: FileText,
      title: 'Complaint Management',
      description: 'File and track complaints with real-time status updates',
    },
    {
      icon: Users,
      title: 'Guardian Network',
      description: 'Add trusted contacts who will receive emergency alerts',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Shield className="h-20 w-20 text-red-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Women Safety & Security System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your safety companion. Instant emergency alerts, nearby police stations, and complaint
            tracking - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold border-2 border-red-600 hover:bg-red-50 transition-colors text-lg"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <Icon className="h-12 w-12 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 sm:mt-20 bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-red-600">24/7</p>
              <p className="text-gray-600 mt-2">Emergency Support</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-600">Instant</p>
              <p className="text-gray-600 mt-2">Alert Notifications</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-600">Secure</p>
              <p className="text-gray-600 mt-2">Data Protection</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-20 text-center bg-red-600 rounded-2xl p-6 sm:p-8 lg:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Stay Safe, Stay Connected</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of women who trust our platform for their safety
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
