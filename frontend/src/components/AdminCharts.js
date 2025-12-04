import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { adminAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminCharts() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!stats) return <div className="text-center py-8">No data available</div>;

  // Prepare chart data
  const hourlyData = stats.hourlyAttempts || [];
  const chartData = {
    labels: hourlyData.map((d) => d._id),
    datasets: [
      {
        label: 'Login Attempts',
        data: hourlyData.map((d) => d.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <p className="text-sm opacity-90 mb-1">Total Attempts</p>
          <p className="text-3xl font-bold">{stats.loginAttempts?.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg">
          <p className="text-sm opacity-90 mb-1">Last 24 Hours</p>
          <p className="text-3xl font-bold">{stats.loginAttempts?.last24Hours || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg">
          <p className="text-sm opacity-90 mb-1">High Risk</p>
          <p className="text-3xl font-bold">{stats.highRiskAttempts || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <p className="text-sm opacity-90 mb-1">Locked Accounts</p>
          <p className="text-3xl font-bold">{stats.lockedAccounts || 0}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">24-Hour Trend</h3>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.riskDistribution || {}).map(([level, count]) => (
              <div key={level} className="flex items-center">
                <div className="w-24">
                  <span className="capitalize font-medium text-gray-700">{level}</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className={`h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                      level === 'safe'
                        ? 'bg-green-500'
                        : level === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${(count / (stats.loginAttempts?.total || 1)) * 100}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Countries</h3>
          <div className="space-y-2">
            {(stats.topCountries || []).slice(0, 8).map((country, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">{country._id || 'Unknown'}</span>
                <span className="font-semibold text-gray-900">{country.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
