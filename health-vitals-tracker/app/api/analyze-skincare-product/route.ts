import { NextRequest, NextResponse } from 'next/server';

interface ProductInsight {
  goal: string;
  idealMoments: Array<'morning' | 'evening' | 'night' | 'any'>;
  frequency: 'daily' | 'alternate' | 'weekly';
  instructions: string[];
  caution?: string;
}

const tryParseJSON = (text: string): ProductInsight | null => {
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
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const { productName } = await request.json();

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'productName is required' },
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

    const prompt = `You are a licensed dermatologist. Analyze the skincare product "${productName}" and reply with STRICT JSON using this schema:
{
  "goal": "<what this product achieves in plain English>",
  "idealMoments": ["morning"|"evening"|"night"|"any", ...],
  "frequency": "daily"|"alternate"|"weekly",
  "instructions": ["concise actionable usage tip", "..."],
  "caution": "<optional warning or leave empty string>"
}

Rules:
- If product is a device or mask, set frequency to weekly unless common usage differs.
- Use "any" in idealMoments only if it can safely be used anytime.
- Keep goal under 120 characters.
- Provide 2-3 instruction bullets max.
- Return JSON only, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini skincare API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze product. Try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = tryParseJSON(cleaned);

    if (!parsed) {
      console.warn('Skincare AI returned invalid JSON:', cleaned);
      return NextResponse.json(
        {
          insight: {
            goal: 'General skin nourishment',
            idealMoments: ['any'],
            frequency: 'daily',
            instructions: [
              'Apply to clean, dry skin',
              'Layer with moisturizer afterwards',
            ],
          },
          warning: 'AI response was malformed. Showing default advice.',
        },
        { status: 200 }
      );
    }

    const normalized: ProductInsight = {
      goal: parsed.goal?.toString().slice(0, 200) || 'Skin maintenance step',
      idealMoments: Array.isArray(parsed.idealMoments) && parsed.idealMoments.length
        ? parsed.idealMoments.filter((m: string) =>
            ['morning', 'evening', 'night', 'any'].includes(m)
          )
        : ['any'],
      frequency: ['daily', 'alternate', 'weekly'].includes(parsed.frequency)
        ? parsed.frequency
        : 'daily',
      instructions: Array.isArray(parsed.instructions) && parsed.instructions.length
        ? parsed.instructions.map((tip: unknown) => String(tip).slice(0, 140)).slice(0, 3)
        : ['Use consistently for best results.'],
      caution: parsed.caution ? String(parsed.caution).slice(0, 200) : undefined,
    };

    return NextResponse.json({ insight: normalized });
  } catch (error) {
    console.error('Error analyzing skincare product:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product. Please try again.' },
      { status: 500 }
    );
  }
}

