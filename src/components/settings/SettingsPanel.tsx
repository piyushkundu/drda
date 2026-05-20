'use client';

import { motion } from 'framer-motion';
import { Settings, Sun, Moon, Bot, Type, FileDown, Languages } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AIModel, ExportFormat } from '@/types';

export default function SettingsPanel() {
  const {
    theme, defaultFont, defaultFontSize, aiModel, autoCorrect, exportFormat, language,
    setTheme, setDefaultFont, setDefaultFontSize, setAIModel, setAutoCorrect, setExportFormat, setLanguage,
  } = useSettingsStore();

  const fontOptions = ['Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', 'Kruti Dev 010', 'Inter'];
  const fontSizes = [10, 11, 12, 14, 16, 18, 20, 24];

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #636e72, #b2bec3)' }}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">सेटिंग्स</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Application Settings</p>
            </div>
          </div>
        </motion.div>

        {/* Theme */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            {theme === 'dark' ? <Moon className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} /> : <Sun className="w-5 h-5 text-yellow-400" />}
            <h3 className="font-semibold">थीम (Theme)</h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-4 rounded-xl text-center transition-all border ${
                theme === 'dark' ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border-glass)]'
              }`}
              style={{ background: theme === 'dark' ? 'var(--accent-glow)' : 'var(--bg-tertiary)' }}
            >
              <Moon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">डार्क मोड</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-4 rounded-xl text-center transition-all border ${
                theme === 'light' ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border-glass)]'
              }`}
              style={{ background: theme === 'light' ? 'var(--accent-glow)' : 'var(--bg-tertiary)' }}
            >
              <Sun className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">लाइट मोड</span>
            </button>
          </div>
        </div>

        {/* Font Settings */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">फ़ॉन्ट सेटिंग्स</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>डिफ़ॉल्ट फ़ॉन्ट</label>
              <select className="input-field" value={defaultFont} onChange={e => setDefaultFont(e.target.value)}>
                {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>फ़ॉन्ट साइज़</label>
              <select className="input-field" value={defaultFontSize} onChange={e => setDefaultFontSize(Number(e.target.value))}>
                {fontSizes.map(s => <option key={s} value={s}>{s}px</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">AI सेटिंग्स</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>AI मॉडल (Groq)</label>
              <select className="input-field" value={aiModel} onChange={e => setAIModel(e.target.value as AIModel)}>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Best / 16b-level) 🚀</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast) ⚡</option>
                <option value="gemma2-9b-it">Gemma 2 9B ✅</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">ऑटो करेक्शन</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-correct while typing</p>
              </div>
              <button
                onClick={() => setAutoCorrect(!autoCorrect)}
                className={`w-12 h-6 rounded-full transition-colors relative ${autoCorrect ? '' : ''}`}
                style={{ background: autoCorrect ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
              >
                <span
                  className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform"
                  style={{ transform: autoCorrect ? 'translateX(26px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Export Settings */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <FileDown className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
            <h3 className="font-semibold">निर्यात सेटिंग्स</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>डिफ़ॉल्ट फ़ॉर्मेट</label>
              <select className="input-field" value={exportFormat} onChange={e => setExportFormat(e.target.value as ExportFormat)}>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>भाषा (Language)</label>
              <select className="input-field" value={language} onChange={e => setLanguage(e.target.value as 'hi' | 'en')}>
                <option value="hi">हिंदी</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass-card p-5 text-center">
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-hindi)' }}>पेज हिंदी v1.0</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>AI-Powered Hindi Government Office Drafting Suite</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Powered by Groq • Llama 3 • TipTap • Next.js</p>
        </div>
      </div>
    </div>
  );
}
