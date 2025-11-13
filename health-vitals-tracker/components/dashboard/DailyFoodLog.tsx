'use client';

import { useState, useEffect, useRef } from 'react';
import { FoodLog, MealType } from '@/types';
import { FOOD_DATABASE } from '@/lib/foodDatabase';

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
  const updateMeal = (mealType: MealType, selectedFoods: string[]) => {
    const updated = foodLogs.filter(log => log.mealType !== mealType);
    if (selectedFoods.length > 0) {
      updated.push({ mealType, selectedFoods });
    }
    onUpdate(updated);
  };

  const getMealFoods = (mealType: MealType): string[] => {
    return foodLogs.find(log => log.mealType === mealType)?.selectedFoods || [];
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
          <span className="text-xl">🍽️</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Daily Food Log</h3>
      </div>
      
      <div className="space-y-6">
        {MEAL_TYPES.map(({ type, label }) => (
          <MealSelector
            key={type}
            mealType={type}
            label={label}
            selectedFoods={getMealFoods(type)}
            onSelectionChange={(foods) => updateMeal(type, foods)}
          />
        ))}
      </div>
    </div>
  );
}

interface MealSelectorProps {
  mealType: MealType;
  label: string;
  selectedFoods: string[];
  onSelectionChange: (foodIds: string[]) => void;
}

function MealSelector({ label, selectedFoods, onSelectionChange }: MealSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredFoods = FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleFood = (foodId: string) => {
    if (selectedFoods.includes(foodId)) {
      onSelectionChange(selectedFoods.filter(id => id !== foodId));
    } else {
      onSelectionChange([...selectedFoods, foodId]);
    }
  };

  const selectedFoodNames = FOOD_DATABASE
    .filter(food => selectedFoods.includes(food.id))
    .map(food => food.name);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm shadow-sm transition-all hover:border-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {selectedFoodNames.length > 0
            ? selectedFoodNames.join(', ')
            : 'Select foods...'}
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search foods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => (
                  <label
                    key={food.id}
                    className="flex items-center px-4 py-2.5 hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFoods.includes(food.id)}
                      onChange={() => toggleFood(food.id)}
                      className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                    />
                    <span className="text-sm text-gray-700 flex-1">{food.name}</span>
                    <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      {food.calories} kcal
                    </span>
                  </label>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No foods found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedFoodNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFoodNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 shadow-sm"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

