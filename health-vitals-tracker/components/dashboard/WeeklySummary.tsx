'use client';

import { WeeklySummary as WeeklySummaryType } from '@/types';

interface WeeklySummaryProps {
  summary: WeeklySummaryType;
}

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <span className="text-xl">📈</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Weekly Summary</h3>
          <p className="text-sm text-gray-600">{summary.weekStart} to {summary.weekEnd}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Intake</div>
          <div className="mt-2 text-3xl font-bold text-orange-700">
            {summary.averageIntake.toFixed(0)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal/day</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Burn</div>
          <div className="mt-2 text-3xl font-bold text-blue-700">
            {summary.averageBurn.toFixed(0)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal/day</div>
        </div>

        <div className={`rounded-xl border p-5 shadow-md transition-all hover:shadow-lg ${
          summary.averageDeficit >= 0 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Deficit</div>
          <div className={`mt-2 text-3xl font-bold ${
            summary.averageDeficit >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {summary.averageDeficit >= 0 ? '+' : ''}{summary.averageDeficit.toFixed(0)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">kcal/day</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Sleep</div>
          <div className="mt-2 text-3xl font-bold text-indigo-700">
            {summary.averageSleep.toFixed(1)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">hours/day</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Water</div>
          <div className="mt-2 text-3xl font-bold text-cyan-700">
            {summary.averageWater.toFixed(1)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">glasses/day</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 shadow-md transition-all hover:shadow-lg">
          <div className="text-sm font-medium text-gray-600 mb-1">Avg. Food Quality</div>
          <div className="mt-2 text-3xl font-bold text-yellow-700">
            {summary.averageFoodQuality.toFixed(1)}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">out of 5</div>
        </div>
      </div>

      {summary.faceTrend && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 p-5 shadow-md">
          <div className="text-sm font-medium text-gray-700 mb-2">😊 Face Trend</div>
          <div className="text-gray-900 font-medium">{summary.faceTrend}</div>
        </div>
      )}

      {summary.notesSummary && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-md">
          <div className="text-sm font-medium text-gray-700 mb-2">📝 Notes Summary</div>
          <div className="text-gray-900 whitespace-pre-line text-sm">{summary.notesSummary}</div>
        </div>
      )}
    </div>
  );
}

