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

    const prompt = `Estimate the calories in kcal for ${amount || '1'} ${unit || 'serving'} of ${foodName}. 
    Provide only a number (no text, no explanation, just the calorie count). 
    If the amount is not specified, assume 1 standard serving.`;

    const response = await fetch(
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
            temperature: 0.3,
            maxOutputTokens: 50,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to estimate calories from AI. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const caloriesText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const calories = parseInt(caloriesText.replace(/[^0-9]/g, ''));

    if (!calories || isNaN(calories)) {
      return NextResponse.json(
        { error: 'Could not parse calorie estimate from AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      calories,
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

