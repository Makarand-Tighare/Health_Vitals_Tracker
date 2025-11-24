'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DailyEntry, WeeklySummary } from '@/types';
import { getWeeklyEntries } from '@/lib/firebase/db';
import { calculateWeeklySummary } from '@/lib/weeklySummary';
import { calculateSleepHours } from '@/lib/calculations';
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
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [insights, setInsights] = useState<{
    overview: string;
    wins: string[];
    watchouts: string[];
    actions: { title: string; detail: string }[];
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

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
      setEntries(entries);
      setInsights(null);
      setSummary(weeklySummary);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeline = useMemo(() => {
    return entries.map(entry => ({
      date: entry.date,
      intake: entry.metrics.totalIntake,
      burn: entry.metrics.totalBurn,
      deficit: entry.metrics.calorieDeficit,
      sleep: entry.health ? Number(entry.health.sleepTime ? calculateSleepHours(entry.health.wakeTime, entry.health.sleepTime) : 0) : 0,
      water: entry.health?.waterIntake ?? 0,
      foodQuality: entry.health?.foodQualityScore ?? 0,
      fruit: entry.health?.fruitIntake ?? 0,
    }));
  }, [entries]);

  const handleGenerateInsights = async () => {
    if (!summary) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const response = await fetch('/api/get-weekly-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            summary: {
              weekStart: summary.weekStart,
              weekEnd: summary.weekEnd,
              averageIntake: summary.averageIntake,
              averageBurn: summary.averageBurn,
              averageDeficit: summary.averageDeficit,
              averageSleep: summary.averageSleep,
              averageWater: summary.averageWater,
              averageFoodQuality: summary.averageFoodQuality,
            },
            timeline,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Weekly AI insights error:', error);
      setInsightsError(error instanceof Error ? error.message : 'Unable to generate insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-4 sm:py-8">
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Weekly Summary</h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">View your weekly health trends and averages</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Week Start:</label>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateInsights}
                  disabled={insightsLoading || !summary}
                  className="rounded-lg bg-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {insightsLoading ? 'Analyzing...' : 'Generate AI Weekly Review'}
                </button>
              </div>
            </div>
          </div>

          {summary ? (
            <>
              <WeeklySummaryComponent summary={summary} />
              {insights && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">AI Weekly Review</h2>
                  <p className="mt-1 text-sm text-gray-700">{insights.overview}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-green-100 bg-green-50/60 p-4">
                      <h3 className="text-sm font-semibold text-green-800 mb-2">Wins</h3>
                      <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                        {insights.wins.map((item, index) => (
                          <li key={`win-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-red-100 bg-red-50/60 p-4">
                      <h3 className="text-sm font-semibold text-red-800 mb-2">Watchouts</h3>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                        {insights.watchouts.map((item, index) => (
                          <li key={`watchout-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {insights.actions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Next Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.actions.map((action, index) => (
                          <div key={`action-${index}`} className="rounded-lg border border-gray-200 p-3">
                            <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{action.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {insightsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {insightsError}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 text-center text-gray-600 shadow-sm">
              No data available for this week.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

