import { DailyEntry, WeeklyHighlight, WeeklySummary } from '@/types';
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
  const totalFruit = entries.reduce((sum, entry) => sum + (entry.health.fruitIntake || 0), 0);

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

  const wins: WeeklyHighlight[] = [];
  const focus: WeeklyHighlight[] = [];
  const avgWater = totalWater / count;
  const avgSleep = totalSleep / count;
  const avgFoodQuality = totalFoodQuality / count;
  const avgFruit = totalFruit / count;
  const avgDeficit = totalDeficit / count;

  const addWin = (title: string, description: string, metric: string) => {
    wins.push({ title, description, metric, trend: 'positive' });
  };

  const addFocus = (title: string, description: string, metric: string) => {
    focus.push({ title, description, metric, trend: 'negative' });
  };

  if (avgWater >= 8) {
    addWin('Hydration on track', `Averaged ${avgWater.toFixed(1)} glasses daily.`, 'Hydration');
  } else if (avgWater < 6) {
    addFocus('Drink more water', `Only ${avgWater.toFixed(1)} glasses per day. Aim for 8+.`, 'Hydration');
  }

  if (avgSleep >= 7.5) {
    addWin('Sleep rhythm solid', `${avgSleep.toFixed(1)} hours/night keeps recovery high.`, 'Sleep');
  } else if (avgSleep < 6.5) {
    addFocus('Protect sleep time', `${avgSleep.toFixed(1)} hours/night. Target 7.5+.`, 'Sleep');
  }

  if (avgDeficit >= 200) {
    addWin('Calorie deficit achieved', `Weekly deficit averaged ${avgDeficit.toFixed(0)} kcal/day.`, 'Energy');
  } else if (avgDeficit < 0) {
    addFocus('Watch portions', `In a surplus of ${Math.abs(avgDeficit).toFixed(0)} kcal/day.`, 'Energy');
  }

  if (avgFoodQuality >= 4) {
    addWin('Clean eating streak', `Food quality avg ${avgFoodQuality.toFixed(1)}/5.`, 'Food Quality');
  } else if (avgFoodQuality <= 3) {
    addFocus('Improve meal balance', `Food quality avg ${avgFoodQuality.toFixed(1)}/5. Add more whole foods.`, 'Food Quality');
  }

  if (avgFruit >= 2) {
    addWin('Fruit servings met', `${avgFruit.toFixed(1)} servings/day.`, 'Micronutrients');
  } else {
    addFocus('Add fruit fiber', `${avgFruit.toFixed(1)} servings/day. Aim for 2+.`, 'Micronutrients');
  }

  return {
    weekStart,
    weekEnd,
    averageIntake: totalIntake / count,
    averageBurn: totalBurn / count,
    averageDeficit: avgDeficit,
    averageSleep: avgSleep,
    averageWater: avgWater,
    averageFoodQuality: avgFoodQuality,
    faceTrend,
    notesSummary: notesSummary || 'No notes for this week.',
    wins,
    focus,
  };
}

