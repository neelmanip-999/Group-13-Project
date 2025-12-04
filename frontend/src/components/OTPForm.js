import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function OTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const { loginAttemptId, email } = location.state || {};

  const handleChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(loginAttemptId, otp);
      if (response.data.success) {
        login(response.data.token, response.data.user);
        toast.success('OTP verified! Logging you in...');
        navigate('/dashboard');
      }
    } catch (error) {
      setAttempts(attempts + 1);
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);

      if (attempts >= 2) {
        toast.warning('Too many attempts. Please try logging in again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Verify OTP</h1>
        <p className="text-gray-600 text-center mb-2">Security Verification Required</p>
        <p className="text-gray-500 text-center text-sm mb-6">We sent a 6-digit code to {email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={handleChange}
              maxLength="6"
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Didn't receive the code?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-semibold">Resend</button>
        </p>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-3 text-gray-600 hover:text-gray-800 font-semibold py-2"
        >
          Back to Login
        </button>

        {attempts > 0 && (
          <p className="text-center text-orange-600 text-sm mt-4">
            Attempts remaining: {3 - attempts}
          </p>
        )}
      </div>
    </div>
  );
}
