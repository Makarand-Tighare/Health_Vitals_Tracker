import { NextRequest, NextResponse } from 'next/server';
import { FoodLog } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { foodLogs } = await request.json();

    if (!foodLogs || !Array.isArray(foodLogs)) {
      return NextResponse.json(
        { error: 'Food logs array is required' },
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

    // Extract all foods from food logs
    const allFoods: string[] = [];
    foodLogs.forEach((log: FoodLog) => {
      if (log.customFoods && log.customFoods.length > 0) {
        log.customFoods.forEach(food => {
          const foodDesc = food.amount && food.unit 
            ? `${food.name} (${food.amount} ${food.unit})`
            : food.name;
          allFoods.push(foodDesc);
        });
      }
    });

    if (allFoods.length === 0) {
      // No foods logged yet, return neutral score
      return NextResponse.json({
        score: 3,
        reasoning: 'No foods logged yet'
      });
    }

    const foodsList = allFoods.join(', ');
    const prompt = `Analyze the following foods consumed in a day and rate the overall food quality on a scale of 1-5, where:
- 1 = Very poor (mostly processed, high sugar, unhealthy)
- 2 = Poor (mostly unhealthy with few nutritious items)
- 3 = Moderate (mix of healthy and unhealthy)
- 4 = Good (mostly healthy, balanced nutrition)
- 5 = Excellent (very healthy, whole foods, balanced macros)

Foods consumed: ${foodsList}

Respond with ONLY a JSON object in this exact format:
{"score": <number 1-5>, "reasoning": "<brief explanation>"}

Do not include any other text, just the JSON object.`;

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
              temperature: 0.3,
              maxOutputTokens: 200,
            }
          }),
        }
      );

      if (response.ok) {
        break;
      }

      // Handle rate limit (429) with exponential backoff
      if (response.status === 429 && retries < maxRetries) {
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }

      // For other errors or max retries reached, break and handle error
      break;
    }

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error('Gemini API error:', errorData);
      
      // Provide more specific error messages
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
        { error: 'Failed to calculate food quality from AI. Please try again.' },
        { status: response?.status || 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Try to parse JSON from response
    let result;
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      // Fallback: try to extract just the score number
      const scoreMatch = responseText.match(/["']?score["']?\s*:\s*(\d)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
      result = {
        score: Math.max(1, Math.min(5, score)), // Clamp between 1-5
        reasoning: 'AI response parsing failed, using extracted score'
      };
    }

    // Validate and clamp score
    const score = Math.max(1, Math.min(5, Math.round(result.score || 3)));
    const reasoning = result.reasoning || 'Food quality analyzed';

    return NextResponse.json({
      score,
      reasoning
    });
  } catch (error) {
    console.error('Error calculating food quality:', error);
    return NextResponse.json(
      { error: 'Failed to calculate food quality. Please try again.' },
      { status: 500 }
    );
  }
}

