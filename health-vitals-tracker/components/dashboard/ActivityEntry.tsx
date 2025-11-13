'use client';

import { ActivityData } from '@/types';

interface ActivityEntryProps {
  activity: ActivityData;
  onUpdate: (activity: ActivityData) => void;
}

export default function ActivityEntry({ activity, onUpdate }: ActivityEntryProps) {
  const updateField = (field: keyof ActivityData, value: number) => {
    if (field === 'activeCalories' || field === 'restingCalories') {
      const newActivity = {
        ...activity,
        [field]: value,
        totalBurn: field === 'activeCalories' 
          ? value + activity.restingCalories
          : activity.activeCalories + value,
      };
      onUpdate(newActivity);
    } else if (field === 'workoutTime') {
      // This will be handled separately
    } else {
      onUpdate({ ...activity, [field]: value });
    }
  };

  const updateWorkoutTime = (type: 'strength' | 'cardio', value: number) => {
    onUpdate({
      ...activity,
      workoutTime: {
        ...activity.workoutTime,
        [type]: value,
      },
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Activity Tracking</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Enter your Apple Watch data or manual activity metrics</p>
      </div>
      <div className="p-4 sm:p-6">

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Active Calories
          </label>
          <input
            type="number"
            value={activity.activeCalories || ''}
            onChange={(e) => updateField('activeCalories', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Resting Calories
          </label>
          <input
            type="number"
            value={activity.restingCalories || ''}
            onChange={(e) => updateField('restingCalories', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Total Burn
          </label>
          <input
            type="number"
            value={activity.totalBurn || ''}
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Strength Workout (minutes)
          </label>
          <input
            type="number"
            value={activity.workoutTime.strength || ''}
            onChange={(e) => updateWorkoutTime('strength', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Cardio Workout (minutes)
          </label>
          <input
            type="number"
            value={activity.workoutTime.cardio || ''}
            onChange={(e) => updateWorkoutTime('cardio', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            placeholder="0"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

