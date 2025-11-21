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

    const prompt = `You are a meticulous nutrition analyst. Estimate the TOTAL calories (kcal), protein (g), and sodium (mg) for a single adult portion described below.

FOOD DESCRIPTION:
"${foodName}"

PORTION CONTEXT:
- Logged amount/unit: ${amount || 'unspecified'} ${unit || 'serving'}
- Treat the entire description as one full meal/plate for one adult unless quantities state otherwise.
- If multiple foods are listed (e.g., "sprouts sabji, chole, dal, salad, 3 chapati, rice"), break them into components, respect explicit counts (like "3 chapati"), and sum the nutrients.
- When quantities are missing, assume typical home-style Indian portions for one adult with moderate oil and salt usage (roughly 1-1.5g salt / 400-600mg sodium per cooked dish unless clearly high-sodium like pickles, packaged soups, instant noodles, processed meats).

RESPONSE FORMAT (JSON only):
{"calories": <number>, "protein": <number>, "sodium": <number>}

RULES:
- Always output sodium in milligrams (mg); when foods are home-made and no salty condiments are specified, keep sodium within realistic home-cooked ranges (350-900 mg per plate) unless ingredients justify more (e.g., pickles, soy sauce, packaged snacks).
- Base estimates on reliable nutrition references/GI tables or verified FSSAI/USDA data.
- Account for cooking mediums (oil, spices) implicitly but do not inflate sodium for ingredients that normally contribute fat/carbs instead of salt.
- Never include explanatory text or markdown; output just the JSON object.`;

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
      const sodiumMatch = responseText.match(/["']?sodium["']?\s*:\s*([\d.]+)/i);
      const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : null;
      const protein = proteinMatch ? parseFloat(proteinMatch[1]) : null;
      const sodium = sodiumMatch ? parseFloat(sodiumMatch[1]) : null;
      
      if (!calories || isNaN(calories)) {
        return NextResponse.json(
          { error: 'Could not parse calorie estimate from AI response. Please try again.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        calories,
        protein: protein !== null && !isNaN(protein) ? protein : undefined,
        sodium: sodium !== null && !isNaN(sodium) ? sodium : undefined,
        method: 'ai'
      });
    }

    const calories = result.calories ? parseInt(result.calories) : null;
    const protein = result.protein !== undefined && result.protein !== null ? parseFloat(result.protein) : undefined;
    const sodium = result.sodium !== undefined && result.sodium !== null ? parseFloat(result.sodium) : undefined;

    if (!calories || isNaN(calories)) {
      return NextResponse.json(
        { error: 'Could not parse calorie estimate from AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      calories,
      protein: protein !== undefined && !isNaN(protein) ? protein : undefined,
      sodium: sodium !== undefined && !isNaN(sodium) ? sodium : undefined,
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

