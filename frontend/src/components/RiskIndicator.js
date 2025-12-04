import React from 'react';

export default function RiskIndicator({ riskScore, riskLevel, showLabel = true }) {
  const getRiskColor = () => {
    if (riskScore <= 30) return 'green';
    if (riskScore <= 70) return 'yellow';
    return 'red';
  };

  const getRiskLevelText = () => {
    if (riskScore <= 30) return 'Safe';
    if (riskScore <= 70) return 'Warning';
    return 'Critical';
  };

  const color = getRiskColor();
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
  };

  const bgClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Risk Score</h3>
        <span className="text-2xl font-bold">{riskScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all ${bgClasses[color]}`}
          style={{ width: `${riskScore}%` }}
        ></div>
      </div>
      {showLabel && <p className="text-sm font-medium">{getRiskLevelText()}</p>}
    </div>
  );
}
