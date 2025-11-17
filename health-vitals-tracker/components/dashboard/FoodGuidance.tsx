'use client';

import { FoodGuidance, FoodGuidanceItem } from '@/types';

interface FoodGuidanceProps {
  guidance: FoodGuidance | null;
  loading?: boolean;
  onFetchGuidance?: () => void;
  disabled?: boolean;
  errorMessage?: string | null;
  hasMeals?: boolean;
}

const SummaryChip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
    <span className="text-gray-500 font-medium mr-1">{label}:</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

const GuidanceList = ({ title, items, accent }: { title: string; items: FoodGuidanceItem[]; accent: 'positive' | 'negative' }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 h-full shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className={`h-2.5 w-2.5 rounded-full ${accent === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
    </div>
    {items.length === 0 ? (
      <p className="text-xs text-gray-500">No suggestions yet. Keep logging meals for personalized tips.</p>
    ) : (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className={`rounded-lg border p-3 ${accent === 'positive' ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-xs text-gray-700 leading-relaxed">{item.detail}</p>
              </div>
              {item.emphasis && (
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${accent === 'positive' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {item.emphasis}
                </span>
              )}
            </div>
            {item.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.suggestions.map((suggestion) => (
                  <span
                    key={suggestion}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm border border-gray-100"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function FoodGuidanceCard({
  guidance,
  loading = false,
  onFetchGuidance,
  disabled = false,
  errorMessage,
  hasMeals = false,
}: FoodGuidanceProps) {
  const buttonLabel = guidance ? 'Refresh AI Guidance' : 'Get AI Food Guidance';

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Food Guidance</h3>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-orange-100 text-orange-700">
                AI
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Smart cues on what to repeat and what to pause based on today&apos;s log
            </p>
          </div>
          {onFetchGuidance && (
            <button
              type="button"
              onClick={onFetchGuidance}
              disabled={loading || disabled}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                buttonLabel
              )}
            </button>
          )}
        </div>
        {!hasMeals && (
          <p className="mt-2 text-xs text-amber-700">Add at least one meal to unlock AI guidance.</p>
        )}
        {errorMessage && (
          <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
        )}
      </div>
      <div className="p-4 sm:p-6">
        {guidance ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <SummaryChip label="Protein" value={`${guidance.summary.totalProtein}g`} />
              <SummaryChip label="Fruit" value={`${guidance.summary.fruitServings.toFixed(1)} servings`} />
              <SummaryChip label="Meals Logged" value={`${guidance.summary.mealsLogged}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <GuidanceList title="Double Down On" items={guidance.eatMore} accent="positive" />
              <GuidanceList title="Press Pause On" items={guidance.limit} accent="negative" />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 mb-2">
              {hasMeals
                ? 'Tap the AI button above to get personalized suggestions for today.'
                : 'Log today&apos;s meals to unlock targeted food suggestions.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
