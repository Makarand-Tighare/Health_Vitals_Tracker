'use client';

import { useState, useRef } from 'react';
import { CustomFood } from '@/types';

interface CustomFoodInputProps {
  onAdd: (food: CustomFood) => void;
  mealType: string;
}

// Simple in-memory cache for calorie and protein estimates
interface CacheEntry {
  calories: number;
  protein?: number;
  timestamp: number;
}

const calorieCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function CustomFoodInput({ onAdd, mealType }: CustomFoodInputProps) {
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('serving');
  const [isEstimating, setIsEstimating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleEstimate = async () => {
    if (!foodName.trim()) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cacheKey = `${foodName.trim().toLowerCase()}-${amount || '1'}-${unit}`;
    const cached = calorieCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_DURATION) {
        // Use cached value
        const customFood: CustomFood = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: foodName.trim(),
          calories: cached.calories,
          protein: cached.protein,
          amount: amount ? parseFloat(amount) : undefined,
          unit: unit,
          isCustom: true,
        };
        onAdd(customFood);
        setFoodName('');
        setAmount('');
        setUnit('serving');
        setShowForm(false);
        return;
      } else {
        // Cache expired, remove it
        calorieCache.delete(cacheKey);
      }
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsEstimating(true);
    try {
      const response = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName: foodName.trim(),
          amount: amount ? parseFloat(amount) : undefined,
          unit: unit,
        }),
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limit errors more gracefully
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        
        throw new Error(errorData.error || 'Failed to estimate calories');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.calories || isNaN(data.calories)) {
        throw new Error('Invalid calorie estimate received');
      }

      // Cache the result
      calorieCache.set(cacheKey, {
        calories: Math.round(data.calories),
        protein: data.protein ? parseFloat(data.protein) : undefined,
        timestamp: Date.now(),
      });

      if (!abortController.signal.aborted) {
        const customFood: CustomFood = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: foodName.trim(),
          calories: Math.round(data.calories),
          protein: data.protein ? parseFloat(data.protein) : undefined,
          amount: amount ? parseFloat(amount) : undefined,
          unit: unit,
          isCustom: true,
        };

        onAdd(customFood);
        setFoodName('');
        setAmount('');
        setUnit('serving');
        setShowForm(false);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error estimating calories:', error);
      alert(error.message || 'Failed to estimate calories. Please check your GEMINI_API_KEY configuration.');
    } finally {
      if (!abortController.signal.aborted) {
        setIsEstimating(false);
      }
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mt-2 sm:mt-3 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50"
      >
        + Add Custom Food
      </button>
    );
  }

  return (
    <div className="mt-2 sm:mt-3 rounded-lg border border-gray-300 bg-gray-50 p-3 sm:p-4">
      <div className="space-y-2.5 sm:space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Food Name
          </label>
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
              min="0"
              step="0.1"
              className="w-full rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="serving">Serving</option>
              <option value="piece">Piece</option>
              <option value="cup">Cup</option>
              <option value="gram">Gram</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="oz">Ounce</option>
              <option value="tbsp">Tablespoon</option>
              <option value="tsp">Teaspoon</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-col sm:flex-row">
          <button
            type="button"
            onClick={handleEstimate}
            disabled={isEstimating || !foodName.trim()}
            className="flex-1 rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEstimating ? 'Estimating...' : 'Estimate & Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setFoodName('');
              setAmount('');
            }}
            className="rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

