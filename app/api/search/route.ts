import { NextResponse } from 'next/server';

// Better fallback data with more places
const fallbackData: Record<string, any[]> = {
  'nasi lemak': [
    { name: 'Village Park Restaurant', address: '5, Jalan SS21/37, Damansara Utama, Petaling Jaya, Selangor', description: 'Legendary nasi lemak with crispy ayam goreng berempah. Expect long queues especially on weekends. Open since 1980s.', category: 'food' },
    { name: 'Nasi Lemak Antarabangsa', address: '4, Jalan Raja Muda Musa, Kampung Baru, 50300 Kuala Lumpur', description: 'Iconic spot in Kampung Baru serving classic nasi lemak since 1973. Famous for sambal and rendang.', category: 'food' },
    { name: 'Nasi Lemak Bumbung', address: '6, Jalan 21/11b, Sea Park, 46300 Petaling Jaya, Selangor', description: 'Popular late-night nasi lemak spot with smoky sambal and fried chicken. Best after 8pm.', category: 'food' },
    { name: 'Nasi Lemak Wanjo', address: '8, Jalan Raja Muda Musa, Kampung Baru, 50300 Kuala Lumpur', description: 'Kampung Baru legend known for rich sambal and tender beef rendang. Open 24 hours.', category: 'food' },
    { name: 'Nasi Lemak Tanglin', address: 'Jalan Cenderasari, Kuala Lumpur', description: 'Government staff favorite near Parliament. Generous portions with spicy sambal sotong.', category: 'food' },
  ],
  'langkawi': [
    { name: 'Pantai Cenang', address: 'Pantai Cenang, 07000 Langkawi, Kedah', description: 'Most popular beach with jet skiing, parasailing, beach bars, and stunning sunset views. Best for nightlife.', category: 'nature' },
    { name: 'Langkawi Sky Bridge', address: 'Oriental Village, Burau Bay, 07000 Langkawi, Kedah', description: 'Iconic 125m curved pedestrian bridge 660m above sea level. Accessible via cable car. Breathtaking views.', category: 'nature' },
    { name: 'Kilim Karst Geoforest Park', address: 'Kilim, 07000 Langkawi, Kedah', description: 'UNESCO Global Geopark with mangrove boat tours, eagle feeding, limestone caves, and floating fish farm.', category: 'nature' },
    { name: 'Tanjung Rhu Beach', address: 'Tanjung Rhu, 07000 Langkawi, Kedah', description: 'Secluded beach with crystal clear water, casuarina trees, and stunning sunset. Near Four Seasons resort.', category: 'nature' },
    { name: 'Underwater World Langkawi', address: 'Jalan Pantai Cenang, 07000 Langkawi, Kedah', description: 'One of Malaysia largest aquariums with 4,000+ marine species including sharks, rays, and penguins.', category: 'entertainment' },
  ],
  'penang': [
    { name: 'George Town UNESCO Heritage Site', address: 'George Town, 10200 Penang', description: 'Colonial architecture, street art (Ernest Zacharevic), Peranakan mansions, and clan jetties. Free walking tours available.', category: 'history' },
    { name: 'Penang Hill (Bukit Bendera)', address: 'Bukit Bendera, 11300 Air Itam, Penang', description: 'Cool hill station at 833m with funicular train, The Habitat nature walk, and panoramic George Town views.', category: 'nature' },
    { name: 'Gurney Drive Hawker Centre', address: 'Gurney Drive, 10250 George Town, Penang', description: 'Famous open-air food court with char kway teow, asam laksa, oyster omelette, and rojak. Best after 6pm.', category: 'food' },
    { name: 'Kek Lok Si Temple', address: '1000-L, Tingkat Lembah Ria 1, 11500 Air Itam, Penang', description: 'Largest Buddhist temple in Malaysia. Features 7-story Pagoda of Ten Thousand Buddhas and 30.2m bronze Guan Yin statue.', category: 'history' },
    { name: 'Penang National Park', address: 'Jalan Hassan Abbas, 11050 Teluk Bahang, Penang', description: 'Smallest national park in Malaysia with canopy walkway, Monkey Beach, and Turtle Sanctuary.', category: 'nature' },
  ],
  'kl': [
    { name: 'Petronas Twin Towers', address: 'Kuala Lumpur City Centre, 50088 Kuala Lumpur', description: 'Iconic 88-floor twin skyscrapers with Skybridge on 41st floor and Observation Deck on 86th. Book tickets online.', category: 'entertainment' },
    { name: 'Batu Caves', address: 'Gombak, 68100 Batu Caves, Selangor', description: '272 colorful steps lead to Hindu temple inside limestone cave. 42.7m golden Lord Murugan statue at entrance. Thaipusam festival highlight.', category: 'history' },
    { name: 'Jalan Alor', address: 'Bukit Bintang, 50200 Kuala Lumpur', description: 'Famous street food paradise with hundreds of hawker stalls open until 3am. Try Wong Ah Wah chicken wings and satay.', category: 'food' },
    { name: 'Central Market (Pasar Seni)', address: 'Jalan Hang Kasturi, 50050 Kuala Lumpur', description: 'Heritage Art Deco building (1888) turned arts and crafts market. Best for local souvenirs, batik, and handicrafts.', category: 'shopping' },
    { name: 'Merdeka 118', address: 'Jalan Hang Jebat, 50150 Kuala Lumpur', description: 'Second tallest building in the world (678.9m). Observation deck at level 118 with 360° city views. Open 2024.', category: 'entertainment' },
  ],
  'melaka': [
    { name: 'Jonker Walk Night Market', address: 'Jalan Hang Jebat, 75200 Melaka', description: 'Historic street with Peranakan shophouses, Friday-Sunday night market, famous chicken rice balls, and cendol.', category: 'history' },
    { name: 'A Famosa Fortress', address: 'Jalan Kota, Bandar Hilir, 75000 Melaka', description: '16th-century Portuguese fortress remains — Porta de Santiago gate. One of oldest European structures in Southeast Asia.', category: 'history' },
    { name: 'Christ Church Melaka', address: 'Dutch Square, Jalan Gereja, Bandar Hilir, 75000 Melaka', description: '1753 Dutch colonial church with distinctive red exterior and handmade pews. Part of Stadthuys complex.', category: 'history' },
    { name: 'Melaka River Cruise', address: 'Jalan Persisiran Bunga Raya, 75100 Melaka', description: '45-minute boat ride through historic Melaka River with illuminated murals and bridges. Best at night.', category: 'entertainment' },
  ],
  'cameron': [
    { name: 'BOH Tea Plantation', address: 'Brinchang, 39000 Cameron Highlands, Pahang', description: 'Largest tea plantation in Malaysia. Factory tours, scenic viewpoints, and tea house with scones. Founded 1929.', category: 'nature' },
    { name: 'Cameron Lavender Garden', address: 'Tringkap, 39000 Cameron Highlands, Pahang', description: 'Colorful lavender and flower gardens with strawberry picking, flower ice cream, and photo spots.', category: 'nature' },
    { name: 'Mossy Forest (Gunung Brinchang)', address: 'Gunung Brinchang, 39000 Cameron Highlands, Pahang', description: 'Enchanted cloud forest at 2,032m with boardwalk trails through ancient moss-covered trees. 4WD required.', category: 'nature' },
    { name: 'Cameron Highlands Night Market', address: 'Brinchang, 39000 Cameron Highlands, Pahang', description: 'Weekend night market with fresh strawberries, corn, vegetables, souvenirs, and hot steamboat.', category: 'shopping' },
  ],
  'ipoh': [
    { name: 'Ipoh Old Town', address: 'Jalan Sultan Yusuff, 30000 Ipoh, Perak', description: 'Heritage colonial buildings, famous white coffee, and Concubine Lane. Birthplace of Old Town White Coffee.', category: 'history' },
    { name: 'Lost World of Tambun', address: '1, Persiaran Lagun Sunway, 31150 Ipoh, Perak', description: 'Theme park with water park, hot springs, petting zoo, and limestone cave adventures.', category: 'entertainment' },
    { name: 'Kellie Castle', address: 'Batuh Gajah, 31000 Ipoh, Perak', description: '1915 unfinished Scottish mansion with hidden rooms, underground tunnels, and rooftop courtyard.', category: 'history' },
  ],
  'johor': [
    { name: 'Legoland Malaysia', address: '7, Jalan Legoland, 79100 Iskandar Puteri, Johor', description: 'First Legoland in Asia with theme park, water park, and SEA LIFE aquarium. 70+ rides and shows.', category: 'entertainment' },
    { name: 'Desaru Coast', address: 'Desaru, 81930 Bandar Penawar, Johor', description: 'Luxury beach resort area with golf courses, water park, and pristine 22km beach.', category: 'nature' },
  ],
  'sabah': [
    { name: 'Mount Kinabalu', address: 'Kinabalu Park, 89300 Ranau, Sabah', description: 'Southeast Asia highest peak (4,095m). 2-day climb with overnight at Laban Rata. UNESCO World Heritage Site.', category: 'nature' },
    { name: 'Sipadan Island', address: 'Semporna, 91308 Sabah', description: 'World top 3 dive site with barracuda tornadoes, sea turtles, and wall diving. Permit required, limited daily.', category: 'nature' },
  ],
  'sarawak': [
    { name: 'Bako National Park', address: 'Bako, 93050 Kuching, Sarawak', description: 'Oldest national park in Sarawak with proboscis monkeys, bearded pigs, and sea stack formations.', category: 'nature' },
    { name: 'Mulu Caves', address: 'Gunung Mulu National Park, 98070 Miri, Sarawak', description: 'UNESCO site with Deer Cave (world largest cave passage), Clearwater Cave, and millions of bats at dusk.', category: 'nature' },
  ],
  'tioman': [
    { name: 'Pulau Tioman Marine Park', address: 'Pulau Tioman, 26800 Pahang', description: 'Duty-free island with crystal clear waters, coral reefs, and jungle trekking. Popular for diving and snorkeling.', category: 'nature' },
  ],
  'redang': [
    { name: 'Pulau Redang Marine Park', address: 'Pulau Redang, 21090 Terengganu', description: 'Pristine island with powdery white sand, turquoise water, and excellent snorkeling. Resort packages available.', category: 'nature' },
  ],
  'perhentian': [
    { name: 'Perhentian Islands', address: 'Pulau Perhentian, 22300 Besut, Terengganu', description: 'Backpacker paradise with two main islands. Cheap chalets, turtle watching, and vibrant coral reefs.', category: 'nature' },
  ],
  'genting': [
    { name: 'Genting Highlands', address: 'Genting Highlands, 69000 Pahang', description: 'Cool mountain resort with casinos, theme parks (Skytropolis, Genting SkyWorlds), and cable car (SkyAvenue).', category: 'entertainment' },
  ],
  'putrajaya': [
    { name: 'Putrajaya Bridge', address: 'Persiaran Perdana, 62000 Putrajaya', description: 'Stunning cable-stayed bridge inspired by Iranian architecture. Best viewed at night when illuminated.', category: 'history' },
    { name: 'Putra Mosque', address: 'Persiaran Perdana, 62000 Putrajaya', description: 'Famous pink-domed mosque on Putrajaya Lake. Non-Muslims welcome outside prayer times. Free entry.', category: 'history' },
  ],
};

// Better search using multiple methods
async function searchWeb(query: string): Promise<string> {
  try {
    // Try DuckDuckGo HTML
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
    if (res.ok) return await res.text();
  } catch {}

  try {
    // Fallback to lite version
    const res = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store',
      }
    );
    if (res.ok) return await res.text();
  } catch {}

  return '';
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000);
}

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

async function extractWithAI(text: string, apiKey: string, url: string, model: string, sourceName: string) {
  const systemPrompt = `You are a Malaysia travel expert. Extract real places from the search results into a strict JSON array.

Rules:
- Only extract places that actually exist in Malaysia
- Include specific addresses when available
- Description should be 1-2 sentences with useful details
- Category must be one of: food, nature, shopping, history, entertainment
- Return ONLY valid JSON array, no markdown, no explanation
- If no real places found, return []

Format: [{"name":"Place Name","address":"Specific Address, Malaysia","description":"What makes it special. Opening hours or tips if known.","category":"food"}]`;

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
        { role: 'user', content: text.substring(0, 6000) },
      ],
      temperature: 0.1,
      max_tokens: 2000,
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

    const searchQuery = category 
      ? `best ${category} places in Malaysia ${query}`
      : `best places in Malaysia ${query}`;

    // 1. Check fallback database first (instant, no API needed)
    const queryLower = query.toLowerCase();
    for (const [key, places] of Object.entries(fallbackData)) {
      if (queryLower.includes(key)) {
        const filtered = category 
          ? places.filter(p => p.category === category)
          : places;
        return NextResponse.json({
          places: filtered,
          source: 'Local Database',
          query: searchQuery,
          count: filtered.length,
        });
      }
    }

    // 2. Search web
    const rawHtml = await searchWeb(searchQuery);
    const cleanText = rawHtml ? cleanHtml(rawHtml) : '';

    // 3. Try AI extraction
    let result: { places: any[]; source: string } | null = null;
    const errors: string[] = [];

    if (process.env.GROQ_API_KEY && cleanText.length > 200) {
      try {
        result = await extractWithAI(cleanText, process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-8b-instant', 'Groq AI');
      } catch (e: any) { errors.push(`Groq: ${e.message}`); }
    }

    if (!result && process.env.OPENROUTER_API_KEY && cleanText.length > 200) {
      try {
        result = await extractWithAI(cleanText, process.env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free', 'OpenRouter');
      } catch (e: any) { errors.push(`OpenRouter: ${e.message}`); }
    }

    if (!result && process.env.MISTRAL_API_KEY && cleanText.length > 200) {
      try {
        result = await extractWithAI(cleanText, process.env.MISTRAL_API_KEY, 'https://api.mistral.ai/v1/chat/completions', 'mistral-tiny', 'Mistral AI');
      } catch (e: any) { errors.push(`Mistral: ${e.message}`); }
    }

    // 4. AI-only generation (no web data needed)
    if (!result) {
      const generatePrompt = `Generate 5 realistic, well-known places in Malaysia related to "${query}". Include specific addresses and useful descriptions. Return ONLY JSON array.`;
      
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
                  { role: 'system', content: 'You are a Malaysia travel expert. Return ONLY JSON array of real places.' },
                  { role: 'user', content: generatePrompt },
                ],
                temperature: 0.3,
                max_tokens: 2000,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const content = data.choices?.[0]?.message?.content || '';
              const places = parseJson(content);
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
