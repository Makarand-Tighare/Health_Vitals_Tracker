import { NextRequest, NextResponse } from 'next/server';

interface RoutineStep {
  name: string;
  moment: 'morning' | 'evening' | 'night' | 'any';
  frequency: 'daily' | 'alternate' | 'weekly';
}

const tryParseJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { steps } = (await request.json()) as { steps: RoutineStep[] };
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one skincare step is required' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a dermatologist. Evaluate this skincare routine:
${JSON.stringify(steps, null, 2)}

Return STRICT JSON (no markdown) with schema:
{
  "verdict": "<short headline>",
  "positives": ["..."],
  "gaps": ["..."],
  "suggestions": [
    { "title": "<short action>", "detail": "<how to improve>" }
  ]
}

Rules:
- Mention if AM/PM balance is missing (e.g., sunscreen absent in AM, actives stacked in PM).
- Note frequency conflicts (e.g., multiple exfoliants daily).
- Max 3 bullets per section.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 600,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Skincare routine evaluation error:', errorData);
      return NextResponse.json(
        { error: 'Failed to evaluate routine. Try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = tryParseJSON(cleaned);

    if (!parsed) {
      console.warn('Routine AI returned invalid JSON:', cleaned);
      return NextResponse.json(
        {
          evaluation: {
            verdict: 'Unable to analyze',
            positives: [],
            gaps: [],
            suggestions: [],
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ evaluation: parsed });
  } catch (error) {
    console.error('Error evaluating routine:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate routine.' },
      { status: 500 }
    );
  }
}

