import { NextRequest, NextResponse } from 'next/server';

interface WeeklyInsightPayload {
  summary: {
    weekStart: string;
    weekEnd: string;
    averageIntake: number;
    averageBurn: number;
    averageDeficit: number;
    averageSleep: number;
    averageWater: number;
    averageFoodQuality: number;
  };
  timeline: Array<{
    date: string;
    intake: number;
    burn: number;
    deficit: number;
    sleep: number;
    water: number;
    foodQuality: number;
    fruit: number;
  }>;
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
    const body = (await request.json()) as { data: WeeklyInsightPayload };
    if (!body?.data) {
      return NextResponse.json(
        { error: 'Weekly data payload is required' },
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

    const prompt = `You are a performance coach analyzing a 7-day health log.
DATA:
${JSON.stringify(body.data, null, 2)}

Respond ONLY with JSON in this exact schema:
{
  "overview": "<2-sentence recap>",
  "wins": ["<bullet>", "..."],
  "watchouts": ["<bullet>", "..."],
  "actions": [
    { "title": "<short action>", "detail": "<how to do it>" }
  ]
}

Rules:
- Use data-driven references (e.g., "Averaged 5.5h sleep", "Two days over 2300 kcal").
- Max 3 bullets per section.
- Titles <= 6 words.
- No markdown, no code fences.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini weekly insights error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch weekly insights. Try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = tryParseJSON(cleaned);

    if (!parsed) {
      console.warn('Weekly AI returned invalid JSON:', cleaned);
      return NextResponse.json(
        {
          insights: {
            overview: 'Unable to generate AI insights right now.',
            wins: [],
            watchouts: [],
            actions: [],
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ insights: parsed });
  } catch (error) {
    console.error('Error getting weekly insights:', error);
    return NextResponse.json(
      { error: 'Failed to get weekly insights.' },
      { status: 500 }
    );
  }
}

