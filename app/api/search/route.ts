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

// Clean category — fix pipe-separated and invalid categories
function cleanCategory(cat: string): string {
  if (!cat) return 'general';
  const clean = cat.toLowerCase().split('|')[0].trim();
  const valid = ['food', 'nature', 'shopping', 'history', 'entertainment'];
  return valid.includes(clean) ? clean : 'general';
}

// Clean address — remove generic/wrong locations
function cleanAddress(addr: string, query: string): string {
  if (!addr) return 'Malaysia';
  
  // Extract location from query (e.g., "langkawi", "penang", "kl")
  const locations = ['langkawi', 'penang', 'kl', 'kuala lumpur', 'melaka', 'malacca', 'ipoh', 'johor', 'sabah', 'sarawak', 'terengganu', 'kelantan', 'pahang', 'perak', 'kedah', 'perlis', 'negeri sembilan', 'selangor', 'putrajaya', 'labuan'];
  const queryLower = query.toLowerCase();
  const detectedLocation = locations.find(l => queryLower.includes(l));
  
  // If address has wrong state, replace it
  let cleaned = addr
    .replace(/Kuala Terengganu|Pulau[,\s]*Terengganu/gi, '') // Remove wrong Terengganu refs
    .replace(/,\s*Malaysia\s*$/i, '') // Remove trailing Malaysia
    .trim();
  
  // Add detected location if missing
  if (detectedLocation && !cleaned.toLowerCase().includes(detectedLocation)) {
    cleaned = cleaned ? `${cleaned}, ${detectedLocation.charAt(0).toUpperCase() + detectedLocation.slice(1)}` : detectedLocation.charAt(0).toUpperCase() + detectedLocation.slice(1);
  }
  
  return cleaned || 'Malaysia';
}

// Remove duplicates by name similarity
function deduplicate(places: any[]): any[] {
  const seen = new Set<string>();
  return places.filter(p => {
    const key = p.name?.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!key || key.length < 3 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Score place quality (filter out obvious hallucinations)
function scorePlace(place: any, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const nameLower = place.name?.toLowerCase() || '';
  const addrLower = place.address?.toLowerCase() || '';
  const descLower = place.description?.toLowerCase() || '';
  
  // Name contains query keyword
  if (queryLower.split(' ').some((w: string) => nameLower.includes(w) && w.length > 2)) score += 2;
  
  // Has specific address (not just "Malaysia")
  if (addrLower.length > 10 && !addrLower.includes('kuala terengganu')) score += 2;
  
  // Description is detailed
  if (descLower.length > 80) score += 1;
  
  // Description mentions query context
  if (queryLower.split(' ').some((w: string) => descLower.includes(w) && w.length > 2)) score += 1;
  
  // Has street name or area
  if (/jalan|lorong|taman|kampung|bandar|desa|taman/i.test(addrLower)) score += 1;
  
  // Penalty for generic names
  if (nameLower.includes('taman mini malaysia') && !queryLower.includes('melaka')) score -= 5; // Wrong location
  if (addrLower.includes('kuala terengganu') && queryLower.includes('langkawi')) score -= 5; // Wrong state
  
  return score;
}

async function generateWithAI(query: string, apiKey: string, url: string, model: string, sourceName: string): Promise<any[]> {
  const prompt = `You are a local Malaysian who knows every corner of Malaysia.

Task: Find real places for "${query}" in Malaysia.

CRITICAL RULES:
- ONLY include places that ACTUALLY EXIST in the correct location
- Addresses must be SPECIFIC: include street name, area, and correct state
- NEVER use generic addresses like "Jalan Pantai Cenang, Kuala Terengganu" — that's WRONG
- Langkawi is in KEDAH, not Terengganu
- Penang is an ISLAND state
- KL is a federal territory surrounded by Selangor
- Descriptions must be 2-3 sentences with SPECIFIC details (what to order, best time, how to get there, price)

Return ONLY JSON array:
[{"name":"Exact Place Name","address":"No X, Jalan XXX, Area, City, State, Malaysia","description":"Specific details. What makes it special. Best time to visit.","category":"food|nature|shopping|history|entertainment"}]`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a knowledgeable local Malaysian. Return ONLY valid JSON array. Be accurate about locations.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2, // Lower = more factual
      max_tokens: 3000,
    }),
  });

  if (!res.ok) throw new Error(`${sourceName} error ${res.status}`);
  
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const places = parseJson(content);
  
  if (places.length === 0) throw new Error(`${sourceName} empty result`);
  
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
      enhancedQuery = `${category} ${cleanQuery}`;
    }

    // Call ALL 3 AI services in parallel
    const promises: Promise<any[]>[] = [];
    const errors: string[] = [];
    const activeSources: string[] = [];

    if (process.env.GROQ_API_KEY) {
      activeSources.push('Groq');
      promises.push(
        generateWithAI(enhancedQuery, process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 'Groq')
          .catch(e => { errors.push(`Groq: ${e.message}`); return []; })
      );
    }

    if (process.env.OPENROUTER_API_KEY) {
      activeSources.push('OpenRouter');
      promises.push(
        generateWithAI(enhancedQuery, process.env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free', 'OpenRouter')
          .catch(e => { errors.push(`OpenRouter: ${e.message}`); return []; })
      );
    }

    if (process.env.MISTRAL_API_KEY) {
      activeSources.push('Mistral');
      promises.push(
        generateWithAI(enhancedQuery, process.env.MISTRAL_API_KEY, 'https://api.mistral.ai/v1/chat/completions', 'mistral-tiny', 'Mistral')
          .catch(e => { errors.push(`Mistral: ${e.message}`); return []; })
      );
    }

    const results = await Promise.all(promises);

    // Combine, clean, score, deduplicate
    let allPlaces: any[] = [];
    results.forEach(places => {
      allPlaces = allPlaces.concat(places);
    });

    // Clean and score each place
    allPlaces = allPlaces.map(p => ({
      name: p.name?.trim() || 'Unknown',
      address: cleanAddress(p.address, cleanQuery),
      description: p.description?.trim() || '',
      category: cleanCategory(p.category),
      _source: p._source,
    }));

    // Filter out low-quality results (score < 1)
    allPlaces = allPlaces.filter(p => scorePlace(p, cleanQuery) >= 1);

    // Sort by score (best first)
    allPlaces.sort((a, b) => scorePlace(b, cleanQuery) - scorePlace(a, cleanQuery));

    // Remove duplicates
    allPlaces = deduplicate(allPlaces);

    // Filter by category
    if (category && category !== 'all') {
      allPlaces = allPlaces.filter((p: any) => p.category === category.toLowerCase());
    }

    if (allPlaces.length === 0) {
      return NextResponse.json({
        places: [],
        source: 'none',
        query: enhancedQuery,
        count: 0,
        debug: { errors, activeSources }
      });
    }

    return NextResponse.json({
      places: allPlaces.slice(0, 12),
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
