'use client';

import { useState } from 'react';

interface Place {
  name: string;
  address: string;
  description: string;
  category: string;
}

const categories = ['all', 'food', 'nature', 'shopping', 'history', 'entertainment'];

const categoryColors: Record<string, string> = {
  food: 'bg-orange-600',
  nature: 'bg-green-600',
  shopping: 'bg-purple-600',
  history: 'bg-amber-700',
  entertainment: 'bg-pink-600',
  general: 'bg-gray-600',
};

function capitalize(str: string): string {
  if (!str) return 'General';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [perSource, setPerSource] = useState<any[]>([]);

  async function handleSearch() {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setPlaces([]);
    setPerSource([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query, 
          category: activeCategory !== 'all' ? activeCategory : undefined 
        }),
      });

      const data = await res.json();
      
      console.log('Response:', data);

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setPlaces(data.places || []);
      setSource(data.source || '');
      setPerSource(data.perSource || []);

      if (data.places?.length === 0) {
        setError(`No places found. Source: ${data.source}. Try a different search or check your API keys.`);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const filteredPlaces = activeCategory === 'all' 
    ? places 
    : places.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-emerald-400">🇲🇾 Malaysia Place Finder</h1>
          <p className="text-slate-400 mt-1">Discover places with AI-powered search</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. best nasi lemak in KL, hidden cafe Penang..."
              className="flex-1 p-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Searching...
                </span>
              ) : 'Search'}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === cat 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {capitalize(cat)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {source && places.length > 0 && (
          <div className="mb-4">
            <div className="text-slate-500 text-sm">
              Results powered by <span className="text-emerald-400 font-medium">{source}</span> • {filteredPlaces.length} places found
            </div>
            {perSource.length > 0 && (
              <div className="text-slate-600 text-xs mt-1">
                {perSource.map((s, i) => (
                  <span key={i}>{s.source}: {s.count}{i < perSource.length - 1 ? ' | ' : ''}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.map((place, i) => (
              <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition group">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition leading-tight">
                    {place.name}
                  </h3>
                  <span className={`px-3 py-1 text-xs rounded-full text-white font-medium shrink-0 ${categoryColors[place.category] || categoryColors.general}`}>
                    {capitalize(place.category)}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm mb-3 flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="line-clamp-2">{place.address || 'Malaysia'}</span>
                </p>
                
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                  {place.description}
                </p>

                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.address || 'Malaysia'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-emerald-400 text-sm hover:text-emerald-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  View on Maps
                </a>
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && (
            <div className="text-center py-20 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <p className="text-lg">Search for places in Malaysia</p>
              <p className="text-sm mt-2">Try &quot;best nasi lemak KL&quot;, &quot;hidden cafe Penang&quot;, &quot;hiking Selangor&quot;</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
