import * as XLSX from 'xlsx';
import { DailyEntry } from '@/types';

export function exportToExcel(entries: DailyEntry[], filename: string = 'health-data') {
  // Prepare data for Excel
  const excelData = entries.map(entry => {
    // Calculate sleep hours
    const wakeTime = entry.health?.wakeTime || '07:00';
    const sleepTime = entry.health?.sleepTime || '23:00';
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    const wakeMinutes = wakeHour * 60 + wakeMin;
    const sleepMinutes = sleepHour * 60 + sleepMin;
    let sleepHours = (sleepMinutes - wakeMinutes) / 60;
    if (sleepHours < 0) sleepHours += 24;

    // Get all foods
    const allFoods = entry.foodLogs
      ?.flatMap(log => log.customFoods || [])
      .map(food => `${food.name}${food.amount ? ` (${food.amount} ${food.unit || ''})` : ''}`)
      .join('; ') || '';

    // Get recommendations
    const recommendations = entry.recommendations
      ?.map(rec => `${rec.title}: ${rec.description}`)
      .join(' | ') || '';

    return {
      Date: entry.date,
      'Total Calorie Intake': entry.metrics?.totalIntake || 0,
      'Active Calories': entry.activity?.activeCalories || 0,
      'Resting Calories': entry.activity?.restingCalories || 0,
      'Total Burn': entry.metrics?.totalBurn || 0,
      'Calorie Deficit': entry.metrics?.calorieDeficit || 0,
      'Trend': entry.metrics?.trend || '',
      'Strength Workout (min)': entry.activity?.workoutTime?.strength || 0,
      'Cardio Workout (min)': entry.activity?.workoutTime?.cardio || 0,
      'Wake Time': entry.health?.wakeTime || '',
      'Sleep Time': entry.health?.sleepTime || '',
      'Sleep Hours': sleepHours.toFixed(1),
      'Water Intake (glasses)': entry.health?.waterIntake || 0,
      'Fruit Intake (servings)': entry.health?.fruitIntake || 0,
      'Green Tea Count': entry.health?.greenTeaCount || 0,
      'Food Quality Score': entry.health?.foodQualityScore || 0,
      'Face Status': entry.health?.faceStatus || '',
      'Foods Consumed': allFoods,
      'Notes': entry.health?.notes || '',
      'Recommendations': recommendations,
    };
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Data');

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 18 }, // Total Calorie Intake
    { wch: 15 }, // Active Calories
    { wch: 16 }, // Resting Calories
    { wch: 12 }, // Total Burn
    { wch: 15 }, // Calorie Deficit
    { wch: 10 }, // Trend
    { wch: 20 }, // Strength Workout
    { wch: 18 }, // Cardio Workout
    { wch: 12 }, // Wake Time
    { wch: 12 }, // Sleep Time
    { wch: 12 }, // Sleep Hours
    { wch: 20 }, // Water Intake
    { wch: 22 }, // Fruit Intake
    { wch: 16 }, // Green Tea Count
    { wch: 18 }, // Food Quality Score
    { wch: 12 }, // Face Status
    { wch: 50 }, // Foods Consumed
    { wch: 40 }, // Notes
    { wch: 60 }, // Recommendations
  ];
  worksheet['!cols'] = columnWidths;

  // Generate filename with current date
  const today = new Date().toISOString().split('T')[0];
  const exportFilename = `${filename}-${today}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, exportFilename);
}

