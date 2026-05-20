'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Trash2, Download, Upload, Search } from 'lucide-react';
import { commonFixes } from '@/lib/govDictionary';

interface SmartFixEntry { input: string; output: string; }

export default function SmartFixManager() {
  const [entries, setEntries] = useState<SmartFixEntry[]>(
    Object.entries(commonFixes).map(([input, output]) => ({ input, output }))
  );
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [search, setSearch] = useState('');

  const filtered = search
    ? entries.filter(e => e.input.includes(search) || e.output.includes(search))
    : entries;

  const addEntry = () => {
    if (newInput.trim() && newOutput.trim()) {
      setEntries([{ input: newInput.trim(), output: newOutput.trim() }, ...entries]);
      setNewInput('');
      setNewOutput('');
    }
  };

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const exportDict = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'smart-fix-dictionary.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importDict = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) setEntries([...imported, ...entries]);
      } catch { alert('Invalid JSON file'); }
    };
    input.click();
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }}>
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">स्मार्ट फिक्स शब्दकोश</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Smart Fix Dictionary — {entries.length} entries</p>
            </div>
          </div>
        </motion.div>

        {/* Add New Entry */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">नया शब्द जोड़ें</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Input (Hinglish)</label>
              <input className="input-field" placeholder="aakhaya" value={newInput} onChange={e => setNewInput(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Output (Hindi)</label>
              <input className="input-field" placeholder="आख्या" value={newOutput} onChange={e => setNewOutput(e.target.value)} />
            </div>
            <button className="btn-primary shrink-0" onClick={addEntry}><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-field pl-10" placeholder="खोजें..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-secondary text-xs" onClick={exportDict}><Download className="w-3.5 h-3.5 inline mr-1" />Export</button>
          <button className="btn-secondary text-xs" onClick={importDict}><Upload className="w-3.5 h-3.5 inline mr-1" />Import</button>
        </div>

        {/* Entries List */}
        <div className="space-y-1.5">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.input + i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-3 flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <code className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {entry.input}
                </code>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-hindi)', color: 'var(--accent-secondary)' }}>
                  {entry.output}
                </span>
              </div>
              <button
                onClick={() => removeEntry(i)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
