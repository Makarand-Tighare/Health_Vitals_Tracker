'use client';

import { CalculatedMetrics } from '@/types';

interface MetricsDisplayProps {
  metrics: CalculatedMetrics;
}

export default function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'bad':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'good':
        return 'Good Day ✓';
      case 'moderate':
        return 'Moderate Day';
      case 'bad':
        return 'Bad Day';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Calculated Metrics</h3>
        <p className="mt-1 text-sm text-gray-600">Automatically computed from your inputs</p>
      </div>
      <div className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Intake</div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.totalIntake}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Burn</div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.totalBurn}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal</div>
        </div>

        <div className={`rounded-lg border p-5 ${
          metrics.calorieDeficit >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Calorie Deficit</div>
          <div className={`text-3xl font-bold ${
            metrics.calorieDeficit >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {metrics.calorieDeficit >= 0 ? '+' : ''}{metrics.calorieDeficit}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal</div>
        </div>

        <div className={`rounded-lg border p-5 ${getTrendColor(metrics.trend)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2">Trend</div>
          <div className="text-2xl font-bold">
            {getTrendLabel(metrics.trend)}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

