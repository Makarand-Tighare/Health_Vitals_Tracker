'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DailyEntry, FoodLog, ActivityData, HealthInputs, FruitInsights, FoodGuidance, WeeklyRecommendationContext, Recommendation, CustomFood } from '@/types';
import { calculateMetrics } from '@/lib/calculations';
import { saveDailyEntry, getDailyEntry, getEntriesInRange, deleteRecommendations } from '@/lib/firebase/db';
import { analyzeFruitIntake, buildWeeklyContext } from '@/lib/insights';
import DailyFoodLog from '@/components/dashboard/DailyFoodLog';
import ActivityEntry from '@/components/dashboard/ActivityEntry';
import HealthInputsComponent from '@/components/dashboard/HealthInputs';
import FoodGuidanceCard from '@/components/dashboard/FoodGuidance';
import MetricsDisplay from '@/components/dashboard/MetricsDisplay';
import DailyRecommendations from '@/components/dashboard/DailyRecommendations';
import Navigation from '@/components/Navigation';

const getTodayDate = () => {
  // Use local timezone instead of UTC to avoid date mismatches
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultActivity: ActivityData = {
  activeCalories: 0,
  restingCalories: 0,
  totalBurn: 0,
  workoutTime: {
    strength: 0,
    cardio: 0,
  },
};

const VEG_MODE_STORAGE_KEY = 'hv_veg_mode_pref';

const defaultHealth: HealthInputs = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  waterIntake: 0,
  fruitIntake: 0,
  greenTeaCount: 0,
  blackCoffeeCount: 0,
  foodQualityScore: 3,
  faceStatus: 'normal',
  notes: '',
  vegMode: false,
};

const getStoredVegModePreference = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(VEG_MODE_STORAGE_KEY) === 'true';
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [date, setDate] = useState<string>(() => getTodayDate());
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activity, setActivity] = useState<ActivityData>(defaultActivity);
  const [health, setHealth] = useState<HealthInputs>(defaultHealth);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const [calculatingQuality, setCalculatingQuality] = useState(false);
  const [foodQualityLastCalculated, setFoodQualityLastCalculated] = useState<Date | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [fruitInsights, setFruitInsights] = useState<FruitInsights | null>(null);
  const [aiFoodGuidance, setAiFoodGuidance] = useState<FoodGuidance | null>(null);
  const [loadingFoodGuidance, setLoadingFoodGuidance] = useState(false);
  const [foodGuidanceError, setFoodGuidanceError] = useState<string | null>(null);
  const [weeklyContext, setWeeklyContext] = useState<WeeklyRecommendationContext | null>(null);
  const [loadingWeeklyContext, setLoadingWeeklyContext] = useState(false);

  const hasMealsLogged = useMemo(
    () => foodLogs.some(log => log.customFoods && log.customFoods.length > 0),
    [foodLogs]
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qualityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qualityAbortControllerRef = useRef<AbortController | null>(null);
  const lastQualityCalculationRef = useRef<string>('');
  const savingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const currentEditDateRef = useRef<string>('');

  // Ensure date is set to today on initial load/reload (only once per session)
  useEffect(() => {
    if (user && !authLoading && !hasInitializedRef.current) {
      const today = getTodayDate();
      setDate(today);
      hasInitializedRef.current = true;
    }
  }, [user, authLoading]);

  const loadEntry = useCallback(async () => {
    if (!user) return;

    // CRITICAL: Clear state FIRST before loading to prevent data mixing
    setFoodLogs([]);
    setActivity(defaultActivity);
    setHealth(defaultHealth);
    setRecommendations([]);
    
    setLoading(true);
    // Clear any pending auto-saves when loading a new date
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Capture the date we're loading to prevent race conditions
    const loadDate = date;
    // Update the current edit date ref
    currentEditDateRef.current = loadDate;
    
    try {
      const entry = await getDailyEntry(user.uid, loadDate);
      if (entry) {
        // Double-check we're still loading the same date (prevent race conditions)
        if (currentEditDateRef.current === loadDate) {
          setFoodLogs(entry.foodLogs || []);
          setActivity(entry.activity || defaultActivity);
          setHealth(entry.health || { ...defaultHealth, vegMode: entry.health?.vegMode ?? getStoredVegModePreference() });
          // Load recommendations if they exist
          if (entry.recommendations && entry.recommendations.length > 0) {
            setRecommendations(entry.recommendations);
          } else {
            setRecommendations([]);
          }
        }
      } else {
        // Reset to defaults for new date (only if still on same date)
        if (currentEditDateRef.current === loadDate) {
          setFoodLogs([]);
          setActivity(defaultActivity);
          setHealth({ ...defaultHealth, vegMode: getStoredVegModePreference() });
          setRecommendations([]);
          setFoodQualityLastCalculated(null);
        }
      }
    } catch (error: unknown) {
      console.error('Error loading entry:', error);
    } finally {
      if (currentEditDateRef.current === loadDate) {
        setLoading(false);
      }
    }
  }, [user, date]);

  useEffect(() => {
    if (user && !authLoading) {
      // Reset timestamp when date changes
      setFoodQualityLastCalculated(null);
      loadEntry();
    }
  }, [user, date, authLoading, loadEntry]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VEG_MODE_STORAGE_KEY, String(health.vegMode ?? false));
  }, [health.vegMode]);

  useEffect(() => {
    setAiFoodGuidance(null);
    setFoodGuidanceError(null);
  }, [date]);

  useEffect(() => {
    if (!hasMealsLogged) {
      setAiFoodGuidance(null);
    }
  }, [hasMealsLogged]);

  const fetchRecommendations = async (currentFoodLogs: FoodLog[], currentActivity: ActivityData, currentHealth: HealthInputs) => {
    if (!user) return;

    // Generate new recommendations
    try {
      setLoadingRecommendations(true);
      
      // Delete existing recommendations from database first
      await deleteRecommendations(user.uid, date);
      
      // Clear recommendations from state
      setRecommendations([]);
      
      const metrics = calculateMetrics(currentFoodLogs, currentActivity);
      
      const entry: DailyEntry = {
        id: `${user.uid}_${date}`,
        userId: user.uid,
        date,
        foodLogs: currentFoodLogs,
        activity: currentActivity,
        health: currentHealth,
        metrics,
      };

      const response = await fetch('/api/get-daily-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entry }),
      });

      if (!response.ok) {
        // Silently fail - don't show errors for recommendations
        if (response.status !== 429) {
          console.warn('Failed to fetch recommendations');
        }
        return;
      }

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        
        // Save recommendations to database immediately
        if (user) {
          const metrics = calculateMetrics(currentFoodLogs, currentActivity);
          const entry: DailyEntry = {
            id: `${user.uid}_${date}`,
            userId: user.uid,
            date,
            foodLogs: currentFoodLogs,
            activity: currentActivity,
            health: currentHealth,
            metrics,
            recommendations: data.recommendations,
          };
          
          // Save immediately to database
          await saveDailyEntry(entry);
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchFoodGuidance = async () => {
    if (!user) return;
    if (!hasMealsLogged) {
      setFoodGuidanceError('Log at least one food item to unlock AI guidance.');
      return;
    }

    try {
      setLoadingFoodGuidance(true);
      setFoodGuidanceError(null);
      const metrics = calculateMetrics(foodLogs, activity);
      const entry: DailyEntry = {
        id: `${user.uid}_${date}`,
        userId: user.uid,
        date,
        foodLogs,
        activity,
        health,
        metrics,
      };

      const response = await fetch('/api/get-food-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry,
          vegMode: health.vegMode || false,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setFoodGuidanceError('AI guidance is cooling down. Please try again in a bit.');
          return;
        }
        throw new Error('Failed to fetch AI guidance');
      }

      const data = await response.json();
      if (data.guidance) {
        setAiFoodGuidance(data.guidance);
      } else {
        setFoodGuidanceError('AI returned an empty response. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching food guidance:', error);
      setFoodGuidanceError('Unable to fetch AI guidance. Please try again.');
    } finally {
      setLoadingFoodGuidance(false);
    }
  };

  useEffect(() => {
    const derivedInsights = analyzeFruitIntake(foodLogs);
    setFruitInsights(derivedInsights);

    setHealth(prev => {
      const detected = Number(derivedInsights.servings.toFixed(1));
      const prevValue = typeof prev.fruitIntake === 'number' ? prev.fruitIntake : 0;
      const current = Number(prevValue.toFixed(1));
      if (detected === current) return prev;
      return { ...prev, fruitIntake: detected };
    });
  }, [foodLogs]);

  useEffect(() => {
    if (!user) {
      setWeeklyContext(null);
      return;
    }

    let cancelled = false;

    const fetchContext = async () => {
      setLoadingWeeklyContext(true);
      try {
        const endDate = date;
        const start = new Date(date);
        start.setDate(start.getDate() - 6);
        const startDate = start.toISOString().split('T')[0];
        const entries = await getEntriesInRange(user.uid, startDate, endDate);
        if (!cancelled) {
          setWeeklyContext(buildWeeklyContext(entries, endDate));
        }
      } catch (error: unknown) {
        console.error('Error building weekly context:', error);
        if (!cancelled) {
          setWeeklyContext(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingWeeklyContext(false);
        }
      }
    };

    fetchContext();

    return () => {
      cancelled = true;
    };
  }, [user, date]);

  const navigateDate = (days: number) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];
    setDate(newDate);
  };

  const goToPreviousDay = () => navigateDate(-1);
  const goToNextDay = () => navigateDate(1);
  const goToToday = () => setDate(getTodayDate());

  const calculateFoodQuality = async (logs: FoodLog[]) => {
    // Create a signature of the food logs to detect actual changes
    const foodsSignature = JSON.stringify(
      logs
        .flatMap(log => log.customFoods || [])
        .map(food => `${food.name}-${food.amount || ''}-${food.unit || ''}`)
        .sort()
    );

    // Skip if nothing actually changed
    if (foodsSignature === lastQualityCalculationRef.current) {
      return;
    }

    // Cancel any pending request
    if (qualityAbortControllerRef.current) {
      qualityAbortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    qualityAbortControllerRef.current = abortController;

    try {
      setCalculatingQuality(true);
      const response = await fetch('/api/calculate-food-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodLogs: logs }),
        signal: abortController.signal,
      });

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If rate limited, don't show error - just keep existing score
        if (response.status === 429) {
          console.warn('Food quality calculation rate limited. Will retry later.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to calculate food quality');
      }

      const data = await response.json();
      if (data.score && !abortController.signal.aborted) {
        lastQualityCalculationRef.current = foodsSignature;
        setHealth(prev => ({
          ...prev,
          foodQualityScore: data.score,
        }));
        setFoodQualityLastCalculated(new Date());
      }
    } catch (error: unknown) {
      // Ignore abort errors
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError')
      ) {
        return;
      }
      console.error('Error calculating food quality:', error);
      // Keep existing score on error - don't show alert to avoid annoying user
    } finally {
      if (!abortController.signal.aborted) {
        setCalculatingQuality(false);
      }
    }
  };

  const handleSave = async (showNotification = true) => {
    if (!user) return;

    // Clear any pending auto-saves before manual save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // CRITICAL: Capture the date IMMEDIATELY at the start of save
    // This prevents race conditions if date changes during save
    const saveDate = date;
    
    // Double-check we're saving to the correct date
    if (saveDate !== currentEditDateRef.current && currentEditDateRef.current !== '') {
      console.error('Date mismatch! Current date:', date, 'Edit date ref:', currentEditDateRef.current);
      alert('Error: Date mismatch detected. Please reload the page.');
      return;
    }

    setSaving(true);
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      const metrics = calculateMetrics(foodLogs, activity);
      
      // Clean foodLogs to remove empty arrays and undefined customFoods
      const cleanedFoodLogs = foodLogs
        .filter(log => log.customFoods && log.customFoods.length > 0)
        .map(log => {
          // Clean each custom food to remove undefined values
          const cleanedCustomFoods = log.customFoods!.map(food => {
            const cleaned: CustomFood = {
              id: food.id,
              name: food.name,
              calories: food.calories,
              isCustom: true,
            };
            if (food.amount !== undefined && food.amount !== null) {
              cleaned.amount = food.amount;
            }
            if (food.unit !== undefined && food.unit !== null && food.unit !== '') {
              cleaned.unit = food.unit;
            }
            // Preserve protein if it exists (including 0)
            if ('protein' in food) {
              const proteinValue = food.protein;
              if (proteinValue !== undefined && proteinValue !== null) {
                const numProtein = typeof proteinValue === 'number' ? proteinValue : Number(proteinValue);
                if (!isNaN(numProtein)) {
                  cleaned.protein = numProtein;
                }
              }
            }
            if ('sodium' in food) {
              const sodiumValue = food.sodium;
              if (sodiumValue !== undefined && sodiumValue !== null) {
                const numSodium = typeof sodiumValue === 'number' ? sodiumValue : Number(sodiumValue);
                if (!isNaN(numSodium)) {
                  cleaned.sodium = numSodium;
                }
              }
            }
            return cleaned;
          });
          
          return {
            mealType: log.mealType,
            selectedFoods: [], // Always empty now since we only use custom foods
            customFoods: cleanedCustomFoods,
          };
        });

      const entry: DailyEntry = {
        id: `${user.uid}_${saveDate}`,
        userId: user.uid,
        date: saveDate,
        foodLogs: cleanedFoodLogs,
        activity,
        health,
        metrics,
        recommendations, // Preserve existing recommendations
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Log what we're saving to verify correct date
      console.log(`[SAVE] Saving to date: ${saveDate}, Entry ID: ${entry.id}, Current state date: ${date}`);
      await saveDailyEntry(entry);
      console.log(`[SAVE] Successfully saved to date: ${saveDate}`);
      setLastSaved(new Date());
      setSaveStatus('saved');
      if (showNotification) {
        // Show a subtle notification
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (error: unknown) {
      console.error('Error saving entry:', error);
      setSaveStatus('unsaved');
      alert('Error saving entry. Please try again.');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  // Auto-calculate food quality when food logs change (with debounce)
  useEffect(() => {
    if (!user || loading) return;

    // Clear existing timeout
    if (qualityTimeoutRef.current) {
      clearTimeout(qualityTimeoutRef.current);
    }

    // Set new timeout for quality calculation (15 seconds after last change to reduce API calls)
    qualityTimeoutRef.current = setTimeout(() => {
      if (foodLogs.length > 0) {
        calculateFoodQuality(foodLogs);
      } else {
        // No foods, reset to default
        lastQualityCalculationRef.current = '';
        setHealth(prev => ({
          ...prev,
          foodQualityScore: 3,
        }));
      }
    }, 15000);

    return () => {
      if (qualityTimeoutRef.current) {
        clearTimeout(qualityTimeoutRef.current);
      }
    };
  }, [foodLogs, user, loading]);

  // Load existing recommendations when date changes (but don't auto-generate)
  useEffect(() => {
    if (!user || loading) return;
    
    // Only check database for existing recommendations, don't auto-generate
    const loadExistingRecommendations = async () => {
      try {
        const existingEntry = await getDailyEntry(user.uid, date);
        if (existingEntry?.recommendations && existingEntry.recommendations.length > 0) {
          setRecommendations(existingEntry.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error: unknown) {
        console.error('Error loading recommendations:', error);
        setRecommendations([]);
      }
    };
    
    loadExistingRecommendations();
  }, [date, user, loading]);

  // Auto-save when data changes (with debounce)
  useEffect(() => {
    if (!user || loading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds after last change)
    // Capture the current date to ensure we save to the correct date
    const saveDate = date;
    saveTimeoutRef.current = setTimeout(async () => {
      // Only save if:
      // 1. Not already saving
      // 2. User is logged in
      // 3. Not currently loading
      // 4. The date hasn't changed since we set the timeout
      if (!savingRef.current && user && !loading && saveDate === currentEditDateRef.current) {
        // Auto-save without notification
        const currentUserId = user.uid;
        setSaving(true);
        savingRef.current = true;
        setSaveStatus('saving');
        try {
          const metrics = calculateMetrics(foodLogs, activity);
          
          // Clean foodLogs to remove empty arrays and undefined customFoods
          const cleanedFoodLogs = foodLogs
            .filter(log => log.customFoods && log.customFoods.length > 0)
            .map(log => {
              // Clean each custom food to remove undefined values
              const cleanedCustomFoods = log.customFoods!.map(food => {
                const cleaned: CustomFood = {
                  id: food.id,
                  name: food.name,
                  calories: food.calories,
                  isCustom: true,
                };
                if (food.amount !== undefined && food.amount !== null) {
                  cleaned.amount = food.amount;
                }
                if (food.unit !== undefined && food.unit !== null && food.unit !== '') {
                  cleaned.unit = food.unit;
                }
                // Preserve protein if it exists (including 0)
                if ('protein' in food) {
                  const proteinValue = food.protein;
                  if (proteinValue !== undefined && proteinValue !== null) {
                    const numProtein = typeof proteinValue === 'number' ? proteinValue : Number(proteinValue);
                    if (!isNaN(numProtein)) {
                      cleaned.protein = numProtein;
                    }
                  }
                }
                if ('sodium' in food) {
                  const sodiumValue = food.sodium;
                  if (sodiumValue !== undefined && sodiumValue !== null) {
                    const numSodium = typeof sodiumValue === 'number' ? sodiumValue : Number(sodiumValue);
                    if (!isNaN(numSodium)) {
                      cleaned.sodium = numSodium;
                    }
                  }
                }
                return cleaned;
              });
              
              return {
                mealType: log.mealType,
                selectedFoods: [], // Always empty now since we only use custom foods
                customFoods: cleanedCustomFoods,
              };
            });

          const entry: DailyEntry = {
            id: `${currentUserId}_${saveDate}`,
            userId: currentUserId,
            date: saveDate,
            foodLogs: cleanedFoodLogs,
            activity,
            health,
            metrics,
            recommendations, // Preserve existing recommendations
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await saveDailyEntry(entry);
          setLastSaved(new Date());
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 1000);
        } catch (error: unknown) {
          console.error('Auto-save error:', error);
          setSaveStatus('unsaved');
        } finally {
          setSaving(false);
          savingRef.current = false;
        }
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [foodLogs, activity, health, date, user, loading, recommendations]);

  const metrics = calculateMetrics(foodLogs, activity);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Should be handled by auth redirect
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-4 sm:py-8">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Health Vitals Tracker
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Monitor your daily nutrition, activity, and wellness metrics</p>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Date:</label>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (savingRef.current) {
                        alert('Please wait for the current save to complete before changing dates.');
                        return;
                      }
                      goToPreviousDay();
                    }}
                    disabled={savingRef.current}
                    className="rounded-lg border border-gray-300 bg-white p-1.5 sm:p-2 text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 flex-shrink-0"
                    title="Previous day"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      // Prevent date change while saving
                      if (savingRef.current) {
                        alert('Please wait for the current save to complete before changing dates.');
                        return;
                      }
                      setDate(e.target.value);
                    }}
                    disabled={savingRef.current}
                    className="rounded-lg border border-gray-300 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (savingRef.current) {
                        alert('Please wait for the current save to complete before changing dates.');
                        return;
                      }
                      goToNextDay();
                    }}
                    disabled={date >= getTodayDate() || savingRef.current}
                    className="rounded-lg border border-gray-300 bg-white p-1.5 sm:p-2 text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Next day"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {date !== getTodayDate() && (
                    <button
                      type="button"
                      onClick={() => {
                        if (savingRef.current) {
                          alert('Please wait for the current save to complete before changing dates.');
                          return;
                        }
                        goToToday();
                      }}
                      disabled={savingRef.current}
                      className="rounded-lg border border-orange-300 bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-orange-700 shadow-sm transition-all hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 whitespace-nowrap flex-shrink-0"
                      title="Go to today"
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {saveStatus === 'saving' && (
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-xs sm:text-sm text-green-600 font-medium">Saved</span>
                )}
                {lastSaved && saveStatus !== 'saving' && saveStatus !== 'saved' && (
                  <span className="text-xs text-gray-500 font-normal hidden sm:inline">
                    Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="rounded-lg bg-orange-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap ml-auto"
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 sm:px-4 py-2 sm:py-3">
            <p className="text-xs sm:text-sm text-orange-800">
              <span className="font-semibold">Note:</span> You can update your entries throughout the day. Changes are automatically saved 3 seconds after you stop editing.
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <DailyFoodLog foodLogs={foodLogs} onUpdate={setFoodLogs} />
        <ActivityEntry activity={activity} onUpdate={setActivity} />
        <HealthInputsComponent 
          health={health} 
          onUpdate={setHealth} 
          calculatingQuality={calculatingQuality}
          lastCalculated={foodQualityLastCalculated}
          fruitInsights={fruitInsights}
        />
        <FoodGuidanceCard
          guidance={aiFoodGuidance}
          loading={loadingFoodGuidance}
          onFetchGuidance={hasMealsLogged ? fetchFoodGuidance : undefined}
          disabled={!hasMealsLogged}
          errorMessage={foodGuidanceError}
          hasMeals={hasMealsLogged}
        />
        <MetricsDisplay metrics={metrics} />
        <DailyRecommendations 
          recommendations={recommendations} 
          loading={loadingRecommendations}
          onFetchRecommendations={() => fetchRecommendations(foodLogs, activity, health)}
          weeklyContext={loadingWeeklyContext ? null : weeklyContext}
        />
        </div>
      </div>
      </div>
    </>
  );
}

