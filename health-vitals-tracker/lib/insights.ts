import { FoodLog, FruitInsights, FruitInsightMatch, FoodGuidance, FoodGuidanceItem, DailyEntry, WeeklyRecommendationContext, WeeklyContextDay } from '@/types';
import { calculateSleepHours } from './calculations';

type EnrichedFood = {
  displayName: string;
  normalized: string;
  calories: number;
  mealType?: FoodLog['mealType'];
  protein?: number;
};

const FRUIT_CLASSIFIERS = [
  { label: 'Banana', keywords: ['banana', 'kela'] },
  { label: 'Apple', keywords: ['apple', 'seb'] },
  { label: 'Orange', keywords: ['orange', 'santra', 'mandarin', 'kimia'] },
  { label: 'Mango', keywords: ['mango', 'aam'] },
  { label: 'Papaya', keywords: ['papaya'] },
  { label: 'Grapes', keywords: ['grape', 'draksh'] },
  { label: 'Pomegranate', keywords: ['pomegranate', 'anar'] },
  { label: 'Berry', keywords: ['berry', 'strawberry', 'blueberry', 'raspberry', 'blackberry'] },
  { label: 'Kiwi', keywords: ['kiwi'] },
  { label: 'Melon', keywords: ['melon', 'watermelon', 'muskmelon', 'kharbuja', 'tarbooz'] },
  { label: 'Pineapple', keywords: ['pineapple'] },
  { label: 'Guava', keywords: ['guava', 'amrood'] },
  { label: 'Dates', keywords: ['dates', 'date', 'khajoor'], baseServings: 0.5 },
  { label: 'Fruit Mix', keywords: ['fruit salad', 'fruit bowl', 'fruit mix', 'mixed fruit'] },
  { label: 'Generic Fruit', keywords: ['fruit'], baseServings: 1 },
  { label: 'Fruit Juice', keywords: ['juice', 'smoothie', 'shake'], baseServings: 0.5 },
];

const FRUIT_BLOCKLIST = ['cake', 'custard', 'ice cream', 'cream', 'pastry', 'cookie'];

const CATEGORY_PATTERNS = {
  leanProtein: ['chicken', 'fish', 'egg', 'egg white', 'paneer', 'tofu', 'soya', 'sprout', 'dal', 'lentil', 'rajma', 'chole', 'beans', 'yogurt', 'curd', 'dahi', 'greek yogurt', 'protein'],
  veggies: ['salad', 'sabji', 'bhaji', 'veg', 'vegetable', 'greens', 'palak', 'spinach', 'methi', 'beans', 'okra', 'bhindi', 'gourd', 'pumpkin', 'cabbage', 'cauliflower', 'broccoli', 'capsicum', 'carrot', 'beet', 'cucumber'],
  fried: ['fried', 'pakora', 'bhajiya', 'bhaji', 'poori', 'puri', 'vada', 'samosa', 'cutlet', 'manchurian', 'fries'],
  sweets: ['sweet', 'dessert', 'halwa', 'cake', 'pastry', 'jalebi', 'laddu', 'gulab jamun', 'rasgulla', 'peda', 'chocolate', 'brownie', 'ice cream', 'kheer', 'payasam'],
  refinedCarbs: ['white rice', 'rice', 'bread', 'bun', 'naan', 'paratha', 'pasta', 'pizza', 'burger', 'noodle', 'maggi', 'poha', 'upma'],
  wholeCarbs: ['brown rice', 'millet', 'jowar', 'bajra', 'ragi', 'oats', 'quinoa', 'multigrain', 'dalia'],
};

const POSITIVE_SUGGESTIONS = {
  protein: ['Grilled chicken/paneer', 'Sprouted moong salad', 'Greek yogurt bowl', 'Lentil & quinoa khichdi'],
  veggies: ['Mixed veggie sabji', 'Cucumber + carrot salad', 'Palak dal', 'Stir-fried beans/broccoli'],
  fruits: ['Seasonal fruit bowl', 'Citrus fruit after lunch', 'Mixed berries smoothie', 'Papaya or melon cubes'],
};

const LIMIT_SUGGESTIONS = {
  fried: ['Bake or air-fry snacks', 'Switch to roasted chana', 'Use sprouts chat instead of pakora'],
  sweets: ['Keep desserts to 2 bites', 'Swap sweets with fruit & yogurt', 'Use dates/coconut ladoo'],
  refinedCarbs: ['Swap white rice for millet', 'Prefer phulkas over naan', 'Add salad before carb-heavy meals'],
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const dedupeNames = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  items.forEach(item => {
    const trimmed = item.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  });
  return result;
};

export function analyzeFruitIntake(foodLogs: FoodLog[]): FruitInsights {
  const matches: FruitInsightMatch[] = [];
  const detectedFoods: string[] = [];
  let totalServings = 0;

  foodLogs.forEach(log => {
    log.customFoods?.forEach(food => {
      const name = food.name?.toLowerCase?.() || '';
      if (!name) return;
      if (FRUIT_BLOCKLIST.some(block => name.includes(block))) return;

      const classifier = FRUIT_CLASSIFIERS.find(item =>
        item.keywords.some(keyword => name.includes(keyword))
      );

      if (!classifier) return;

      const baseServings = classifier.baseServings ?? 1;
      const amount = typeof food.amount === 'number' && !isNaN(food.amount) ? food.amount : 1;
      const servings = clamp(amount * baseServings, 0.25, 3);

      matches.push({
        name: food.name,
        servings: Number(servings.toFixed(2)),
        mealType: log.mealType,
        confidence: classifier.label === 'Generic Fruit' ? 'medium' : 'high',
      });
      detectedFoods.push(food.name);
      totalServings += servings;
    });
  });

  return {
    servings: Number(totalServings.toFixed(2)),
    matches,
    detectedFoods: dedupeNames(detectedFoods),
  };
}

const matchesPattern = (name: string, patterns: string[]) =>
  patterns.some(pattern => name.includes(pattern));

const flattenFoods = (foodLogs: FoodLog[]): EnrichedFood[] => {
  return foodLogs.flatMap(log =>
    (log.customFoods || []).map(food => ({
      displayName: food.name || 'Custom food',
      normalized: food.name?.toLowerCase?.() || '',
      calories: food.calories,
      mealType: log.mealType,
      protein: food.protein,
    }))
  );
};

export function buildFoodGuidance(foodLogs: FoodLog[], fruitInsights?: FruitInsights): FoodGuidance {
  const enriched = flattenFoods(foodLogs);
  const mealsLogged = foodLogs.filter(log => log.customFoods && log.customFoods.length > 0).length;

  const totals = enriched.reduce(
    (acc, food) => {
      const normalized = food.normalized;
      if (matchesPattern(normalized, CATEGORY_PATTERNS.leanProtein)) {
        acc.leanProtein.push(food.displayName);
      }
      if (matchesPattern(normalized, CATEGORY_PATTERNS.veggies)) {
        acc.veggies.push(food.displayName);
      }
      if (matchesPattern(normalized, CATEGORY_PATTERNS.fried)) {
        acc.fried.push(food.displayName);
      }
      if (matchesPattern(normalized, CATEGORY_PATTERNS.sweets)) {
        acc.sweets.push(food.displayName);
      }
      if (matchesPattern(normalized, CATEGORY_PATTERNS.refinedCarbs)) {
        acc.refinedCarbs.push(food.displayName);
      }
      if (matchesPattern(normalized, CATEGORY_PATTERNS.wholeCarbs)) {
        acc.wholeCarbs.push(food.displayName);
      }
      acc.totalProtein += food.protein || 0;
      return acc;
    },
    {
      leanProtein: [] as string[],
      veggies: [] as string[],
      fried: [] as string[],
      sweets: [] as string[],
      refinedCarbs: [] as string[],
      wholeCarbs: [] as string[],
      totalProtein: 0,
    }
  );

  const eatMore: FoodGuidanceItem[] = [];
  const limit: FoodGuidanceItem[] = [];

  if (totals.totalProtein < 55 || totals.leanProtein.length < 2) {
    eatMore.push({
      title: 'Lean Protein Boost',
      detail: totals.leanProtein.length
        ? `Only ${Math.round(totals.totalProtein)}g protein logged (${dedupeNames(totals.leanProtein).join(', ')})`
        : 'No lean protein was detected in today’s meals.',
      suggestions: POSITIVE_SUGGESTIONS.protein,
      emphasis: `${Math.round(totals.totalProtein)}g protein`,
    });
  }

  if (totals.veggies.length < 2) {
    eatMore.push({
      title: 'Add Colorful Veggies',
      detail: totals.veggies.length
        ? `Only ${dedupeNames(totals.veggies).length} veggie-rich items logged.`
        : 'No salads or veggie sabjis detected.',
      suggestions: POSITIVE_SUGGESTIONS.veggies,
    });
  }

  if ((fruitInsights?.servings || 0) < 2) {
    eatMore.push({
      title: 'Bump Up Fruits',
      detail: fruitInsights && fruitInsights.detectedFoods.length > 0
        ? `Detected ${fruitInsights.detectedFoods.join(', ')} (~${fruitInsights.servings} servings).`
        : 'No fruit servings identified from today’s log.',
      suggestions: POSITIVE_SUGGESTIONS.fruits,
      emphasis: `${fruitInsights?.servings ?? 0} servings`,
    });
  }

  if (totals.fried.length > 0) {
    limit.push({
      title: 'Cut Back on Fried Snacks',
      detail: `Logged items: ${dedupeNames(totals.fried).join(', ')}.`,
      suggestions: LIMIT_SUGGESTIONS.fried,
    });
  }

  if (totals.sweets.length > 0) {
    limit.push({
      title: 'Trim Added Sugar',
      detail: `Dessert/sweet items: ${dedupeNames(totals.sweets).join(', ')}.`,
      suggestions: LIMIT_SUGGESTIONS.sweets,
    });
  }

  if (totals.refinedCarbs.length - totals.wholeCarbs.length >= 2) {
    limit.push({
      title: 'Balance Refined Carbs',
      detail: `Refined carbs dominated (${dedupeNames(totals.refinedCarbs).join(', ')}).`,
      suggestions: LIMIT_SUGGESTIONS.refinedCarbs,
    });
  }

  return {
    summary: {
      totalProtein: Math.round(totals.totalProtein),
      fruitServings: fruitInsights?.servings ?? 0,
      mealsLogged,
    },
    eatMore,
    limit,
  };
}

const formatRangeLabel = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const monthOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startLabel = startDate.toLocaleDateString(undefined, monthOptions);
  const endLabel = endDate.toLocaleDateString(undefined, monthOptions);
  if (sameMonth) {
    return `${startLabel} – ${endDate.getDate()}`;
  }
  return `${startLabel} – ${endLabel}`;
};

const getPreviousDate = (date: string): string => {
  const current = new Date(date);
  current.setDate(current.getDate() - 1);
  return current.toISOString().split('T')[0];
};

export function buildWeeklyContext(entries: DailyEntry[], currentDate: string): WeeklyRecommendationContext | null {
  if (!entries || entries.length === 0) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const weekStart = sorted[0].date;
  const weekEnd = sorted[sorted.length - 1].date;
  const count = sorted.length;

  const aggregates = sorted.reduce(
    (acc, entry) => {
      acc.intake += entry.metrics.totalIntake;
      acc.burn += entry.metrics.totalBurn;
      acc.water += entry.health.waterIntake;
      acc.sleep += calculateSleepHours(entry.health.wakeTime, entry.health.sleepTime);
      acc.foodQuality += entry.health.foodQualityScore;
      acc.fruit += entry.health.fruitIntake || 0;
      acc.timeline.push({
        date: entry.date,
        intake: entry.metrics.totalIntake,
        burn: entry.metrics.totalBurn,
        deficit: entry.metrics.calorieDeficit,
      });
      return acc;
    },
    {
      intake: 0,
      burn: 0,
      water: 0,
      sleep: 0,
      foodQuality: 0,
      fruit: 0,
      timeline: [] as WeeklyContextDay[],
    }
  );

  const averageIntake = aggregates.intake / count;
  const averageBurn = aggregates.burn / count;
  const averageWater = aggregates.water / count;
  const averageSleep = aggregates.sleep / count;
  const averageFoodQuality = aggregates.foodQuality / count;
  const averageFruit = aggregates.fruit / count;
  const averageDeficit = aggregates.timeline.reduce((sum, day) => sum + day.deficit, 0) / count;

  const trend: WeeklyRecommendationContext['trend'] =
    averageDeficit >= 250 ? 'deficit' : averageDeficit <= -150 ? 'surplus' : 'balanced';

  const missingHabits: string[] = [];
  if (averageWater < 8) missingHabits.push('Water < 8 glasses');
  if (averageSleep < 7) missingHabits.push('Sleep < 7 hrs');
  if (averageFoodQuality < 3.5) missingHabits.push('Food quality < 3.5');
  if (averageFruit < 2) missingHabits.push('Fruit servings < 2');

  const yesterdayDate = getPreviousDate(currentDate);
  const yesterday = aggregates.timeline.find(day => day.date === yesterdayDate);

  return {
    rangeLabel: formatRangeLabel(weekStart, weekEnd),
    daysTracked: count,
    averageIntake,
    averageBurn,
    averageWater,
    averageSleep,
    averageFoodQuality,
    averageFruit,
    trend,
    timeline: aggregates.timeline,
    yesterday,
    missingHabits,
  };
}

