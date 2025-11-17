'use client';

import { HealthInputs, FruitInsights } from '@/types';

interface HealthInputsProps {
  health: HealthInputs;
  onUpdate: (health: HealthInputs) => void;
  calculatingQuality?: boolean;
  lastCalculated?: Date | null;
  fruitInsights?: FruitInsights | null;
}

export default function HealthInputsComponent({ health, onUpdate, calculatingQuality = false, lastCalculated = null, fruitInsights = null }: HealthInputsProps) {
  const updateField = <K extends keyof HealthInputs>(
    field: K,
    value: HealthInputs[K]
  ) => {
    onUpdate({ ...health, [field]: value });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Health Inputs</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Track sleep, hydration, and wellness metrics</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <div className="min-w-0">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sleep Time
            </label>
            <input
              type="time"
              value={health.sleepTime}
              onChange={(e) => updateField('sleepTime', e.target.value)}
              className="w-full max-w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              style={{ minWidth: 0 }}
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Wake Time
            </label>
            <input
              type="time"
              value={health.wakeTime}
              onChange={(e) => updateField('wakeTime', e.target.value)}
              className="w-full max-w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              style={{ minWidth: 0 }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Water Intake (glasses)
            </label>
            <input
              type="number"
              value={health.waterIntake || ''}
              onChange={(e) => updateField('waterIntake', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Green Tea Count
            </label>
            <input
              type="number"
              value={health.greenTeaCount || ''}
              onChange={(e) => updateField('greenTeaCount', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Black Coffee Count
            </label>
            <input
              type="number"
              value={health.blackCoffeeCount || ''}
              onChange={(e) => updateField('blackCoffeeCount', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Food Quality Score (1-5)
              <span className="ml-2 text-xs font-normal text-gray-500">(AI Calculated)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={health.foodQualityScore || ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 cursor-not-allowed"
                min="1"
                max="5"
              />
              {calculatingQuality && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                Score is automatically calculated based on your logged foods
              </p>
              {lastCalculated && (
                <p className="text-xs text-gray-400 mt-1">
                  Last calculated: {lastCalculated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Face Status
            </label>
            <select
              value={health.faceStatus}
              onChange={(e) => updateField('faceStatus', e.target.value as HealthInputs['faceStatus'])}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            >
              <option value="puffy">Puffy</option>
              <option value="dull">Dull</option>
              <option value="normal">Normal</option>
              <option value="bright">Bright</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Fruit Servings</p>
                <p className="text-xs text-amber-700 mt-0.5">Auto-detected from today&apos;s food log</p>
              </div>
              <div className="text-3xl font-bold text-amber-900">
                {Number((health.fruitIntake || 0).toFixed(1))}
              </div>
            </div>
            {fruitInsights?.matches.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {fruitInsights.matches.map((match, index) => (
                  <span
                    key={`${match.name}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm"
                  >
                    <span>{match.name}</span>
                    <span className="text-amber-700">× {Number(match.servings.toFixed(1))}</span>
                    {match.mealType && (
                      <span className="uppercase tracking-wide text-[10px] text-amber-600">
                        {match.mealType}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-700">
                No fruit detected yet. Add fruits to your meals to improve micronutrients.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Veg Mode
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={health.vegMode || false}
                onChange={(e) => updateField('vegMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            When enabled, AI will only suggest vegetarian food options
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Notes
          </label>
          <textarea
            value={health.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 placeholder:text-gray-400 resize-none"
            placeholder="Add any notes about your day..."
          />
        </div>
      </div>
    </div>
  );
}
