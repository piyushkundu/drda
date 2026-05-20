'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Copy } from 'lucide-react';
import { governmentTemplates } from '@/lib/templates';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';

const categories = [
  { value: 'all', label: 'सभी' },
  { value: 'complaint', label: 'शिकायत' },
  { value: 'report', label: 'आख्या/रिपोर्ट' },
  { value: 'letter', label: 'पत्र' },
  { value: 'order', label: 'आदेश' },
  { value: 'reply', label: 'उत्तर' },
  { value: 'notesheet', label: 'नोटशीट' },
  { value: 'reminder', label: 'स्मरण' },
  { value: 'notice', label: 'नोटिस' },
];

export default function TemplateGallery() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { updateContent } = useDocumentStore();
  const { setSidebarPanel } = useUIStore();
  const { newDocument } = useDocumentStore();

  const filtered = governmentTemplates.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (searchQuery && !t.nameHindi.includes(searchQuery) && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const useTemplate = (content: string, name: string) => {
    newDocument();
    updateContent(content);
    setSidebarPanel('editor');
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">दस्तावेज़ टेम्पलेट</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Government Document Templates — {governmentTemplates.length} templates</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-field pl-10" placeholder="टेम्पलेट खोजें..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`badge cursor-pointer transition-colors ${filter === cat.value ? 'badge-info' : ''}`}
                style={filter !== cat.value ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 hover:border-[var(--accent-primary)] transition-all group cursor-pointer"
              onClick={() => useTemplate(template.content, template.nameHindi)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-hindi)' }}>{template.nameHindi}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{template.name}</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="badge badge-info">{template.category}</span>
                  <span className="badge badge-success">{template.department}</span>
                </div>
              </div>
              {template.description && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{template.description}</p>
              )}
              <div className="mt-3 p-3 rounded-lg text-xs overflow-hidden max-h-24"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontFamily: 'var(--font-hindi)' }}
                dangerouslySetInnerHTML={{ __html: template.content.substring(0, 300) + '...' }}
              />
              <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="btn-primary text-xs">
                  <Copy className="w-3.5 h-3.5" />उपयोग करें
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
