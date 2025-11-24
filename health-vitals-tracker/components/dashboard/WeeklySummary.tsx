'use client';

import { WeeklySummary as WeeklySummaryType } from '@/types';

interface WeeklySummaryProps {
  summary: WeeklySummaryType;
}

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Summary</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">{summary.weekStart} to {summary.weekEnd}</p>
      </div>
      <div className="p-4 sm:p-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Intake</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {summary.averageIntake.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal/day</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Burn</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {summary.averageBurn.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal/day</div>
        </div>

        <div className={`rounded-lg border p-4 sm:p-5 ${
          summary.averageDeficit >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Deficit</div>
          <div className={`text-2xl sm:text-3xl font-bold ${
            summary.averageDeficit >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {summary.averageDeficit >= 0 ? '+' : ''}{summary.averageDeficit.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">kcal/day</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Sleep</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {summary.averageSleep.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">hours/day</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Water</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {summary.averageWater.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">glasses/day</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg. Food Quality</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {summary.averageFoodQuality.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">out of 5</div>
        </div>
      </div>

      {summary.wins.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h4 className="text-sm font-semibold text-green-800 mb-3">What Went Well</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.wins.map((item, index) => (
              <div
                key={`${item.metric}-${index}`}
                className="rounded-lg border border-green-100 bg-white p-4 shadow-sm"
              >
                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">{item.metric}</div>
                <div className="text-base font-semibold text-gray-900">{item.title}</div>
                <p className="mt-1 text-sm text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.focus.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h4 className="text-sm font-semibold text-red-800 mb-3">Needs Attention</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.focus.map((item, index) => (
              <div
                key={`${item.metric}-${index}`}
                className="rounded-lg border border-red-100 bg-white p-4 shadow-sm"
              >
                <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">{item.metric}</div>
                <div className="text-base font-semibold text-gray-900">{item.title}</div>
                <p className="mt-1 text-sm text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.faceTrend && (
        <div className="mt-4 sm:mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Face Trend</div>
          <div className="text-xs sm:text-sm text-gray-700">{summary.faceTrend}</div>
        </div>
      )}

      {summary.notesSummary && (
        <div className="mt-3 sm:mt-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Notes Summary</div>
          <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed">{summary.notesSummary}</div>
        </div>
      )}
      </div>
    </div>
  );
}

