import { DailyEntry, WeeklySummary } from '@/types';
import { calculateSleepHours } from './calculations';

export function calculateWeeklySummary(entries: DailyEntry[]): WeeklySummary | null {
  if (entries.length === 0) return null;

  const sortedEntries = entries.sort((a, b) => a.date.localeCompare(b.date));
  const weekStart = sortedEntries[0].date;
  const weekEnd = sortedEntries[sortedEntries.length - 1].date;

  const totalIntake = entries.reduce((sum, entry) => sum + entry.metrics.totalIntake, 0);
  const totalBurn = entries.reduce((sum, entry) => sum + entry.metrics.totalBurn, 0);
  const totalDeficit = entries.reduce((sum, entry) => sum + entry.metrics.calorieDeficit, 0);
  const totalSleep = entries.reduce((sum, entry) => {
    const sleepHours = calculateSleepHours(entry.health.wakeTime, entry.health.sleepTime);
    return sum + sleepHours;
  }, 0);
  const totalWater = entries.reduce((sum, entry) => sum + entry.health.waterIntake, 0);
  const totalFoodQuality = entries.reduce((sum, entry) => sum + entry.health.foodQualityScore, 0);

  const count = entries.length;

  // Face trend analysis
  const faceCounts: Record<string, number> = {};
  entries.forEach(entry => {
    faceCounts[entry.health.faceStatus] = (faceCounts[entry.health.faceStatus] || 0) + 1;
  });
  const dominantFace = Object.entries(faceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const faceTrend = `Mostly ${dominantFace || 'normal'} (${faceCounts[dominantFace] || 0}/${count} days)`;

  // Notes summary (combine all notes)
  const notesSummary = entries
    .filter(entry => entry.health.notes.trim())
    .map(entry => `[${entry.date}]: ${entry.health.notes}`)
    .join('\n\n');

  return {
    weekStart,
    weekEnd,
    averageIntake: totalIntake / count,
    averageBurn: totalBurn / count,
    averageDeficit: totalDeficit / count,
    averageSleep: totalSleep / count,
    averageWater: totalWater / count,
    averageFoodQuality: totalFoodQuality / count,
    faceTrend,
    notesSummary: notesSummary || 'No notes for this week.',
  };
}

