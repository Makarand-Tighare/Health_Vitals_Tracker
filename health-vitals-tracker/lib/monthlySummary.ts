import { DailyEntry } from '@/types';
import { calculateSleepHours } from './calculations';

export interface MonthlySummary {
  monthStart: string;
  monthEnd: string;
  totalDays: number;
  daysWithData: number;
  totalIntake: number;
  totalBurn: number;
  totalDeficit: number;
  averageIntake: number;
  averageBurn: number;
  averageDeficit: number;
  totalProtein: number;
  averageProtein: number;
  totalSleep: number;
  averageSleep: number;
  totalWater: number;
  averageWater: number;
  averageFoodQuality: number;
  bestDay?: {
    date: string;
    deficit: number;
  };
  worstDay?: {
    date: string;
    deficit: number;
  };
}

export function calculateMonthlySummary(entries: DailyEntry[]): MonthlySummary | null {
  if (entries.length === 0) return null;

  const sortedEntries = entries.sort((a, b) => a.date.localeCompare(b.date));
  const monthStart = sortedEntries[0].date;
  const monthEnd = sortedEntries[sortedEntries.length - 1].date;

  const totalIntake = entries.reduce((sum, entry) => sum + entry.metrics.totalIntake, 0);
  const totalBurn = entries.reduce((sum, entry) => sum + entry.metrics.totalBurn, 0);
  const totalDeficit = entries.reduce((sum, entry) => sum + entry.metrics.calorieDeficit, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + (entry.metrics.totalProtein || 0), 0);
  const totalSleep = entries.reduce((sum, entry) => {
    const sleepHours = calculateSleepHours(entry.health.wakeTime, entry.health.sleepTime);
    return sum + sleepHours;
  }, 0);
  const totalWater = entries.reduce((sum, entry) => sum + entry.health.waterIntake, 0);
  const totalFoodQuality = entries.reduce((sum, entry) => sum + entry.health.foodQualityScore, 0);

  const count = entries.length;

  // Find best and worst days by deficit
  let bestDay = entries[0];
  let worstDay = entries[0];
  entries.forEach(entry => {
    if (entry.metrics.calorieDeficit > bestDay.metrics.calorieDeficit) {
      bestDay = entry;
    }
    if (entry.metrics.calorieDeficit < worstDay.metrics.calorieDeficit) {
      worstDay = entry;
    }
  });

  // Calculate month span
  const startDate = new Date(monthStart);
  const endDate = new Date(monthEnd);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    monthStart,
    monthEnd,
    totalDays,
    daysWithData: count,
    totalIntake,
    totalBurn,
    totalDeficit,
    averageIntake: totalIntake / count,
    averageBurn: totalBurn / count,
    averageDeficit: totalDeficit / count,
    totalProtein,
    averageProtein: totalProtein / count,
    totalSleep,
    averageSleep: totalSleep / count,
    totalWater,
    averageWater: totalWater / count,
    averageFoodQuality: totalFoodQuality / count,
    bestDay: {
      date: bestDay.date,
      deficit: bestDay.metrics.calorieDeficit,
    },
    worstDay: {
      date: worstDay.date,
      deficit: worstDay.metrics.calorieDeficit,
    },
  };
}

