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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
          <span className="text-xl">📊</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Auto Calculations</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Intake</div>
          <div className="mt-2 text-3xl font-bold text-orange-700">
            {metrics.totalIntake}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Burn</div>
          <div className="mt-2 text-3xl font-bold text-blue-700">
            {metrics.totalBurn}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal</div>
        </div>

        <div className={`rounded-xl border p-5 shadow-md transition-all hover:shadow-lg ${
          metrics.calorieDeficit >= 0 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="text-sm font-medium text-gray-600 mb-1">Calorie Deficit</div>
          <div className={`mt-2 text-3xl font-bold ${
            metrics.calorieDeficit >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {metrics.calorieDeficit >= 0 ? '+' : ''}{metrics.calorieDeficit}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal</div>
        </div>

        <div className={`rounded-xl border p-5 shadow-md transition-all hover:shadow-lg ${getTrendColor(metrics.trend)}`}>
          <div className="text-sm font-medium mb-1">Trend</div>
          <div className="mt-2 text-2xl font-bold">
            {getTrendLabel(metrics.trend)}
          </div>
        </div>
      </div>
    </div>
  );
}

