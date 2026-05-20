'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useAIStore } from '@/stores/aiStore';
import { useEffect } from 'react';
import {
  FilePlus, FileText, Bot, Type, ScanLine, BookOpen,
  Sparkles, TrendingUp, Clock, Zap
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
  const { newDocument } = useDocumentStore();

  // Check Ollama connection on mount
  useEffect(() => {
    fetch('/api/ai/models')
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, [setConnected]);

  const handleQuickAction = (id: string) => {
    if (id === 'editor') {
      newDocument();
    }
    setSidebarPanel(id as Parameters<typeof setSidebarPanel>[0]);
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'दस्तावेज़', value: '0', icon: FileText, change: 'Documents' },
            { label: 'AI सुधार', value: '0', icon: Bot, change: 'Corrections' },
            { label: 'टेम्पलेट', value: '10', icon: TrendingUp, change: 'Templates' },
            { label: 'हाल के', value: '0', icon: Clock, change: 'Recent' },
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
    </div>
  );
}
