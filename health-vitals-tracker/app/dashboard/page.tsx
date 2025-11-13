'use client';

import { useState, useEffect } from 'react';
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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
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
      alert('Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Health Vitals Tracker
            </h1>
            <p className="mt-1 text-sm text-gray-600">Track your daily health metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-2.5 font-medium text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : '💾 Save Entry'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
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

