'use client';

import { HealthInputs } from '@/types';

interface HealthInputsProps {
  health: HealthInputs;
  onUpdate: (health: HealthInputs) => void;
  calculatingQuality?: boolean;
  lastCalculated?: Date | null;
}

export default function HealthInputsComponent({ health, onUpdate, calculatingQuality = false, lastCalculated = null }: HealthInputsProps) {
  const updateField = <K extends keyof HealthInputs>(
    field: K,
    value: HealthInputs[K]
  ) => {
    onUpdate({ ...health, [field]: value });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Health Inputs</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Track sleep, hydration, and wellness metrics</p>
      </div>
      <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Wake Time
          </label>
          <input
            type="time"
            value={health.wakeTime}
            onChange={(e) => updateField('wakeTime', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Sleep Time
          </label>
          <input
            type="time"
            value={health.sleepTime}
            onChange={(e) => updateField('sleepTime', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Fruit Intake (servings)
          </label>
          <input
            type="number"
            value={health.fruitIntake || ''}
            onChange={(e) => updateField('fruitIntake', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all cursor-not-allowed"
              min="1"
              max="5"
            />
            {calculatingQuality && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          <div className="mt-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <p className="text-xs text-gray-500">
                Score is automatically calculated based on your logged foods
              </p>
              {lastCalculated && (
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  Last calculated: {lastCalculated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Face Status
          </label>
          <select
            value={health.faceStatus}
            onChange={(e) => updateField('faceStatus', e.target.value as HealthInputs['faceStatus'])}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <option value="puffy">Puffy</option>
            <option value="dull">Dull</option>
            <option value="normal">Normal</option>
            <option value="bright">Bright</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Notes
        </label>
        <textarea
          value={health.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          placeholder="Add any notes about your day..."
        />
      </div>
      </div>
    </div>
  );
}

