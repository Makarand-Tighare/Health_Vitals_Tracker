'use client';

import { CalculatedMetrics } from '@/types';

interface MetricsDisplayProps {
  metrics: CalculatedMetrics;
}

export default function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'good':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'bad':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'good':
        return 'Good Day ✓';
      case 'moderate':
        return 'Moderate Day';
      case 'bad':
        return 'Needs Improvement';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Calculated Metrics</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Automatically computed from your inputs</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Intake</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {metrics.totalIntake}
            </div>
            <div className="text-xs text-gray-500 mt-1">kcal</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Burn</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {metrics.totalBurn}
            </div>
            <div className="text-xs text-gray-500 mt-1">kcal</div>
          </div>

          <div className={`rounded-lg border p-4 shadow-sm ${
            metrics.calorieDeficit >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Calorie Deficit</div>
            <div className={`text-2xl sm:text-3xl font-bold ${
              metrics.calorieDeficit >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {metrics.calorieDeficit >= 0 ? '+' : ''}{metrics.calorieDeficit}
            </div>
            <div className="text-xs text-gray-500 mt-1">kcal</div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Protein</div>
            <div className="text-2xl sm:text-3xl font-bold text-orange-700">
              {metrics.totalProtein !== undefined ? metrics.totalProtein : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">grams</div>
          </div>

          <div className={`rounded-lg border p-4 shadow-sm ${getTrendColor(metrics.trend)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2">Trend</div>
            <div className="text-xl sm:text-2xl font-bold">
              {getTrendLabel(metrics.trend)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
