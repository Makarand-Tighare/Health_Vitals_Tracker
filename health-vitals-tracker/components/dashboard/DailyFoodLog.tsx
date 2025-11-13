'use client';

import { FoodLog, MealType, CustomFood } from '@/types';
import CustomFoodInput from './CustomFoodInput';

interface DailyFoodLogProps {
  foodLogs: FoodLog[];
  onUpdate: (foodLogs: FoodLog[]) => void;
}

const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'snacks', label: 'Snacks' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'extra', label: 'Extra/Late Snacks' },
];

export default function DailyFoodLog({ foodLogs, onUpdate }: DailyFoodLogProps) {
  const updateMeal = (mealType: MealType, customFoods?: CustomFood[]) => {
    const updated = foodLogs.filter(log => log.mealType !== mealType);
    if (customFoods && customFoods.length > 0) {
      updated.push({ mealType, selectedFoods: [], customFoods });
    }
    onUpdate(updated);
  };

  const getMealCustomFoods = (mealType: MealType): CustomFood[] => {
    return foodLogs.find(log => log.mealType === mealType)?.customFoods || [];
  };

  const handleAddCustomFood = (mealType: MealType, customFood: CustomFood) => {
    const meal = foodLogs.find(log => log.mealType === mealType);
    const existingCustomFoods = meal?.customFoods || [];
    updateMeal(mealType, [...existingCustomFoods, customFood]);
  };

  const handleRemoveCustomFood = (mealType: MealType, foodId: string) => {
    const meal = foodLogs.find(log => log.mealType === mealType);
    const updatedCustomFoods = (meal?.customFoods || []).filter(f => f.id !== foodId);
    updateMeal(mealType, updatedCustomFoods);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Food Log</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">Add foods with AI-powered calorie estimation</p>
      </div>
      <div className="p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        {MEAL_TYPES.map(({ type, label }) => {
          const customFoods = getMealCustomFoods(type);
          return (
            <div key={type}>
              <label className="block text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                {label}
              </label>
              
              {customFoods.length > 0 && (
                <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                  {customFoods.map((food) => (
                    <span
                      key={food.id}
                      className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-blue-700 max-w-full"
                    >
                      <span className="font-semibold truncate">{food.name}</span>
                      {food.amount && (
                        <span className="text-blue-600 whitespace-nowrap">
                          ({food.amount} {food.unit})
                        </span>
                      )}
                      <span className="ml-0.5 sm:ml-1 text-blue-600 font-semibold whitespace-nowrap">
                        {food.calories} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomFood(type, food.id)}
                        className="ml-0.5 sm:ml-1.5 text-blue-600 hover:text-blue-800 font-bold text-sm flex-shrink-0"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <CustomFoodInput
                mealType={type}
                onAdd={(food) => handleAddCustomFood(type, food)}
              />
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

