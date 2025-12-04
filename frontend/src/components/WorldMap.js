import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function WorldMap() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationData();
    const interval = setInterval(fetchLocationData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLocationData = async () => {
    try {
      const response = await adminAPI.getLocationData();
      setMarkers(response.data.markers);
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Threat Map (Last 24 Hours)</h2>

      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
          <p className="text-gray-600">Loading map data...</p>
        </div>
      ) : (
        <div className="w-full h-96 bg-gray-100 rounded relative overflow-hidden">
          {/* This is a simplified representation - in production, use react-leaflet or Google Maps */}
          <svg className="w-full h-full" viewBox="0 0 960 600">
            {/* World map background */}
            <rect width="960" height="600" fill="#e5e7eb" />

            {/* Display markers */}
            {markers.map((marker, idx) => {
              // Convert lat/lng to SVG coordinates (simplified)
              const x = (marker.lng + 180) * (960 / 360);
              const y = (90 - marker.lat) * (600 / 180);

              return (
                <g key={idx}>
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={getRiskColor(marker.riskLevel)}
                    opacity="0.8"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="none"
                    stroke={getRiskColor(marker.riskLevel)}
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-sm mb-2">Status</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Safe</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Warning</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Critical</span>
              </div>
            </div>
          </div>

          {/* Marker info */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow max-w-xs text-sm">
            <p className="font-semibold mb-1">Total Markers: {markers.length}</p>
            <p className="text-gray-600">
              {markers.filter((m) => m.riskLevel === 'critical').length} critical,{' '}
              {markers.filter((m) => m.riskLevel === 'warning').length} warning,{' '}
              {markers.filter((m) => m.riskLevel === 'safe').length} safe
            </p>
          </div>
        </div>
      )}

      {/* Recent locations list */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Locations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {markers.slice(0, 10).map((marker, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded flex justify-between items-center text-sm">
              <div>
                <p className="font-medium text-gray-800">{marker.city}, {marker.country}</p>
                <p className="text-gray-600 text-xs">{marker.email}</p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: getRiskColor(marker.riskLevel) }}
              >
                {marker.riskLevel.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
