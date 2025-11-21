'use client';

import { useState, useRef, useEffect } from 'react';
import { CustomFood } from '@/types';

interface CustomFoodInputProps {
  onAdd: (food: CustomFood) => void;
}

// Simple in-memory cache for calorie and protein estimates
interface CacheEntry {
  calories: number;
  protein?: number;
  sodium?: number;
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
  const [useLabel, setUseLabel] = useState(false);
  const [labelCaloriesPer100, setLabelCaloriesPer100] = useState('');
  const [labelProteinPer100, setLabelProteinPer100] = useState('');
  const [labelSodiumPer100, setLabelSodiumPer100] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (useLabel) {
      setUnit('gram');
    }
  }, [useLabel]);

  const resetForm = () => {
    setFoodName('');
    setAmount('');
    setUnit('serving');
    setUseLabel(false);
    setLabelCaloriesPer100('');
    setLabelProteinPer100('');
    setLabelSodiumPer100('');
    setShowForm(false);
  };

  const handleEstimate = async () => {
    if (!foodName.trim()) return;

    if (useLabel) {
      if (!amount || isNaN(Number(amount))) {
        alert('Enter the amount in grams to use label-based nutrition.');
        return;
      }

      const grams = parseFloat(amount);
      if (grams <= 0) {
        alert('Amount must be greater than zero.');
        return;
      }

      if (unit !== 'gram') {
        alert('Set unit to grams when using packet nutrition values.');
        return;
      }

      if (!labelCaloriesPer100 || isNaN(Number(labelCaloriesPer100))) {
        alert('Enter calories per 100g from the label when using this mode.');
        return;
      }

      const calories = Math.round((grams * parseFloat(labelCaloriesPer100)) / 100);
      const proteinRaw = labelProteinPer100 ? (grams * parseFloat(labelProteinPer100)) / 100 : undefined;
      const protein = proteinRaw !== undefined ? Math.round(proteinRaw * 10) / 10 : undefined;
      const sodium = labelSodiumPer100 ? Math.round((grams * parseFloat(labelSodiumPer100)) / 100) : undefined;

      const customFood: CustomFood = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: foodName.trim(),
        calories,
        protein,
        sodium,
        amount: grams,
        unit: unit,
        isCustom: true,
      };

      onAdd(customFood);
      resetForm();
      return;
    }

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
          sodium: cached.sodium,
          amount: amount ? parseFloat(amount) : undefined,
          unit: unit,
          isCustom: true,
        };
        onAdd(customFood);
        resetForm();
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
      const sodiumValue = data.sodium !== undefined && data.sodium !== null ? parseFloat(data.sodium) : undefined;
      calorieCache.set(cacheKey, {
        calories: Math.round(data.calories),
        protein: proteinValue,
        sodium: sodiumValue,
        timestamp: Date.now(),
      });

      if (!abortController.signal.aborted) {
        const customFood: CustomFood = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: foodName.trim(),
          calories: Math.round(data.calories),
          protein: proteinValue,
          sodium: sodiumValue,
          amount: amount ? parseFloat(amount) : undefined,
          unit: unit,
          isCustom: true,
        };

        onAdd(customFood);
        resetForm();
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
            placeholder="e.g., Sprouts sabji + dal + 3 chapati"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Add the full plate for one person. Mention counts like &quot;3 chapati&quot;.
          </p>
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
              disabled={useLabel}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 disabled:bg-gray-100"
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

        <div className="rounded-lg border border-gray-200 bg-orange-50/40 px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-800">
            <input
              type="checkbox"
              checked={useLabel}
              onChange={(e) => setUseLabel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Use nutrition facts from a packet
          </label>
          <p className="mt-1 text-[11px] text-gray-600">
            Enter per-100g values from the label. Amount must be in grams when enabled.
          </p>
        </div>

        {useLabel && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Calories / 100g (kcal)
              </label>
              <input
                type="number"
                value={labelCaloriesPer100}
                onChange={(e) => setLabelCaloriesPer100(e.target.value)}
                placeholder="e.g., 250"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Protein / 100g (g)
              </label>
              <input
                type="number"
                value={labelProteinPer100}
                onChange={(e) => setLabelProteinPer100(e.target.value)}
                placeholder="e.g., 12"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Sodium / 100g (mg)
              </label>
              <input
                type="number"
                value={labelSodiumPer100}
                onChange={(e) => setLabelSodiumPer100(e.target.value)}
                placeholder="e.g., 420"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              />
            </div>
          </div>
        )}

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
              resetForm();
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
