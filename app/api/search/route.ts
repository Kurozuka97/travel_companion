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

// Remove duplicates by name (case insensitive)
function deduplicate(places: any[]): any[] {
  const seen = new Set<string>();
  return places.filter(p => {
    const key = p.name?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function generateWithAI(query: string, apiKey: string, url: string, model: string, sourceName: string): Promise<any[]> {
  const prompt = `You are an expert Malaysia travel guide with deep local knowledge of every state, city, and territory.

Generate 5-8 real, specific places in Malaysia for: "${query}"

Requirements:
- Include exact or approximate real addresses (street, city, state)
- Descriptions must be 2-3 sentences with specific details (what to do, best time, local tips)
- Categories: food, nature, shopping, history, entertainment
- Mix famous landmarks and hidden gems locals love
- Only real places that actually exist

Return ONLY a JSON array. No markdown, no explanation.
Format: [{"name":"Place Name","address":"123 Street, City, State, Malaysia","description":"Detailed description with specific tips.","category":"food|nature|shopping|history|entertainment"}]`;

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
  
  // Tag each place with its source
  return places.map((p: any) => ({ ...p, _source: sourceName }));
}

export async function POST(req: Request) {
  try {
    const { query, category } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const cleanQuery = query.trim();
    let enhancedQuery = cleanQuery;
    if (category && category !== 'all') {
      enhancedQuery = `${category} in ${cleanQuery}`;
    }

    // Call ALL 3 AI services in parallel
    const promises: Promise<any[]>[] = [];
    const errors: string[] = [];
    const activeSources: string[] = [];

    // Groq
    if (process.env.GROQ_API_KEY) {
      activeSources.push('Groq');
      promises.push(
        generateWithAI(enhancedQuery, process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 'Groq')
          .catch(e => { errors.push(`Groq: ${e.message}`); return []; })
      );
    }

    // OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      activeSources.push('OpenRouter');
      promises.push(
        generateWithAI(enhancedQuery, process.env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free', 'OpenRouter')
          .catch(e => { errors.push(`OpenRouter: ${e.message}`); return []; })
      );
    }

    // Mistral
    if (process.env.MISTRAL_API_KEY) {
      activeSources.push('Mistral');
      promises.push(
        generateWithAI(enhancedQuery, process.env.MISTRAL_API_KEY, 'https://api.mistral.ai/v1/chat/completions', 'mistral-tiny', 'Mistral')
          .catch(e => { errors.push(`Mistral: ${e.message}`); return []; })
      );
    }

    // Wait for ALL to finish (parallel)
    const results = await Promise.all(promises);

    // Combine all results
    let allPlaces: any[] = [];
    results.forEach(places => {
      allPlaces = allPlaces.concat(places);
    });

    // Remove duplicates
    allPlaces = deduplicate(allPlaces);

    // Filter by category
    if (category && category !== 'all') {
      allPlaces = allPlaces.filter((p: any) => 
        p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (allPlaces.length === 0) {
      return NextResponse.json({
        places: [],
        source: 'none',
        query: enhancedQuery,
        count: 0,
        debug: {
          errors,
          activeSources,
          hasGroqKey: !!process.env.GROQ_API_KEY,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasMistralKey: !!process.env.MISTRAL_API_KEY,
        }
      });
    }

    return NextResponse.json({
      places: allPlaces.slice(0, 15), // up to 15 combined results
      source: activeSources.join(' + '),
      query: enhancedQuery,
      count: allPlaces.length,
      perSource: results.map((r, i) => ({ source: activeSources[i], count: r.length })),
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { places: [], error: error.message || 'Internal server error', source: 'error' },
      { status: 500 }
    );
  }
}
