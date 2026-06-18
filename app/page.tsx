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
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'General';
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
          query, 
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
    : places.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-emerald-400">🇲🇾 Malaysia Place Finder</h1>
          <p className="text-slate-400 mt-1">Discover places with AI-powered search</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Box */}
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
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 
