import { FoodLog, ActivityData, CalculatedMetrics } from '@/types';
import { calculateTotalCalories } from './foodDatabase';

// Calculate total intake from food logs
export function calculateTotalIntake(foodLogs: FoodLog[]): number {
  let total = 0;
  foodLogs.forEach(log => {
    // Add calories from custom foods (AI estimated)
    if (log.customFoods) {
      log.customFoods.forEach(food => {
        total += food.calories;
      });
    }
  });
  return total;
}

// Calculate total burn from activity data
export function calculateTotalBurn(activity: ActivityData): number {
  return activity.activeCalories + activity.restingCalories;
}

// Calculate calorie deficit
export function calculateDeficit(intake: number, burn: number): number {
  return burn - intake;
}

// Determine trend based on deficit
export function determineTrend(deficit: number): 'good' | 'moderate' | 'bad' {
  if (deficit >= 500) return 'good';
  if (deficit >= 200) return 'moderate';
  return 'bad';
}

// Calculate all metrics
export function calculateMetrics(
  foodLogs: FoodLog[],
  activity: ActivityData
): CalculatedMetrics {
  const totalIntake = calculateTotalIntake(foodLogs);
  const totalBurn = calculateTotalBurn(activity);
  const calorieDeficit = calculateDeficit(totalIntake, totalBurn);
  const trend = determineTrend(calorieDeficit);

  return {
    totalIntake,
    totalBurn,
    calorieDeficit,
    trend,
  };
}

// Calculate sleep hours from wake and sleep times
export function calculateSleepHours(wakeTime: string, sleepTime: string): number {
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
  
  let wakeMinutes = wakeHour * 60 + wakeMin;
  let sleepMinutes = sleepHour * 60 + sleepMin;
  
  // Handle overnight sleep (sleep time is next day)
  if (sleepMinutes < wakeMinutes) {
    sleepMinutes += 24 * 60; // Add 24 hours
  }
  
  const sleepDuration = sleepMinutes - wakeMinutes;
  return sleepDuration / 60; // Convert to hours
}

