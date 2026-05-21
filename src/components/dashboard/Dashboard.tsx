'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useAIStore } from '@/stores/aiStore';
import { useEffect, useState } from 'react';
import {
  FilePlus, FileText, Bot, Type, ScanLine, BookOpen,
  Sparkles, TrendingUp, Clock, Zap, Trash2, X
} from 'lucide-react';

const quickActions = [
  { id: 'editor', label: 'नया दस्तावेज़', desc: 'New Document', icon: FilePlus, color: '#6c5ce7' },
  { id: 'templates', label: 'टेम्पलेट', desc: 'Templates', icon: FileText, color: '#00b894' },
  { id: 'ai-generator', label: 'AI ड्राफ्ट', desc: 'AI Draft', icon: Bot, color: '#e17055' },
  { id: 'font-converter', label: 'फ़ॉन्ट कनवर्टर', desc: 'Font Converter', icon: Type, color: '#0984e3' },
  { id: 'ocr', label: 'OCR स्कैनर', desc: 'OCR Scanner', icon: ScanLine, color: '#fdcb6e' },
  { id: 'dictionary', label: 'शब्दकोश', desc: 'Dictionary', icon: BookOpen, color: '#e84393' },
] as const;

export default function Dashboard() {
  const { setSidebarPanel } = useUIStore();
  const { setConnected } = useAIStore();
  const { newDocument, recentDocuments, loadRecentDocument, deleteRecentDocument, hydrateFromStorage } = useDocumentStore();

  // Hydrate recent documents from localStorage
  useEffect(() => {
    hydrateFromStorage();
  }, []); // eslint-disable-line

  // Check Ollama connection on mount
  useEffect(() => {
    fetch('/api/ai/models')
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, [setConnected]);

  const [showNewDocModal, setShowNewDocModal] = useState(false);

  const handleQuickAction = (id: string) => {
    if (id === 'editor') {
      setShowNewDocModal(true);
      return;
    }
    setSidebarPanel(id as Parameters<typeof setSidebarPanel>[0]);
  };

  const handleOpenRecent = (doc: typeof recentDocuments[0]) => {
    loadRecentDocument(doc);
    setSidebarPanel('editor');
  };

  // Extract preview text from HTML content
  const getPreview = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/<!-- page-break -->/g, ' ').trim();
    return text.length > 100 ? text.slice(0, 100) + '…' : text || 'खाली दस्तावेज़';
  };

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

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--accent-gradient)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8" style={{ color: 'var(--accent-secondary)' }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-hindi)' }}>
                पेज हिंदी में आपका स्वागत है
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              AI-Powered Hindi Government Office Drafting Suite — भारतीय शासकीय कार्यालयों के लिए विशेष रूप से डिज़ाइन किया गया
            </p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            त्वरित कार्य (Quick Actions)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleQuickAction(action.id)}
                  className="glass-card p-5 text-left hover:scale-[1.02] transition-transform group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${action.color}20`, color: action.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{action.label}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div id="recent-files-section">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
              हाल के दस्तावेज़ (Recent Files)
            </h2>
            <div className="space-y-2">
              {recentDocuments.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform group"
                  onClick={() => handleOpenRecent(doc)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#6c5ce720', color: '#6c5ce7' }}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {doc.title || 'बिना शीर्षक दस्तावेज़'}
                    </h4>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {getPreview(doc.content)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(doc.updatedAt)}
                    </span>
                    <button
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteRecentDocument(doc.id); }}
                      title="हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'दस्तावेज़', value: String(recentDocuments.length), icon: FileText, change: 'Documents' },
            { label: 'AI सुधार', value: '0', icon: Bot, change: 'Corrections' },
            { label: 'टेम्पलेट', value: '10', icon: TrendingUp, change: 'Templates' },
            { label: 'हाल के', value: String(recentDocuments.length), icon: Clock, change: 'Recent' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                  <Icon className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.change}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Supported Departments */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-3">समर्थित विभाग (Supported Departments)</h3>
          <div className="flex flex-wrap gap-2">
            {['DRDA', 'Social Audit', 'नगर पालिका', 'पंचायत', 'Block Office', 'तहसील', 'IGRS', 'ग्रामीण विकास'].map((dept) => (
              <span key={dept} className="badge badge-info">{dept}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* New Document Modal (MS Word Style) */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full h-full rounded-none shadow-2xl flex flex-col overflow-hidden relative"
            style={{ background: 'var(--bg-primary)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FilePlus className="w-7 h-7 text-blue-500" />
                नया दस्तावेज़ (New Document)
              </h2>
              <button
                onClick={() => setShowNewDocModal(false)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {/* Templates Section (Top) */}
              <div className="mb-10">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>नया (New)</h3>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  
                  {/* Blank Document Card */}
                  <button
                    onClick={() => {
                      newDocument();
                      setSidebarPanel('editor');
                      setShowNewDocModal(false);
                    }}
                    className="flex flex-col items-center gap-3 group shrink-0"
                  >
                    <div className="w-32 h-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm flex items-center justify-center group-hover:border-blue-500 group-hover:shadow-md transition-all relative overflow-hidden">
                      <FilePlus className="w-10 h-10 text-blue-500 opacity-80 group-hover:scale-110 transition-transform" />
                      {/* Fold corner effect */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 border-b border-l border-gray-300 dark:border-gray-600 shadow-sm" style={{ borderBottomLeftRadius: '4px' }}></div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>खाली दस्तावेज़ (Blank)</span>
                  </button>

                  {/* Sample Templates just for visual similarity to Word */}
                  <button 
                    onClick={() => { setSidebarPanel('templates'); setShowNewDocModal(false); }}
                    className="flex flex-col items-center gap-3 group shrink-0"
                  >
                    <div className="w-32 h-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm flex flex-col justify-center px-4 group-hover:border-blue-400 transition-all">
                      <div className="w-full h-2 bg-blue-100 rounded mb-2"></div>
                      <div className="w-3/4 h-2 bg-gray-100 rounded mb-2"></div>
                      <div className="w-full h-2 bg-gray-100 rounded mb-2"></div>
                      <div className="w-1/2 h-2 bg-gray-100 rounded"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">टेम्पलेट चुनें...</span>
                  </button>

                </div>
              </div>

              {/* Recent Documents Section (Bottom) */}
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                  हाल के दस्तावेज़ (Recent)
                </h3>
                
                {recentDocuments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>कोई हाल का दस्तावेज़ नहीं है</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <div className="col-span-8 md:col-span-6">नाम (Name)</div>
                      <div className="col-span-4 md:col-span-4 text-right md:text-left">संशोधित (Modified)</div>
                      <div className="hidden md:block col-span-2 text-right">कार्रवाई (Action)</div>
                    </div>
                    
                    {/* List Items */}
                    {recentDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-50 dark:border-gray-800/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          loadRecentDocument(doc);
                          setSidebarPanel('editor');
                          setShowNewDocModal(false);
                        }}
                      >
                        <div className="col-span-8 md:col-span-6 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{doc.title}</div>
                            <div className="text-xs text-gray-500 truncate">{getPreview(doc.content)}</div>
                          </div>
                        </div>
                        <div className="col-span-4 md:col-span-4 text-xs text-gray-500 text-right md:text-left flex items-center justify-end md:justify-start">
                          {formatDate(doc.updatedAt)}
                        </div>
                        <div className="hidden md:flex col-span-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('क्या आप इसे हटाना चाहते हैं?')) deleteRecentDocument(doc.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                            title="हटाएं"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
