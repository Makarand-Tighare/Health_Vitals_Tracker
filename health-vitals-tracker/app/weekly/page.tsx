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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Weekly Summary</h1>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
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

