'use client';

import { Recommendation, WeeklyRecommendationContext } from '@/types';

interface DailyRecommendationsProps {
  recommendations: Recommendation[];
  loading?: boolean;
  onFetchRecommendations?: () => void;
  weeklyContext?: WeeklyRecommendationContext | null;
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

// Parse description to extract "Improve" section
const parseRecommendation = (description: string) => {
  // Look for patterns like "**To improve:**", "**To improve**", "To improve:", etc.
  const improvePatterns = [
    /\*\*To improve:\*\*/i,
    /\*\*To improve\*\*/i,
    /To improve:/i,
    /\*\*How to improve:\*\*/i,
    /\*\*How to improve\*\*/i,
    /How to improve:/i,
  ];

  for (const pattern of improvePatterns) {
    const match = description.match(pattern);
    if (match) {
      const index = match.index! + match[0].length;
      const problem = description.substring(0, match.index).trim();
      const improve = description.substring(index).trim();
      return { problem, improve };
    }
  }

  // If no "improve" section found, return entire description as problem
  return { problem: description, improve: null };
};

const trendConfig = {
  deficit: { label: 'Calorie Deficit', className: 'bg-green-100 text-green-800' },
  balanced: { label: 'Balanced Week', className: 'bg-amber-100 text-amber-800' },
  surplus: { label: 'Calorie Surplus', className: 'bg-rose-100 text-rose-800' },
};

const formatDeficit = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export default function DailyRecommendations({ recommendations, loading, onFetchRecommendations, weeklyContext }: DailyRecommendationsProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Recommendations</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">Personalized suggestions to improve your health</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600">Analyzing your data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Recommendations</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Get personalized suggestions</p>
            </div>
            {onFetchRecommendations && (
              <button
                onClick={onFetchRecommendations}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap shadow-sm"
              >
                Get Recommendations
              </button>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-600 mb-4">No recommendations yet. Click the button above to get AI-powered suggestions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Recommendations</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">Personalized suggestions to improve your health</p>
          </div>
          {onFetchRecommendations && (
            <button
              onClick={onFetchRecommendations}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap self-start sm:self-auto shadow-sm"
            >
              🔄 Refresh Recommendations
            </button>
          )}
        </div>
        {weeklyContext && (
          <div className="mt-4 rounded-xl border border-dashed border-orange-200 bg-orange-50/70 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-orange-900">
              <span className="font-semibold">{weeklyContext.rangeLabel}</span>
              <span>· {weeklyContext.daysTracked}/7 days tracked</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendConfig[weeklyContext.trend].className}`}>
                {trendConfig[weeklyContext.trend].label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-[11px] uppercase text-gray-500 font-semibold">Avg Intake vs Burn</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{Math.round(weeklyContext.averageIntake)} kcal</p>
                <p className="text-sm text-orange-700">Burn {Math.round(weeklyContext.averageBurn)} kcal</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-[11px] uppercase text-gray-500 font-semibold">Yesterday</p>
                {weeklyContext.yesterday ? (
                  <div className="mt-1">
                    <p className="text-lg font-bold text-gray-900">{Math.round(weeklyContext.yesterday.intake)} kcal</p>
                    <p className="text-sm text-gray-700">Δ {formatDeficit(Math.round(weeklyContext.yesterday.deficit))} kcal</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No data yet.</p>
                )}
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-[11px] uppercase text-gray-500 font-semibold">Habits</p>
                <p className="text-sm text-gray-700 mt-1">
                  Water {weeklyContext.averageWater.toFixed(1)} glasses · Sleep {weeklyContext.averageSleep.toFixed(1)} hrs
                </p>
                {weeklyContext.missingHabits.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {weeklyContext.missingHabits.map((habit) => (
                      <span key={habit} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        {habit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {weeklyContext.timeline.map((day) => (
                <div
                  key={day.date}
                  className="min-w-[90px] rounded-lg bg-white/80 px-3 py-2 text-center border border-orange-100"
                >
                  <p className="text-[11px] font-semibold text-orange-900">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                  <p className={`text-sm font-bold ${day.deficit >= 0 ? 'text-green-700' : 'text-rose-600'}`}>
                    {formatDeficit(Math.round(day.deficit))} kcal
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {recommendations.map((rec, index) => {
            const { problem, improve } = parseRecommendation(rec.description);
            return (
              <div
                key={index}
                className={`rounded-lg border p-4 shadow-sm ${categoryColors[rec.category] || categoryColors.Overall}`}
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
                    {problem && (
                      <p className={`text-xs sm:text-sm leading-relaxed ${improve ? 'mb-3' : ''}`}>{problem}</p>
                    )}
                    {improve && (
                      <div className="mt-3 pt-3 border-t-2 border-white/60">
                        <div className="flex items-start gap-2">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-semibold text-green-700 mb-1.5">How to Improve:</div>
                            <p className="text-xs sm:text-sm leading-relaxed text-green-800">{improve}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

