'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Copy, Check } from 'lucide-react';
import { govDictionary, dictionaryCategories, searchDictionary } from '@/lib/govDictionary';
import type { GovDictionaryEntry } from '@/types';

export default function GovDictionaryPanel() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const results: GovDictionaryEntry[] = query
    ? searchDictionary(query)
    : selectedCategory === 'All'
      ? govDictionary
      : govDictionary.filter(e => e.category === selectedCategory);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e84393, #fd79a8)' }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">शासकीय शब्दकोश</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Government Hindi Dictionary — {govDictionary.length} शब्द</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-field pl-10"
              placeholder="खोजें... (Hindi, English, or Hinglish)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`badge cursor-pointer transition-colors ${selectedCategory === 'All' ? 'badge-info' : ''}`}
            style={selectedCategory !== 'All' ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
          >
            सभी (All)
          </button>
          {dictionaryCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`badge cursor-pointer transition-colors ${selectedCategory === cat ? 'badge-info' : ''}`}
              style={selectedCategory !== cat ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-2">
          {results.map((entry, i) => (
            <motion.div
              key={entry.hindi + i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-4 hover:border-[var(--accent-primary)] transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-semibold" style={{ fontFamily: 'var(--font-hindi)', color: 'var(--accent-secondary)' }}>
                      {entry.hindi}
                    </span>
                    <span className="badge badge-info">{entry.category}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>English:</strong> {entry.english} &nbsp;|&nbsp; <strong>Hinglish:</strong> {entry.hinglish}
                  </p>
                  {entry.usage && (
                    <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-hindi)' }}>
                      उदाहरण: {entry.usage}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(entry.hindi, entry.hindi)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white/5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {copiedId === entry.hindi ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            कोई परिणाम नहीं मिला
          </div>
        )}
      </div>
    </div>
  );
}
