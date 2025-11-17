'use client';

import { useState, useRef } from 'react';
import { CustomFood } from '@/types';

interface CustomFoodInputProps {
  onAdd: (food: CustomFood) => void;
}

// Simple in-memory cache for calorie and protein estimates
interface CacheEntry {
  calories: number;
  protein?: number;
  timestamp: number;
}

const calorieCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function CustomFoodInput({ onAdd }: CustomFoodInputProps) {
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
        const cachedProtein = cached.protein !== undefined && cached.protein !== null ? cached.protein : undefined;
        const customFood: CustomFood = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: foodName.trim(),
          calories: cached.calories,
          protein: cachedProtein,
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
      const proteinValue = data.protein !== undefined && data.protein !== null ? parseFloat(data.protein) : undefined;
      calorieCache.set(cacheKey, {
        calories: Math.round(data.calories),
        protein: proteinValue,
        timestamp: Date.now(),
      });

      if (!abortController.signal.aborted) {
        const customFood: CustomFood = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: foodName.trim(),
          calories: Math.round(data.calories),
          protein: proteinValue,
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
    } catch (error: unknown) {
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError')
      ) {
        return;
      }
      console.error('Error estimating calories:', error);
      const message = error instanceof Error ? error.message : 'Failed to estimate calories. Please check your GEMINI_API_KEY configuration.';
      alert(message);
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
        className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
      >
        + Add Custom Food
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Food Name
          </label>
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEstimate}
            disabled={isEstimating || !foodName.trim()}
            className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm"
          >
            {isEstimating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Estimating...
              </span>
            ) : (
              'Estimate & Add'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setFoodName('');
              setAmount('');
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
