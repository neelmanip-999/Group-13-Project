import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminCharts from '../components/AdminCharts';
import WorldMap from '../components/WorldMap';
import { FiLogOut, FiShield, FiRefreshCw } from 'react-icons/fi';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [suspiciousEvents, setSuspiciousEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ riskLevel: '', country: '', email: '' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attemptsRes, eventsRes] = await Promise.all([
        adminAPI.getLoginAttempts(1, 50, filters),
        adminAPI.getSuspiciousEvents(1, 50),
      ]);
      setLoginAttempts(attemptsRes.data.data);
      setSuspiciousEvents(eventsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'blocked':
        return 'bg-red-200 text-red-900';
      case 'otp_pending':
        return 'bg-blue-100 text-blue-800';
      case 'otp_verified':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FiShield className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchData}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" role="tablist">
            {['overview', 'attempts', 'events', 'map'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  tab === t
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t === 'map' ? 'Threat Map' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {tab === 'overview' && <AdminCharts />}

        {/* Login Attempts Tab */}
        {tab === 'attempts' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Attempts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Filter by email"
                  value={filters.email}
                  onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Risk Levels</option>
                  <option value="safe">Safe</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by country"
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Risk Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{attempt.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{attempt.ip}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {attempt.location?.city}, {attempt.location?.country}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                attempt.riskScore <= 30
                                  ? 'bg-green-500'
                                  : attempt.riskScore <= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${attempt.riskScore}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{attempt.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(attempt.status)}`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suspicious Events Tab */}
        {tab === 'events' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Suspicious Events</h2>
            </div>

            <div className="divide-y">
              {suspiciousEvents.map((event) => (
                <div key={event._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 uppercase">{event.type.replace('_', ' ')}</h3>
                      <p className="text-sm text-gray-600">{event.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : event.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {event.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Location:</strong> {event.location?.city}, {event.location?.country}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}
                  </p>
                  {event.details && (
                    <p className="text-sm text-gray-600">
                      <strong>Details:</strong> {JSON.stringify(event.details).substring(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threat Map Tab */}
        {tab === 'map' && <WorldMap />}
      </main>
    </div>
  );
}
