'use client';

import { Recommendation } from '@/types';

interface DailyRecommendationsProps {
  recommendations: Recommendation[];
  loading?: boolean;
}

const categoryColors = {
  Nutrition: 'bg-green-50 border-green-200 text-green-800',
  Exercise: 'bg-blue-50 border-blue-200 text-blue-800',
  Sleep: 'bg-purple-50 border-purple-200 text-purple-800',
  Hydration: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  Overall: 'bg-gray-50 border-gray-200 text-gray-800',
};

const priorityIcons = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

export default function DailyRecommendations({ recommendations, loading }: DailyRecommendationsProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Recommendations</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">Personalized suggestions to improve your health</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600">Analyzing your data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Recommendations</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Personalized suggestions to improve your health</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 sm:p-4 ${categoryColors[rec.category] || categoryColors.Overall}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-semibold">{rec.title}</span>
                    <span className="text-xs">{priorityIcons[rec.priority]}</span>
                    <span className="text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded bg-white/50 whitespace-nowrap">
                      {rec.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

