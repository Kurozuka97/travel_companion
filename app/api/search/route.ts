import { NextResponse } from 'next/server';

// Hardcoded fallback data for common Malaysia searches
const fallbackData: Record<string, any[]> = {
  'nasi lemak': [
    { name: 'Village Park Restaurant', address: '5, Jalan SS21/37, Damansara Utama, Petaling Jaya', description: 'Famous for their crispy fried chicken nasi lemak. Long queues but worth the wait.', category: 'food' },
    { name: 'Nasi Lemak Antarabangsa', address: '4, Jalan Raja Muda Musa, Kampung Baru, Kuala Lumpur', description: 'Iconic spot in Kampung Baru serving classic nasi lemak since 1973.', category: 'food' },
    { name: 'Nasi Lemak Bumbung', address: '6, Jalan 21/11b, Sea Park, Petaling Jaya', description: 'Popular late-night nasi lemak spot with smoky sambal and fried chicken.', category: 'food' },
    { name: 'Nasi Lemak Wanjo', address: '8, Jalan Raja Muda Musa, Kampung Baru, Kuala Lumpur', description: 'Another Kampung Baru legend known for rich sambal and tender rendang.', category: 'food' },
  ],
  'langkawi': [
    { name: 'Pantai Cenang', address: 'Pantai Cenang, Langkawi', description: 'Most popular beach with water sports, beach bars, and sunset views.', category: 'nature' },
    { name: 'Sky Bridge', address: 'Langkawi Cable Car, Oriental Village, Langkawi', description: 'Iconic curved bridge 660m above sea level with panoramic island views.', category: 'nature' },
    { name: 'Kilim Geoforest Park', address: 'Kilim, Langkawi', description: 'Mangrove boat tours, eagle feeding, and limestone cave exploration.', category: 'nature' },
    { name: 'Tanjung Rhu Beach', address: 'Tanjung Rhu, Langkawi', description: 'Secluded beach with crystal clear water and stunning sunset views.', category: 'nature' },
  ],
  'penang': [
    { name: 'George Town', address: 'George Town, Penang', description: 'UNESCO World Heritage Site with street art, colonial architecture, and hawker food.', category: 'history' },
    { name: 'Penang Hill', address: 'Bukit Bendera, Air Itam, Penang', description: 'Cool hill station with panoramic views, hiking trails, and The Habitat.', category: 'nature' },
    { name: 'Gurney Drive Hawker Centre', address: 'Gurney Drive, Penang', description: 'Famous open-air food court with char kway teow, laksa, and oyster omelette.', category: 'food' },
    { name: 'Kek Lok Si Temple', address: 'Air Itam, Penang', description: 'Largest Buddhist temple in Malaysia with the iconic 7-story Pagoda of Ten Thousand Buddhas.', category: 'history' },
  ],
  'kl': [
    { name: 'Petronas Twin Towers', address: 'Kuala Lumpur City Centre, KL', description: 'Iconic 88-floor twin skyscrapers with skybridge and observation deck.', category: 'entertainment' },
    { name: 'Batu Caves', address: 'Gombak, Kuala Lumpur', description: 'Limestone hill with Hindu temples, giant Murugan statue, and 272 colorful steps.', category: 'history' },
    { name: 'Jalan Alor', address: 'Bukit Bintang, Kuala Lumpur', description: 'Famous street food paradise open late night with hundreds of hawker stalls.', category: 'food' },
    { name: 'Central Market', address: 'Jalan Hang Kasturi, Kuala Lumpur', description: 'Heritage building turned arts and crafts market with local souvenirs.', category: 'shopping' },
  ],
  'melaka': [
    { name: 'Jonker Street', address: 'Jalan Hang Jebat, Melaka', description: 'Historic street with Peranakan shophouses, night market, and famous chicken rice balls.', category: 'history' },
    { name: 'A Famosa', address: 'Jalan Kota, Bandar Hilir, Melaka', description: '16th-century Portuguese fortress remains, one of the oldest European structures in Asia.', category: 'history' },
    { name: 'Christ Church Melaka', address: 'Dutch Square, Bandar Hilir, Melaka', description: '18th-century Dutch colonial church with distinctive red exterior.', category: 'history' },
  ],
  'cameron': [
    { name: 'Boh Tea Plantation', address: 'Brinchang, Cameron Highlands', description: 'Vast tea estates with factory tours, scenic views, and tea house.', category: 'nature' },
    { name: 'Cameron Lavender Garden', address: 'Tringkap, Cameron Highlands', description: 'Colorful lavender and flower gardens with strawberry picking nearby.', category: 'nature' },
    { name: 'Mossy Forest', address: 'Gunung Brinchang, Cameron Highlands', description: 'Enchanting cloud forest with boardwalk trails through ancient moss-covered trees.', category: 'nature' },
  ],
};

// Search DuckDuckGo
async function searchDuckDuckGo(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error('DuckDuckGo failed');
    return await res.text();
  } catch (e) {
    const res = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      }
    );
    return await res.text();
  }
}

function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.substring(0, 8000);
}

function parseJsonFromText(text: string): any[] {
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

async function extractWithAI(searchText: string, apiKey: string, url: string, model: string, sourceName: string) {
  const systemPrompt = `Extract places in Malaysia from the text. Return ONLY a JSON array: [{"name":"...","address":"...","description":"...","category":"food|nature|shopping|history|entertainment"}]. No markdown, no explanation.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: searchText.substring(0, 6000) },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`${sourceName} API error: ${res.status}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const places = parseJsonFromText(content);

  if (places.length === 0) throw new Error(`${sourceName} returned empty places`);
  return { places, source: sourceName };
}

export async function POST(req: Request) {
  try {
    const { query, category } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchQuery = category 
      ? `best ${category} places in Malaysia ${query}`
      : `best places in Malaysia ${query}`;

    // Check fallback data first
    const queryLower = query.toLowerCase();
    for (const [key, places] of Object.entries(fallbackData)) {
      if (queryLower.includes(key)) {
        return NextResponse.json({
          places: category 
            ? places.filter(p => p.category === category)
            : places,
          source: 'Local Database',
          query: searchQuery,
          count: places.length,
        });
      }
    }

    // 1. Search web
    let rawHtml = '';
    try {
      rawHtml = await searchDuckDuckGo(searchQuery);
    } catch (e) {
      console.log('Search failed, using AI-only mode');
    }

    const cleanText = rawHtml ? extractTextFromHtml(rawHtml) : `Find places in Malaysia related to: ${query}`;

    // 2. Try AI extraction with all available keys
    let result: { places: any[]; source: string } | null = null;
    const errors: string[] = [];

    // Try Groq
    if (process.env.GROQ_API_KEY) {
      try {
        result = await extractWithAI(cleanText, process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-8b-instant', 'Groq AI');
      } catch (e: any) { errors.push(`Groq: ${e.message}`); }
    }

    // Try OpenRouter
    if (!result && process.env.OPENROUTER_API_KEY) {
      try {
        result = await extractWithAI(cleanText, process.env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free', 'OpenRouter');
      } catch (e: any) { errors.push(`OpenRouter: ${e.message}`); }
    }

    // Try Mistral direct
    if (!result && process.env.MISTRAL_API_KEY) {
      try {
        result = await extractWithAI(cleanText, process.env.MISTRAL_API_KEY, 'https://api.mistral.ai/v1/chat/completions', 'mistral-tiny', 'Mistral AI');
      } catch (e: any) { errors.push(`Mistral: ${e.message}`); }
    }

    // 3. Final fallback: use query to generate generic places with AI
    if (!result) {
      // If no API keys work, generate from query alone using any available key
      const genericPrompt = `Based on the query "${query}" about Malaysia, generate 4 realistic places. Return JSON array: [{"name":"...","address":"Malaysia","description":"...","category":"food|nature|shopping|history|entertainment"}]`;

      for (const [key, config] of [
        ['GROQ_API_KEY', 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-8b-instant'],
        ['OPENROUTER_API_KEY', 'https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free'],
        ['MISTRAL_API_KEY', 'https://api.mistral.ai/v1/chat/completions', 'mistral-tiny'],
      ] as const) {
        if (process.env[key]) {
          try {
            const res = await fetch(config[1], {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env[key]}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: config[2],
                messages: [
                  { role: 'system', content: 'You are a Malaysia travel expert. Return ONLY JSON array of places.' },
                  { role: 'user', content: genericPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2000,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const content = data.choices?.[0]?.message?.content || '';
              const places = parseJsonFromText(content);
              if (places.length > 0) {
                result = { places, source: 'AI Generated' };
                break;
              }
            }
          } catch { /* continue */ }
        }
      }
    }

    if (!result) {
      return NextResponse.json({
        places: [],
        source: 'none',
        query: searchQuery,
        count: 0,
        debug: {
          errors,
          hasGroqKey: !!process.env.GROQ_API_KEY,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasMistralKey: !!process.env.MISTRAL_API_KEY,
          htmlLength: rawHtml.length,
        }
      });
    }

    return NextResponse.json({
      places: result.places.slice(0, 12),
      source: result.source,
      query: searchQuery,
      count: result.places.length,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { places: [], error: error.message || 'Internal server error', source: 'error' },
      { status: 500 }
    );
  }
}
