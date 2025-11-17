import { NextRequest, NextResponse } from 'next/server';
import { DailyEntry } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { entry } = await request.json();

    if (!entry) {
      return NextResponse.json(
        { error: 'Daily entry is required' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Please add it to your environment variables.' },
        { status: 500 }
      );
    }

    // Extract foods with details
    const allFoods: string[] = [];
    entry.foodLogs?.forEach((log: any) => {
      if (log.customFoods && log.customFoods.length > 0) {
        log.customFoods.forEach((food: any) => {
          const foodDesc = food.amount && food.unit 
            ? `${food.name} (${food.amount} ${food.unit}, ${food.calories} kcal${food.protein ? `, ${food.protein}g protein` : ''})`
            : `${food.name} (${food.calories} kcal${food.protein ? `, ${food.protein}g protein` : ''})`;
          allFoods.push(foodDesc);
        });
      }
    });

    const foodsList = allFoods.length > 0 ? allFoods.join('; ') : 'No foods logged';

    // Calculate sleep hours using the same logic as calculateSleepHours
    const wakeTime = entry.health?.wakeTime || '07:00';
    const sleepTime = entry.health?.sleepTime || '23:00';
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    const wakeMinutes = wakeHour * 60 + wakeMin;
    let sleepMinutes = sleepHour * 60 + sleepMin;
    
    // Handle overnight sleep correctly
    if (sleepMinutes > wakeMinutes) {
      // Sleep time is later in the day (e.g., 23:00 sleep, 07:00 wake)
      sleepMinutes = (24 * 60) - sleepMinutes + wakeMinutes;
    } else {
      // Sleep time is earlier in the day (e.g., 01:00 sleep, 09:00 wake)
      sleepMinutes = wakeMinutes - sleepMinutes;
    }
    const sleepHours = sleepMinutes / 60;

    // Check for vegetarian mode
    const isVegMode = entry.health?.vegMode === true;
    const vegModeNote = isVegMode
      ? '\n\nCRITICAL: USER IS IN VEGETARIAN MODE. You MUST ONLY suggest vegetarian foods. NEVER recommend meat, fish, poultry, seafood, or any animal products. Only suggest plant-based proteins like paneer, tofu, dal, legumes, sprouts, chickpeas, beans, lentils, etc. If you mention protein sources, use ONLY vegetarian options.'
      : '';

    const prompt = `You are a critical health coach analyzing daily food intake and lifestyle. Be direct, specific, and constructive about what went wrong and how to improve.

Daily Data:
- Foods consumed: ${foodsList}
- Total calorie intake: ${entry.metrics?.totalIntake || 0} kcal
- Total calorie burn: ${entry.metrics?.totalBurn || 0} kcal
- Calorie deficit: ${entry.metrics?.calorieDeficit || 0} kcal
- Active calories: ${entry.activity?.activeCalories || 0} kcal
- Resting calories: ${entry.activity?.restingCalories || 0} kcal
- Workout time: ${entry.activity?.workoutTime?.strength || 0} min strength, ${entry.activity?.workoutTime?.cardio || 0} min cardio
- Sleep: ${sleepHours.toFixed(1)} hours (sleep at ${sleepTime}, wake at ${wakeTime})
- Water intake: ${entry.health?.waterIntake || 0} glasses
- Fruit intake: ${entry.health?.fruitIntake || 0} servings
- Green tea: ${entry.health?.greenTeaCount || 0} cups
- Black coffee: ${entry.health?.blackCoffeeCount || 0} cups
- Food quality score: ${entry.health?.foodQualityScore || 3}/5
- Face status: ${entry.health?.faceStatus || 'normal'}

CRITICALLY ANALYZE:
1. **Food Quality Issues**: Identify specific unhealthy foods, processed items, high-sugar foods, or nutritional gaps. Name the problematic foods and explain why they're problematic.
2. **Nutritional Imbalances**: Point out missing nutrients (protein, fiber, vitamins), excessive calories, or poor macro distribution.
3. **Lifestyle Problems**: Identify issues with sleep duration/quality, hydration, exercise, or meal timing.
4. **What Went Wrong**: Be specific about mistakes - e.g., "You ate too many processed snacks (X items), lacked protein (only Y grams), and had insufficient sleep (Z hours)."
5. **How to Improve**: Provide concrete, actionable steps with specific food swaps, additions, or behavioral changes.${isVegMode ? ' IMPORTANT: When suggesting protein sources or food additions, ONLY suggest vegetarian options like paneer, tofu, dal, legumes, sprouts, chickpeas, beans, lentils, nuts, seeds. NEVER suggest meat, fish, poultry, or seafood.' : ''}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "Nutrition" | "Exercise" | "Sleep" | "Hydration" | "Overall",
      "title": "Specific issue title (e.g., 'Replace Processed Snacks with Whole Foods')",
      "description": "Detailed explanation: What went wrong with specific examples from their food list, and exactly how to fix it tomorrow with specific food suggestions or swaps.",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Requirements:
- Be critical but constructive - point out real problems
- Reference specific foods from their list when criticizing
- Provide specific food replacements or additions${isVegMode ? ' (ONLY vegetarian options - paneer, tofu, dal, legumes, sprouts, chickpeas, beans, lentils, etc. NO meat, fish, or poultry)' : ' (e.g., "Replace chips with almonds" or "Add 100g grilled chicken breast")'}
- Focus on actionable, immediate changes
- Prioritize issues that will have the biggest health impact
${vegModeNote}

Respond with ONLY the JSON object, no other text.`;

    // Retry logic for rate limits
    let response: Response | null = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1500, // Increased to handle longer, detailed recommendations
            }
          }),
        }
      );

      if (response.ok) {
        break;
      }

      // Handle rate limit (429) with exponential backoff
      if (response.status === 429 && retries < maxRetries) {
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error('Gemini API error:', errorData);
      
      if (response?.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            retryAfter: true
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to get recommendations from AI. Please try again.' },
        { status: response?.status || 500 }
      );
    }

    const data = await response.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Helper function to attempt to fix incomplete JSON
    const tryFixIncompleteJSON = (text: string): string | null => {
      try {
        // Try to find the start of JSON object
        const startIdx = text.indexOf('{');
        if (startIdx === -1) return null;
        
        let jsonText = text.substring(startIdx);
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escapeNext = false;
        let lastValidPos = -1;
        
        // Count braces and brackets to find where JSON might be incomplete
        for (let i = 0; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') openBraces++;
            if (char === '}') openBraces--;
            if (char === '[') openBrackets++;
            if (char === ']') openBrackets--;
            
            // If we have a complete object/array structure, mark as valid
            if (openBraces === 0 && openBrackets === 0) {
              lastValidPos = i + 1;
            }
          }
        }
        
        // If we found a complete JSON structure, use it
        if (lastValidPos > 0) {
          return jsonText.substring(0, lastValidPos);
        }
        
        // Otherwise, try to close incomplete JSON
        if (openBraces > 0 || openBrackets > 0) {
          // Remove incomplete last item if it looks cut off
          jsonText = jsonText.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
          jsonText = jsonText.replace(/,\s*\{[^}]*$/, '');
          
          // Close brackets and braces
          while (openBrackets > 0) {
            jsonText += ']';
            openBrackets--;
          }
          while (openBraces > 0) {
            jsonText += '}';
            openBraces--;
          }
          
          return jsonText;
        }
        
        return jsonText;
      } catch {
        return null;
      }
    };
    
    // Try to parse JSON from response
    let result;
    try {
      // First try to find JSON object
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let jsonText = jsonMatch ? jsonMatch[0] : null;
      
      // If no match or parsing fails, try to fix incomplete JSON
      if (!jsonText) {
        const fixed = tryFixIncompleteJSON(responseText);
        if (fixed) jsonText = fixed;
      }
      
      if (jsonText) {
        try {
          result = JSON.parse(jsonText);
        } catch {
          // Try fixing incomplete JSON
          const fixed = tryFixIncompleteJSON(responseText);
          if (fixed) {
            try {
              result = JSON.parse(fixed);
            } catch {
              throw new Error('Could not parse or fix JSON');
            }
          } else {
            throw new Error('Could not parse JSON');
          }
        }
      } else {
        // Try to find JSON array if object not found
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          result = { recommendations: JSON.parse(arrayMatch[0]) };
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      // Validate that we have recommendations
      if (!result.recommendations || !Array.isArray(result.recommendations)) {
        throw new Error('Invalid recommendations format');
      }
      
      // Filter out any incomplete recommendations (missing required fields)
      result.recommendations = result.recommendations.filter((rec: any) => 
        rec.category && rec.title && rec.description && rec.priority
      );
      
      // If all recommendations were filtered out, throw error
      if (result.recommendations.length === 0) {
        throw new Error('No valid recommendations found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      console.error('Parse error:', parseError);
      // Fallback recommendations
      result = {
        recommendations: [
          {
            category: 'Overall',
            title: 'Continue Tracking',
            description: 'Keep logging your daily data to get personalized recommendations.',
            priority: 'medium'
          }
        ]
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations. Please try again.' },
      { status: 500 }
    );
  }
}

