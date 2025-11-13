// Food item with calories
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  category?: string;
}

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'extra';

// Custom food entry
export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  amount?: number;
  unit?: string;
  isCustom: true;
}

// Daily food log entry
export interface FoodLog {
  mealType: MealType;
  selectedFoods: string[]; // Array of food IDs
  customFoods?: CustomFood[]; // Custom foods added by user
}

// Activity data
export interface ActivityData {
  activeCalories: number;
  restingCalories: number;
  totalBurn: number; // Calculated: active + resting
  workoutTime: {
    strength: number; // minutes
    cardio: number; // minutes
  };
}

// Daily health inputs
export interface HealthInputs {
  wakeTime: string; // HH:mm format
  sleepTime: string; // HH:mm format
  waterIntake: number; // glasses/cups
  fruitIntake: number; // servings
  greenTeaCount: number;
  foodQualityScore: number; // 1-5
  faceStatus: 'puffy' | 'dull' | 'normal' | 'bright';
  notes: string;
}

// Calculated metrics
export interface CalculatedMetrics {
  totalIntake: number; // Total calories from food
  totalBurn: number; // Active + Resting calories
  calorieDeficit: number; // Burn - Intake
  trend: 'good' | 'moderate' | 'bad'; // Based on deficit
}

// Complete daily entry
export interface DailyEntry {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  foodLogs: FoodLog[];
  activity: ActivityData;
  health: HealthInputs;
  metrics: CalculatedMetrics;
  createdAt?: Date;
  updatedAt?: Date;
}

// Weekly summary
export interface WeeklySummary {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  averageIntake: number;
  averageBurn: number;
  averageDeficit: number;
  averageSleep: number; // hours
  averageWater: number;
  averageFoodQuality: number;
  faceTrend: string; // Summary text
  notesSummary: string;
}

