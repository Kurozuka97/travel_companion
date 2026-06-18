import { NextResponse } from 'next/server';

function parseJson(text: string): any[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.places && Array.isArray(parsed.places)) return parsed.places;
    return [];
  } catch {
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return []; }
    }
    return [];
  }
}

async function generateWithAI(query: string, apiKey: string, url: string, model: string, sourceName: string) {
  const prompt = `You are an expert Malaysia travel guide with deep local knowledge of every state and territory.

Generate 5-8 real, specific places in Malaysia for: "${query}"

Requirements:
- Include exact or approximate real addresses (street, city, state)
- Descriptions must be 2-3 sentences with specific details (what to do, best time to visit, local tips, price range if relevant)
- Categories: food, nature, shopping, history, entertainment
- Mix of famous and hidden gems
- Only real places that actually exist

Return ONLY a JSON array. No markdown, no explanation, no intro text.
Format: [{"name":"Place Name","address":"123 Street Name, City, State, Malaysia","description":"Detailed description with specific tips and what makes it special. Best visited in morning/evening.","category":"food|nature|shopping|history|entertainment"}]`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a Malaysia travel expert. Return ONLY valid JSON array of real places. No markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) throw new Error(`${sourceName} error ${res.status}`);
  
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const places = parseJson(content);
  
  if (places.length === 0) throw new Error(`${sourceName} empty result`);
  return { places, source: sourceName };
}

export async function POST(req: Request) {
  try {
    const { query, category } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Clean query
    const cleanQuery = query.trim();
    
    // Build enhanced prompt with category context
    let enhancedQuery = cleanQuery;
    if (category && category !== 'all') {
      enhancedQuery = `${category} in ${cleanQuery}`;
    }

    // AI-only generation — no web search, no local database
    let result: { places: any[]; source: string } | null = null;
    const errors: string[] = [];

    // Try Groq first (best free tier, best model)
    if (process.env.GROQ_API_KEY) {
      try {
        result = await generateWithAI(
          enhancedQuery, 
          process.env.GROQ_API_KEY, 
          'https://api.groq.com/openai/v1/chat/completions', 
          'llama-3.1-70b-versatile', 
          'Groq AI'
        );
      } catch (e: any) { errors.push(`Groq: ${e.message}`); }
    }

    // Fallback to OpenRouter
    if (!result && process.env.OPENROUTER_API_KEY) {
      try {
        result = await generateWithAI(
          enhancedQuery, 
          process.env.OPENROUTER_API_KEY, 
          'https://openrouter.ai/api/v1/chat/completions', 
          'mistralai/mistral-7b-instruct:free', 
          'OpenRouter'
        );
      } catch (e: any) { errors.push(`OpenRouter: ${e.message}`); }
    }

    // Fallback to Mistral direct
    if (!result && process.env.MISTRAL_API_KEY) {
      try {
        result = await generateWithAI(
          enhancedQuery, 
          process.env.MISTRAL_API_KEY, 
          'https://api.mistral.ai/v1/chat/completions', 
          'mistral-tiny', 
          'Mistral AI'
        );
      } catch (e: any) { errors.push(`Mistral: ${e.message}`); }
    }

    if (!result) {
      return NextResponse.json({
        places: [],
        source: 'none',
        query: enhancedQuery,
        count: 0,
        debug: {
          errors,
          hasGroqKey: !!process.env.GROQ_API_KEY,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasMistralKey: !!process.env.MISTRAL_API_KEY,
          message: 'No API keys configured or all AI services failed. Add GROQ_API_KEY to Vercel env vars.',
        }
      });
    }

    // Filter by category if specified
    let finalPlaces = result.places;
    if (category && category !== 'all') {
      finalPlaces = result.places.filter((p: any) => 
        p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      places: finalPlaces.slice(0, 12),
      source: result.source,
      query: enhancedQuery,
      count: finalPlaces.length,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { places: [], error: error.message || 'Internal server error', source: 'error' },
      { status: 500 }
    );
  }
}
