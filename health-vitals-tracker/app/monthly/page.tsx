'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DailyEntry } from '@/types';
import { getEntriesInRange } from '@/lib/firebase/db';
import { calculateMonthlySummary, MonthlySummary } from '@/lib/monthlySummary';
import Navigation from '@/components/Navigation';

const getMonthStart = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const getMonthEnd = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

export default function MonthlyPage() {
  const { user, loading: authLoading } = useAuth();
  const [monthStart, setMonthStart] = useState(getMonthStart());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadMonthlyData();
    }
  }, [user, monthStart, authLoading]);

  const loadMonthlyData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const start = monthStart;
      const end = getMonthEnd(new Date(monthStart));
      const monthEntries = await getEntriesInRange(user.uid, start, end);
      setEntries(monthEntries);
      const monthlySummary = calculateMonthlySummary(monthEntries);
      setSummary(monthlySummary);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toFixed(decimals);
  };

  // Create calendar data
  const generateCalendar = () => {
    const year = parseInt(monthStart.substring(0, 4));
    const month = parseInt(monthStart.substring(5, 7)) - 1; // 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const calendar: (DailyEntry | null)[][] = [];
    let currentWeek: (DailyEntry | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Create a map of entries by date for quick lookup
    const entriesMap = new Map<string, DailyEntry>();
    entries.forEach(entry => {
      entriesMap.set(entry.date, entry);
    });

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = entriesMap.get(dateStr) || null;
      currentWeek.push(entry);

      // Start a new week if we've reached Sunday (day 6)
      if (currentWeek.length === 7) {
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining empty cells to complete the last week
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      calendar.push(currentWeek);
    }

    return calendar;
  };

  const calendar = generateCalendar();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Monthly Summary</h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">View your monthly health metrics and trends</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Month:</label>
                <input
                  type="month"
                  value={monthStart.substring(0, 7)}
                  onChange={(e) => setMonthStart(e.target.value + '-01')}
                  className="rounded-lg border border-gray-300 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
              </div>
            </div>
          </div>

          {summary ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Calendar View */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Calendar View</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">Daily metrics at a glance</p>
                </div>
                <div className="p-3 sm:p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Week day headers */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {weekDays.map((day) => (
                          <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {calendar.map((week, weekIndex) =>
                          week.map((entry, dayIndex) => {
                            const year = parseInt(monthStart.substring(0, 4));
                            const month = parseInt(monthStart.substring(5, 7)) - 1;
                            const firstDay = new Date(year, month, 1);
                            const startingDayOfWeek = firstDay.getDay();
                            
                            // Calculate actual day number
                            const dayNumber = weekIndex * 7 + dayIndex - startingDayOfWeek + 1;
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                            
                            if (!isValidDay) {
                              return <div key={`${weekIndex}-${dayIndex}`} className="aspect-square"></div>;
                            }

                            if (entry === null) {
                              return (
                                <div
                                  key={`${weekIndex}-${dayIndex}`}
                                  className="aspect-square rounded-lg border border-gray-100 bg-gray-50 p-1 sm:p-2 flex flex-col items-center justify-center"
                                >
                                  <div className="text-xs sm:text-sm font-medium text-gray-400">{dayNumber}</div>
                                </div>
                              );
                            }

                            const deficit = entry.metrics.calorieDeficit;
                            const deficitColor = deficit >= 500 ? 'bg-green-100 border-green-300' : 
                                                 deficit >= 200 ? 'bg-yellow-100 border-yellow-300' : 
                                                 'bg-red-100 border-red-300';

                            return (
                              <div
                                key={entry.date}
                                className={`aspect-square rounded-lg border-2 p-1 sm:p-2 flex flex-col ${deficitColor} hover:shadow-md transition-shadow cursor-pointer`}
                                title={`${entry.date}: Deficit: ${deficit} kcal, Intake: ${entry.metrics.totalIntake} kcal, Burn: ${entry.metrics.totalBurn} kcal`}
                              >
                                <div className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 sm:mb-1">
                                  {new Date(entry.date).getDate()}
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                                  <div className={`font-semibold ${deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {deficit >= 0 ? '+' : ''}{Math.round(deficit)}
                                  </div>
                                  <div className="text-gray-600 hidden sm:block">
                                    {Math.round(entry.metrics.totalIntake)}/{Math.round(entry.metrics.totalBurn)}
                                  </div>
                                  {entry.metrics.totalProtein && (
                                    <div className="text-blue-600 hidden sm:block font-medium">
                                      {Math.round(entry.metrics.totalProtein)}g
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                        <span className="text-gray-700">Good (≥500 kcal deficit)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                        <span className="text-gray-700">Moderate (200-499 kcal)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
                        <span className="text-gray-700">Needs Improvement (&lt;200 kcal)</span>
                      </div>
                      <div className="text-gray-500 ml-auto">
                        Format: Deficit | Intake/Burn | Protein
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Days Tracked</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {summary.daysWithData}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">of {summary.totalDays} days</div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Intake</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {formatNumber(summary.totalIntake)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">kcal ({formatNumber(summary.averageIntake)} avg/day)</div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Burn</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {formatNumber(summary.totalBurn)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">kcal ({formatNumber(summary.averageBurn)} avg/day)</div>
                </div>

                <div className={`rounded-lg border p-4 sm:p-5 shadow-sm ${
                  summary.totalDeficit >= 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Deficit</div>
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    summary.totalDeficit >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {summary.totalDeficit >= 0 ? '+' : ''}{formatNumber(summary.totalDeficit)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">kcal ({formatNumber(summary.averageDeficit)} avg/day)</div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Detailed Metrics</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Protein</div>
                      <div className="text-xl sm:text-2xl font-bold text-blue-700">
                        {formatNumber(summary.totalProtein, 1)}g
                      </div>
                      <div className="text-xs text-gray-500 mt-1">({formatNumber(summary.averageProtein, 1)}g avg/day)</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Sleep</div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-700">
                        {formatNumber(summary.totalSleep, 1)}h
                      </div>
                      <div className="text-xs text-gray-500 mt-1">({formatNumber(summary.averageSleep, 1)}h avg/day)</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Water</div>
                      <div className="text-xl sm:text-2xl font-bold text-cyan-700">
                        {formatNumber(summary.totalWater)} glasses
                      </div>
                      <div className="text-xs text-gray-500 mt-1">({formatNumber(summary.averageWater, 1)} avg/day)</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Food Quality</div>
                      <div className="text-xl sm:text-2xl font-bold text-green-700">
                        {formatNumber(summary.averageFoodQuality, 1)}/5
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Average score</div>
                    </div>

                    {summary.bestDay && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 sm:p-4">
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Best Day</div>
                        <div className="text-sm sm:text-base font-bold text-green-800">{summary.bestDay.date}</div>
                        <div className="text-xs text-green-600 mt-1">+{formatNumber(summary.bestDay.deficit)} kcal deficit</div>
                      </div>
                    )}

                    {summary.worstDay && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4">
                        <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Worst Day</div>
                        <div className="text-sm sm:text-base font-bold text-red-800">{summary.worstDay.date}</div>
                        <div className="text-xs text-red-600 mt-1">{formatNumber(summary.worstDay.deficit)} kcal deficit</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">
              No data available for this month.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

