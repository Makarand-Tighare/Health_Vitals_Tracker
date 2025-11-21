import { NextRequest, NextResponse } from 'next/server';
import { DailyEntry, FoodGuidance, FoodGuidanceItem } from '@/types';

interface GuidanceResponse {
  guidance: FoodGuidance;
}

const formatFoodList = (entry: DailyEntry) => {
  const foods: string[] = [];
  entry.foodLogs?.forEach(log => {
    log.customFoods?.forEach(food => {
      const parts: string[] = [food.name];
      if (food.amount && food.unit) {
        parts.push(`(${food.amount} ${food.unit})`);
      }
      parts.push(`${food.calories} kcal`);
      if (typeof food.protein === 'number') {
        parts.push(`${food.protein}g protein`);
      }
      parts.push(`meal: ${log.mealType}`);
      foods.push(parts.join(', '));
    });
  });
  return foods.length > 0 ? foods.join('; ') : 'No foods logged';
};

const safeNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const emptyGuidance: FoodGuidance = {
  summary: {
    totalProtein: 0,
    fruitServings: 0,
    mealsLogged: 0,
  },
  eatMore: [],
  limit: [],
};

const tryFixJSON = (text: string): GuidanceResponse | null => {
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to find first JSON object
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

const normalizeGuidanceItem = (item: unknown): FoodGuidanceItem | null => {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as { title?: unknown; detail?: unknown; suggestions?: unknown; emphasis?: unknown };
  if (!candidate.title || !candidate.detail || !Array.isArray(candidate.suggestions)) {
    return null;
  }
  return {
    title: String(candidate.title),
    detail: String(candidate.detail),
    suggestions: candidate.suggestions.map((s: unknown) => String(s)).filter(Boolean),
    emphasis: candidate.emphasis ? String(candidate.emphasis) : undefined,
  };
};

const normalizeGuidance = (payload: unknown): FoodGuidance | null => {
  if (!payload || typeof payload !== 'object') return null;
  const container = payload as {
    guidance?: {
      summary?: { totalProtein?: unknown; fruitServings?: unknown; mealsLogged?: unknown };
      eatMore?: unknown;
      limit?: unknown;
    };
  };
  if (!container.guidance) return null;
  const summary = container.guidance.summary || {};
  const eatMoreRaw = Array.isArray(container.guidance.eatMore) ? container.guidance.eatMore : [];
  const limitRaw = Array.isArray(container.guidance.limit) ? container.guidance.limit : [];

  const eatMore = eatMoreRaw
    .map(normalizeGuidanceItem)
    .filter((item): item is FoodGuidanceItem => Boolean(item));

  const limit = limitRaw
    .map(normalizeGuidanceItem)
    .filter((item): item is FoodGuidanceItem => Boolean(item));

  if (!eatMore.length && !limit.length) return null;

  return {
    summary: {
      totalProtein: safeNumber(summary.totalProtein),
      fruitServings: safeNumber(summary.fruitServings),
      mealsLogged: safeNumber(summary.mealsLogged),
    },
    eatMore,
    limit,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { entry, vegMode } = await request.json();

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

    const foodList = formatFoodList(entry);
    const metrics = entry.metrics || {};
    const summary = entry.health || {};
    const isVegMode = vegMode === true;

    const vegModeNote = isVegMode 
      ? '\n\nIMPORTANT: User is in VEG MODE. Only suggest vegetarian foods. Do NOT recommend any meat, fish, poultry, or seafood. Focus on plant-based proteins like paneer, tofu, dal, legumes, sprouts, etc.'
      : '';

    const prompt = `You are a precise nutrition coach. Analyze the user's logged meals and lifestyle data, critique problem areas, and provide food guidance that balances praise with clear fixes.

DATA SNAPSHOT
- Foods: ${foodList}
- Total intake: ${metrics.totalIntake || 0} kcal
- Total burn: ${metrics.totalBurn || 0} kcal
- Protein estimate: ${metrics.totalProtein || 'unknown'} g
- Sodium estimate: ${metrics.totalSodium ?? 'unknown'} mg
- Hydration: ${summary.waterIntake || 0} glasses
- Fruit servings (auto): ${summary.fruitIntake || 0}
- Face status: ${summary.faceStatus || 'normal'}
${vegModeNote}

TASK
1. Identify 2-3 things to double down on (protein, fiber, fruits, smart carbs, hydration, etc.) referencing the actual foods eaten.
2. Identify 2-3 things to pause/limit (fried, sugar, refined carbs, overeating, missing meals) referencing the actual foods.
3. Keep guidance hyper-specific with portion ideas or swaps (e.g., "Add 80g grilled paneer at lunch", "Swap poori for phulka + dal").
4. ${isVegMode ? 'ONLY suggest vegetarian options. Never recommend meat, fish, or poultry.' : ''}
5. Respect the JSON schema below. Do not include markdown, commentary, or extra keys.

Respond with JSON:
{
  "guidance": {
    "summary": {
      "totalProtein": number,
      "fruitServings": number,
      "mealsLogged": number
    },
    "eatMore": [
      { "title": string, "detail": string, "suggestions": [string, ...], "emphasis": string? }
    ],
    "limit": [
      { "title": string, "detail": string, "suggestions": [string, ...], "emphasis": string? }
    ]
  }
}

Rules:
- Title <= 7 words.
- Detail references concrete foods from the log.
- Suggestions must be actionable tactics (food swap, portion, timing).
- If no data is available, give generally healthy defaults but keep JSON structure identical.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait and try again.' },
          { status: 429 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get food guidance from AI. Please try again.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed =
      tryFixJSON(responseText) ||
      tryFixJSON(responseText.substring(responseText.indexOf('{'))) ||
      null;

    const normalized = normalizeGuidance(parsed);

    if (!normalized) {
      console.warn('AI returned unusable guidance. Falling back to empty state.');
      return NextResponse.json({ guidance: emptyGuidance });
    }

    return NextResponse.json({ guidance: normalized });
  } catch (error) {
    console.error('Error getting food guidance:', error);
    return NextResponse.json(
      { error: 'Failed to get food guidance. Please try again.' },
      { status: 500 }
    );
  }
}

