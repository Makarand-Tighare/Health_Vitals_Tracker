import { FoodItem } from '@/types';

// Master food database with calorie values
export const FOOD_DATABASE: FoodItem[] = [
  // Breakfast items
  { id: 'poha', name: 'Poha', calories: 300, category: 'breakfast' },
  { id: 'dosa', name: 'Dosa', calories: 280, category: 'breakfast' },
  { id: 'idli', name: 'Idli', calories: 100, category: 'breakfast' },
  { id: 'upma', name: 'Upma', calories: 250, category: 'breakfast' },
  { id: 'paratha', name: 'Paratha', calories: 350, category: 'breakfast' },
  { id: 'bread-butter', name: 'Bread & Butter', calories: 200, category: 'breakfast' },
  { id: 'eggs', name: 'Eggs (2)', calories: 140, category: 'breakfast' },
  { id: 'oats', name: 'Oats', calories: 150, category: 'breakfast' },
  
  // Main dishes
  { id: 'chapati', name: 'Chapati', calories: 120, category: 'main' },
  { id: 'rice', name: 'Rice (1 cup)', calories: 200, category: 'main' },
  { id: 'chole', name: 'Chole', calories: 250, category: 'main' },
  { id: 'paneer-sabji', name: 'Paneer Sabji', calories: 350, category: 'main' },
  { id: 'dal', name: 'Dal', calories: 150, category: 'main' },
  { id: 'vegetable-sabji', name: 'Vegetable Sabji', calories: 200, category: 'main' },
  { id: 'chicken-curry', name: 'Chicken Curry', calories: 300, category: 'main' },
  { id: 'fish-curry', name: 'Fish Curry', calories: 250, category: 'main' },
  { id: 'biryani', name: 'Biryani', calories: 500, category: 'main' },
  { id: 'pulao', name: 'Pulao', calories: 350, category: 'main' },
  
  // Snacks
  { id: 'samosa', name: 'Samosa', calories: 250, category: 'snacks' },
  { id: 'pakora', name: 'Pakora', calories: 200, category: 'snacks' },
  { id: 'namkeen', name: 'Namkeen', calories: 150, category: 'snacks' },
  { id: 'biscuits', name: 'Biscuits (2)', calories: 100, category: 'snacks' },
  { id: 'nuts', name: 'Mixed Nuts (handful)', calories: 200, category: 'snacks' },
  { id: 'fruit', name: 'Fruit', calories: 80, category: 'snacks' },
  
  // Beverages
  { id: 'green-tea', name: 'Green Tea', calories: 2, category: 'beverages' },
  { id: 'coffee', name: 'Coffee', calories: 5, category: 'beverages' },
  { id: 'milk', name: 'Milk (1 cup)', calories: 150, category: 'beverages' },
  { id: 'juice', name: 'Fruit Juice', calories: 120, category: 'beverages' },
  
  // Desserts
  { id: 'ice-cream', name: 'Ice Cream', calories: 200, category: 'desserts' },
  { id: 'sweet', name: 'Indian Sweet', calories: 150, category: 'desserts' },
  { id: 'chocolate', name: 'Chocolate', calories: 100, category: 'desserts' },
];

// Helper function to get calories for a food item
export function getCaloriesForFood(foodId: string): number {
  const food = FOOD_DATABASE.find(item => item.id === foodId);
  return food?.calories || 0;
}

// Helper function to calculate total calories for selected foods
export function calculateTotalCalories(foodIds: string[]): number {
  return foodIds.reduce((total, foodId) => {
    return total + getCaloriesForFood(foodId);
  }, 0);
}

// Get foods by category
export function getFoodsByCategory(category?: string): FoodItem[] {
  if (!category) return FOOD_DATABASE;
  return FOOD_DATABASE.filter(item => item.category === category);
}

// Get all food names for display
export function getAllFoodNames(): string[] {
  return FOOD_DATABASE.map(item => item.name);
}

