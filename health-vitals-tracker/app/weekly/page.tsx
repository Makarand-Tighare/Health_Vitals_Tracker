'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DailyEntry, WeeklySummary } from '@/types';
import { getWeeklyEntries } from '@/lib/firebase/db';
import { calculateWeeklySummary } from '@/lib/weeklySummary';
import WeeklySummaryComponent from '@/components/dashboard/WeeklySummary';
import Navigation from '@/components/Navigation';

const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export default function WeeklyPage() {
  const { user, loading: authLoading } = useAuth();
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadWeeklyData();
    }
  }, [user, weekStart, authLoading]);

  const loadWeeklyData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const entries = await getWeeklyEntries(user.uid, weekStart);
      const weeklySummary = calculateWeeklySummary(entries);
      setSummary(weeklySummary);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Weekly Summary</h1>
                <p className="mt-2 text-base text-gray-600">View your weekly health trends and averages</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Week Start:</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
              </div>
            </div>
          </div>

          {summary ? (
            <WeeklySummaryComponent summary={summary} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">
              No data available for this week.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

