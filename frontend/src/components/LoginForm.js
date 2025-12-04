import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import RiskIndicator from './RiskIndicator';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [loginAttemptId, setLoginAttemptId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response.data.requiresOTP) {
        // OTP is required
        setRiskData(response.data);
        setLoginAttemptId(response.data.loginAttemptId);
        toast.warning('OTP sent to your email');
        navigate('/otp-verification', {
          state: {
            loginAttemptId: response.data.loginAttemptId,
            email: formData.email,
            riskScore: response.data.riskScore,
          },
        });
      } else if (response.data.success) {
        // Direct login
        login(response.data.token, response.data.user);
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Login</h1>
        <p className="text-gray-600 text-center mb-6">Secure Login with Fraud Detection</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {riskData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <RiskIndicator riskScore={riskData.riskScore} riskLevel={riskData.riskLevel} />
            {riskData.reasons && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Reasons for verification:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {riskData.reasons.map((reason, idx) => (
                    <li key={idx}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
