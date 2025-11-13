'use client';

import { HealthInputs } from '@/types';

interface HealthInputsProps {
  health: HealthInputs;
  onUpdate: (health: HealthInputs) => void;
}

export default function HealthInputsComponent({ health, onUpdate }: HealthInputsProps) {
  const updateField = <K extends keyof HealthInputs>(
    field: K,
    value: HealthInputs[K]
  ) => {
    onUpdate({ ...health, [field]: value });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <span className="text-xl">💚</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Daily Health Inputs</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wake Time
          </label>
          <input
            type="time"
            value={health.wakeTime}
            onChange={(e) => updateField('wakeTime', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Time
          </label>
          <input
            type="time"
            value={health.sleepTime}
            onChange={(e) => updateField('sleepTime', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💧 Water Intake (glasses)
          </label>
          <input
            type="number"
            value={health.waterIntake || ''}
            onChange={(e) => updateField('waterIntake', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🍎 Fruit Intake (servings)
          </label>
          <input
            type="number"
            value={health.fruitIntake || ''}
            onChange={(e) => updateField('fruitIntake', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🍵 Green Tea Count
          </label>
          <input
            type="number"
            value={health.greenTeaCount || ''}
            onChange={(e) => updateField('greenTeaCount', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⭐ Food Quality Score (1-5)
          </label>
          <input
            type="number"
            value={health.foodQualityScore || ''}
            onChange={(e) => updateField('foodQualityScore', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="0"
            min="1"
            max="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            😊 Face Status
          </label>
          <select
            value={health.faceStatus}
            onChange={(e) => updateField('faceStatus', e.target.value as HealthInputs['faceStatus'])}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="puffy">Puffy</option>
            <option value="dull">Dull</option>
            <option value="normal">Normal</option>
            <option value="bright">Bright</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Notes
        </label>
        <textarea
          value={health.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="Add any notes about your day..."
        />
      </div>
    </div>
  );
}

