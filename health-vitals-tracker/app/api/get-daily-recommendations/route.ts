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

    // Extract foods
    const allFoods: string[] = [];
    entry.foodLogs?.forEach((log: any) => {
      if (log.customFoods && log.customFoods.length > 0) {
        log.customFoods.forEach((food: any) => {
          const foodDesc = food.amount && food.unit 
            ? `${food.name} (${food.amount} ${food.unit})`
            : food.name;
          allFoods.push(foodDesc);
        });
      }
    });

    const foodsList = allFoods.length > 0 ? allFoods.join(', ') : 'No foods logged';

    // Calculate sleep hours
    const wakeTime = entry.health?.wakeTime || '07:00';
    const sleepTime = entry.health?.sleepTime || '23:00';
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    const wakeMinutes = wakeHour * 60 + wakeMin;
    const sleepMinutes = sleepHour * 60 + sleepMin;
    let sleepHours = (sleepMinutes - wakeMinutes) / 60;
    if (sleepHours < 0) sleepHours += 24; // Handle overnight sleep

    const prompt = `Analyze the following daily health data and provide 3-5 specific, actionable recommendations for improvement. Be concise and practical.

Daily Data:
- Foods consumed: ${foodsList}
- Total calorie intake: ${entry.metrics?.totalIntake || 0} kcal
- Total calorie burn: ${entry.metrics?.totalBurn || 0} kcal
- Calorie deficit: ${entry.metrics?.calorieDeficit || 0} kcal
- Active calories: ${entry.activity?.activeCalories || 0} kcal
- Resting calories: ${entry.activity?.restingCalories || 0} kcal
- Workout time: ${entry.activity?.workoutTime?.strength || 0} min strength, ${entry.activity?.workoutTime?.cardio || 0} min cardio
- Sleep: ${sleepHours.toFixed(1)} hours (wake: ${wakeTime}, sleep: ${sleepTime})
- Water intake: ${entry.health?.waterIntake || 0} glasses
- Fruit intake: ${entry.health?.fruitIntake || 0} servings
- Green tea: ${entry.health?.greenTeaCount || 0} cups
- Food quality score: ${entry.health?.foodQualityScore || 3}/5
- Face status: ${entry.health?.faceStatus || 'normal'}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "Nutrition" | "Exercise" | "Sleep" | "Hydration" | "Overall",
      "title": "Brief title",
      "description": "Specific actionable advice",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Focus on:
- Specific improvements based on actual data
- Actionable steps the user can take tomorrow
- Balance between different health aspects
- Realistic and achievable goals

Respond with ONLY the JSON object, no other text.`;

    // Retry logic for rate limits
    let response: Response | null = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
              maxOutputTokens: 500,
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
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Try to parse JSON from response
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
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

