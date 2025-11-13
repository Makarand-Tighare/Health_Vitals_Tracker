'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DailyEntry, FoodLog, ActivityData, HealthInputs } from '@/types';
import { calculateMetrics } from '@/lib/calculations';
import { saveDailyEntry, getDailyEntry } from '@/lib/firebase/db';
import DailyFoodLog from '@/components/dashboard/DailyFoodLog';
import ActivityEntry from '@/components/dashboard/ActivityEntry';
import HealthInputsComponent from '@/components/dashboard/HealthInputs';
import MetricsDisplay from '@/components/dashboard/MetricsDisplay';
import Navigation from '@/components/Navigation';

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
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

const defaultHealth: HealthInputs = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  waterIntake: 0,
  fruitIntake: 0,
  greenTeaCount: 0,
  foodQualityScore: 3,
  faceStatus: 'normal',
  notes: '',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [date, setDate] = useState(getTodayDate());
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activity, setActivity] = useState<ActivityData>(defaultActivity);
  const [health, setHealth] = useState<HealthInputs>(defaultHealth);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadEntry();
    }
  }, [user, date, authLoading]);

  const loadEntry = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const entry = await getDailyEntry(user.uid, date);
      if (entry) {
        setFoodLogs(entry.foodLogs);
        setActivity(entry.activity);
        setHealth(entry.health);
      } else {
        // Reset to defaults for new date
        setFoodLogs([]);
        setActivity(defaultActivity);
        setHealth(defaultHealth);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showNotification = true) => {
    if (!user) return;

    setSaving(true);
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      const metrics = calculateMetrics(foodLogs, activity);
      const entry: DailyEntry = {
        id: `${user.uid}_${date}`,
        userId: user.uid,
        date,
        foodLogs,
        activity,
        health,
        metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveDailyEntry(entry);
      setLastSaved(new Date());
      setSaveStatus('saved');
      if (showNotification) {
        // Show a subtle notification
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setSaveStatus('unsaved');
      alert('Error saving entry. Please try again.');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  // Auto-save when data changes (with debounce)
  useEffect(() => {
    if (!user || loading) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      if (!savingRef.current && user) {
        // Auto-save without notification
        const currentUserId = user.uid;
        setSaving(true);
        savingRef.current = true;
        setSaveStatus('saving');
        try {
          const metrics = calculateMetrics(foodLogs, activity);
          const entry: DailyEntry = {
            id: `${currentUserId}_${date}`,
            userId: currentUserId,
            date,
            foodLogs,
            activity,
            health,
            metrics,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await saveDailyEntry(entry);
          setLastSaved(new Date());
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 1000);
        } catch (error) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodLogs, activity, health, date]);

  const metrics = calculateMetrics(foodLogs, activity);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
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
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Health Vitals Tracker
              </h1>
              <p className="mt-2 text-base text-gray-600">Monitor your daily nutrition, activity, and wellness metrics</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Date:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-sm text-gray-500 font-medium">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-sm text-green-600 font-medium">Saved</span>
                )}
                {lastSaved && saveStatus !== 'saving' && saveStatus !== 'saved' && (
                  <span className="text-xs text-gray-500 font-normal">
                    Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> You can update your entries throughout the day. Changes are automatically saved 3 seconds after you stop editing.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <DailyFoodLog foodLogs={foodLogs} onUpdate={setFoodLogs} />
          <ActivityEntry activity={activity} onUpdate={setActivity} />
          <HealthInputsComponent health={health} onUpdate={setHealth} />
          <MetricsDisplay metrics={metrics} />
        </div>
      </div>
      </div>
    </>
  );
}

