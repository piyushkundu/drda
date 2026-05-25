'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';
import {
  Archive, Trash2, RotateCcw, FileText, TableProperties,
  Clock, Shield, Sparkles, AlertTriangle, Search, X,
  FolderOpen, ChevronRight, Star, Zap, XCircle
} from 'lucide-react';

type TabId = 'all' | 'archive' | 'trash';

export default function ArchivedFiles() {
  const {
    recentDocuments, archivedDocuments, trashDocuments,
    loadArchive, loadTrash, hydrateFromStorage,
    loadRecentDocument, restoreDocument, permanentDeleteDocument,
    deleteArchiveDocument, restoreFromArchive, softDeleteDocument,
  } = useDocumentStore();
  const { setSidebarPanel } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    loadArchive();
    loadTrash();
  }, []); // eslint-disable-line

  const tabs: { id: TabId; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { id: 'all', label: 'सभी फ़ाइलें', icon: FolderOpen, count: recentDocuments.length, color: '#6c5ce7' },
    { id: 'archive', label: 'आर्काइव', icon: Archive, count: archivedDocuments.length, color: '#00b894' },
    { id: 'trash', label: 'ट्रैश', icon: Trash2, count: trashDocuments.length, color: '#e17055' },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'अभी';
      if (diffMins < 60) return `${diffMins} मिनट पहले`;
      if (diffHours < 24) return `${diffHours} घंटे पहले`;
      if (diffDays < 7) return `${diffDays} दिन पहले`;
      return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const getDaysUntilAutoDelete = (deletedAt: string): number => {
    const deletedTime = new Date(deletedAt).getTime();
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const remaining = THIRTY_DAYS - (now - deletedTime);
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  };

  const getPreview = (content: string, type?: string) => {
    if (type === 'spreadsheet') return 'स्प्रेडशीट डेटा (Spreadsheet Data)';
    const text = content.replace(/<[^>]*>/g, '').replace(/<!-- page-break -->/g, ' ').trim();
    return text.length > 120 ? text.slice(0, 120) + '…' : text || 'खाली दस्तावेज़';
  };

  const getImportanceBadge = (importance?: string) => {
    switch (importance) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#e17055', color: '#fff' }}>
            <Star className="w-2.5 h-2.5" /> महत्वपूर्ण
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#fdcb6e', color: '#2d3436' }}>
            <Zap className="w-2.5 h-2.5" /> मध्यम
          </span>
        );
      default:
        return null;
    }
  };

  // Filter by search
  const filterDocs = (docs: typeof recentDocuments) => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.autoName?.toLowerCase().includes(q) ||
      d.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q)
    );
  };

  const currentDocs = activeTab === 'all'
    ? filterDocs(recentDocuments)
    : activeTab === 'archive'
      ? filterDocs(archivedDocuments)
      : filterDocs(trashDocuments);

  const handleOpenDoc = (doc: typeof recentDocuments[0]) => {
    if (activeTab === 'archive') {
      restoreFromArchive(doc);
      setSidebarPanel(doc.type === 'spreadsheet' ? 'spreadsheet' : 'editor');
    } else if (activeTab === 'trash') {
      // Can't open trash docs — must restore first
      return;
    } else {
      loadRecentDocument(doc);
      setSidebarPanel(doc.type === 'spreadsheet' ? 'spreadsheet' : 'editor');
    }
  };

  return (
    <div className="h-full overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
            style={{ background: 'linear-gradient(135deg, #00b894, #6c5ce7)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00b894, #6c5ce7)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-hindi)' }}>
                  फ़ाइल सुरक्षा केंद्र
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Document Protection Center — सभी दस्तावेज़ सुरक्षित और auto-archived
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-4">
              {[
                { label: 'सक्रिय', value: recentDocuments.length, color: '#6c5ce7' },
                { label: 'आर्काइव', value: archivedDocuments.length, color: '#00b894' },
                { label: 'ट्रैश', value: trashDocuments.length, color: '#e17055' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: `${s.color}15` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-semibold" style={{ color: s.color }}>
                    {s.value} {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? `${tab.color}20` : 'transparent',
                  color: isActive ? tab.color : 'var(--text-secondary)',
                  border: isActive ? `1.5px solid ${tab.color}40` : '1.5px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: isActive ? `${tab.color}30` : 'var(--bg-secondary)',
                    color: isActive ? tab.color : 'var(--text-muted)',
                  }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="फ़ाइल खोजें... (Search files)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Info Banner for Archive tab */}
        {activeTab === 'archive' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: '#00b89415', border: '1px solid #00b89430', color: '#00b894' }}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              यहाँ वे सभी दस्तावेज़ हैं जो <strong>ऑटो-सेव</strong> हुए हैं। महत्वपूर्ण content वाले documents स्वचालित रूप से यहाँ archive होते हैं।
            </span>
          </motion.div>
        )}

        {/* Info Banner for Trash tab */}
        {activeTab === 'trash' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: '#e1705515', border: '1px solid #e1705530', color: '#e17055' }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              ट्रैश में भेजे गए दस्तावेज़ <strong>30 दिनों</strong> बाद स्वचालित रूप से हटा दिए जाएंगे। इससे पहले आप उन्हें Restore कर सकते हैं।
            </span>
          </motion.div>
        )}

        {/* Document List */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {currentDocs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                {activeTab === 'trash' ? (
                  <Trash2 className="w-12 h-12 mb-3 opacity-15" style={{ color: 'var(--text-muted)' }} />
                ) : activeTab === 'archive' ? (
                  <Archive className="w-12 h-12 mb-3 opacity-15" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <FolderOpen className="w-12 h-12 mb-3 opacity-15" style={{ color: 'var(--text-muted)' }} />
                )}
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'कोई परिणाम नहीं मिला' : activeTab === 'trash' ? 'ट्रैश खाली है' : activeTab === 'archive' ? 'कोई archived फ़ाइल नहीं' : 'कोई फ़ाइल नहीं'}
                </p>
              </motion.div>
            ) : (
              currentDocs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card p-4 flex items-start gap-4 group hover:scale-[1.005] transition-transform"
                  style={{ cursor: activeTab !== 'trash' ? 'pointer' : 'default' }}
                  onClick={() => handleOpenDoc(doc)}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: activeTab === 'trash'
                        ? '#e1705520'
                        : doc.type === 'spreadsheet'
                          ? '#27ae6020'
                          : '#6c5ce720',
                      color: activeTab === 'trash'
                        ? '#e17055'
                        : doc.type === 'spreadsheet'
                          ? '#27ae60'
                          : '#6c5ce7',
                    }}>
                    {doc.type === 'spreadsheet' ? <TableProperties className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {activeTab === 'archive' && doc.autoName ? doc.autoName : doc.title || 'बिना शीर्षक दस्तावेज़'}
                      </h4>
                      {getImportanceBadge(doc.importance)}
                    </div>

                    {/* Auto-name subtitle (archive tab) */}
                    {activeTab === 'archive' && doc.autoName && doc.title && doc.autoName !== doc.title && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--accent-secondary)' }}>
                        मूल नाम: {doc.title}
                      </p>
                    )}

                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      {getPreview(doc.content, doc.type)}
                    </p>

                    {/* Metadata row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(activeTab === 'archive' ? (doc.archivedAt || doc.updatedAt) : doc.updatedAt)}
                      </span>
                      {doc.wordCount && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {doc.wordCount} शब्द
                        </span>
                      )}
                      {activeTab === 'trash' && doc.deletedAt && (
                        <span className="text-[10px] font-semibold" style={{ color: '#e17055' }}>
                          ⏳ {getDaysUntilAutoDelete(doc.deletedAt)} दिन बाद auto-delete
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}>

                    {activeTab === 'all' && (
                      <button
                        onClick={() => softDeleteDocument(doc.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                        title="ट्रैश में भेजें"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {activeTab === 'archive' && (
                      <>
                        <button
                          onClick={() => { restoreFromArchive(doc); setSidebarPanel(doc.type === 'spreadsheet' ? 'spreadsheet' : 'editor'); }}
                          className="p-2 rounded-lg transition-colors hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 hover:text-green-700"
                          title="खोलें (Open)"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteArchiveDocument(doc.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                          title="आर्काइव से हटाएं"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {activeTab === 'trash' && (
                      <>
                        <button
                          onClick={() => restoreDocument(doc.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 hover:text-green-700"
                          title="वापस लाएं (Restore)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === doc.id ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ background: '#e1705520' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#e17055' }}>पक्का?</span>
                            <button
                              onClick={() => { permanentDeleteDocument(doc.id); setConfirmDeleteId(null); }}
                              className="p-1 rounded text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 text-xs font-bold"
                            >
                              हाँ
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs"
                            >
                              नहीं
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="p-2 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                            title="स्थायी रूप से हटाएं (Permanent Delete)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
