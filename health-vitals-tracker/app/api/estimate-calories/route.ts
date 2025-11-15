import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { foodName, amount, unit } = await request.json();

    if (!foodName) {
      return NextResponse.json(
        { error: 'Food name is required' },
        { status: 400 }
      );
    }

    // Use Google Gemini API to estimate calories
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Please add it to your environment variables.' },
        { status: 500 }
      );
    }

    const prompt = `Estimate the calories (in kcal) and protein (in grams) for ${amount || '1'} ${unit || 'serving'} of ${foodName}. 
    Respond with ONLY a JSON object in this exact format:
    {"calories": <number>, "protein": <number>}
    
    If the amount is not specified, assume 1 standard serving.
    Provide only the JSON object, no other text.`;

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
              maxOutputTokens: 100,
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
        { error: 'Failed to estimate calories from AI. Please try again.' },
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
      // Fallback: try to extract numbers
      const caloriesMatch = responseText.match(/["']?calories["']?\s*:\s*(\d+)/i);
      const proteinMatch = responseText.match(/["']?protein["']?\s*:\s*([\d.]+)/i);
      const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : null;
      const protein = proteinMatch ? parseFloat(proteinMatch[1]) : null;
      
      if (!calories || isNaN(calories)) {
        return NextResponse.json(
          { error: 'Could not parse calorie estimate from AI response. Please try again.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        calories,
        protein: protein !== null && !isNaN(protein) ? protein : undefined,
        method: 'ai'
      });
    }

    const calories = result.calories ? parseInt(result.calories) : null;
    const protein = result.protein !== undefined && result.protein !== null ? parseFloat(result.protein) : undefined;

    if (!calories || isNaN(calories)) {
      return NextResponse.json(
        { error: 'Could not parse calorie estimate from AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      calories,
      protein: protein !== undefined && !isNaN(protein) ? protein : undefined,
      method: 'ai'
    });
  } catch (error) {
    console.error('Error estimating calories:', error);
    return NextResponse.json(
      { error: 'Failed to estimate calories. Please try again.' },
      { status: 500 }
    );
  }
}

