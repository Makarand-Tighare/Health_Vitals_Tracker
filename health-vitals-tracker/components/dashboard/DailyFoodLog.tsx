'use client';

import { useState } from 'react';
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
  const [reEstimating, setReEstimating] = useState<Set<string>>(new Set());

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

  const handleReEstimate = async (mealType: MealType, food: CustomFood) => {
    const foodId = food.id;
    setReEstimating(prev => new Set(prev).add(foodId));

    try {
      const response = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName: food.name,
          amount: food.amount,
          unit: food.unit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to re-estimate protein');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the food with new protein (and potentially updated calories)
      const meal = foodLogs.find(log => log.mealType === mealType);
      const updatedCustomFoods = (meal?.customFoods || []).map(f => {
        if (f.id === foodId) {
          return {
            ...f,
            protein: data.protein ? parseFloat(data.protein) : f.protein,
            calories: data.calories ? Math.round(data.calories) : f.calories, // Update calories if provided
          };
        }
        return f;
      });

      updateMeal(mealType, updatedCustomFoods);
    } catch (error: any) {
      console.error('Error re-estimating protein:', error);
      alert(error.message || 'Failed to re-estimate protein. Please try again.');
    } finally {
      setReEstimating(prev => {
        const next = new Set(prev);
        next.delete(foodId);
        return next;
      });
    }
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
                      {food.protein !== undefined && (
                        <span className="ml-0.5 sm:ml-1 text-green-600 font-medium whitespace-nowrap">
                          {food.protein}g protein
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReEstimate(type, food)}
                        disabled={reEstimating.has(food.id)}
                        className="ml-0.5 sm:ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Re-estimate protein"
                      >
                        {reEstimating.has(food.id) ? (
                          <svg className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
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

