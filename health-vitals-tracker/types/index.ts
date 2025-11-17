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
  protein?: number; // Protein in grams
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
  blackCoffeeCount?: number; // cups
  foodQualityScore: number; // 1-5
  faceStatus: 'puffy' | 'dull' | 'normal' | 'bright';
  notes: string;
  vegMode?: boolean; // If true, don't suggest non-vegetarian foods
}

// Calculated metrics
export interface CalculatedMetrics {
  totalIntake: number; // Total calories from food
  totalBurn: number; // Active + Resting calories
  calorieDeficit: number; // Burn - Intake
  trend: 'good' | 'moderate' | 'bad'; // Based on deficit
  totalProtein?: number; // Total protein in grams
}

// AI Recommendation
export interface Recommendation {
  category: 'Nutrition' | 'Exercise' | 'Sleep' | 'Hydration' | 'Overall';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
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
  recommendations?: Recommendation[];
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

export interface FruitInsightMatch {
  name: string;
  servings: number;
  mealType?: MealType;
  confidence: 'high' | 'medium' | 'low';
}

export interface FruitInsights {
  servings: number;
  matches: FruitInsightMatch[];
  detectedFoods: string[];
}

export interface FoodGuidanceItem {
  title: string;
  detail: string;
  suggestions: string[];
  emphasis?: string;
}

export interface FoodGuidance {
  summary: {
    totalProtein: number;
    fruitServings: number;
    mealsLogged: number;
  };
  eatMore: FoodGuidanceItem[];
  limit: FoodGuidanceItem[];
}

export interface WeeklyContextDay {
  date: string;
  intake: number;
  burn: number;
  deficit: number;
}

export interface WeeklyRecommendationContext {
  rangeLabel: string;
  daysTracked: number;
  averageIntake: number;
  averageBurn: number;
  averageWater: number;
  averageSleep: number;
  averageFoodQuality: number;
  averageFruit: number;
  trend: 'deficit' | 'balanced' | 'surplus';
  timeline: WeeklyContextDay[];
  yesterday?: WeeklyContextDay;
  missingHabits: string[];
}

