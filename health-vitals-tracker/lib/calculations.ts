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

// Calculate total protein from food logs
export function calculateTotalProtein(foodLogs: FoodLog[]): number {
  let total = 0;
  foodLogs.forEach(log => {
    // Add protein from custom foods
    if (log.customFoods) {
      log.customFoods.forEach(food => {
        if (food.protein !== undefined && food.protein !== null) {
          total += food.protein;
        }
      });
    }
  });
  return Math.round(total * 10) / 10; // Round to 1 decimal place
}

// Calculate total sodium from food logs
export function calculateTotalSodium(foodLogs: FoodLog[]): number {
  let total = 0;
  foodLogs.forEach(log => {
    if (log.customFoods) {
      log.customFoods.forEach(food => {
        if (food.sodium !== undefined && food.sodium !== null) {
          total += food.sodium;
        }
      });
    }
  });
  return Math.round(total); // Sodium is typically tracked as whole milligrams
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
  const totalProtein = calculateTotalProtein(foodLogs);
  const totalSodium = calculateTotalSodium(foodLogs);

  return {
    totalIntake,
    totalBurn,
    calorieDeficit,
    trend,
    totalProtein,
    totalSodium,
  };
}

// Calculate sleep hours from wake and sleep times
// sleepTime: time you go to sleep (e.g., "23:00" or "01:00")
// wakeTime: time you wake up (e.g., "07:00" or "09:00")
export function calculateSleepHours(wakeTime: string, sleepTime: string): number {
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
  
  let wakeMinutes = wakeHour * 60 + wakeMin;
  let sleepMinutes = sleepHour * 60 + sleepMin;
  
  // Handle overnight sleep: if sleep time is later in the day than wake time,
  // it means you slept overnight (e.g., sleep at 23:00, wake at 07:00)
  // If sleep time is earlier than wake time (e.g., sleep at 01:00, wake at 09:00),
  // it also means overnight sleep, but sleep time is the next day
  if (sleepMinutes > wakeMinutes) {
    // Sleep time is later in the day (e.g., 23:00 sleep, 07:00 wake)
    // Sleep duration = (24:00 - sleep) + wake = (1440 - sleep) + wake
    sleepMinutes = (24 * 60) - sleepMinutes + wakeMinutes;
  } else {
    // Sleep time is earlier in the day (e.g., 01:00 sleep, 09:00 wake)
    // This means you slept from 01:00 to 09:00 same day = 8 hours
    sleepMinutes = wakeMinutes - sleepMinutes;
  }
  
  return sleepMinutes / 60; // Convert to hours
}

