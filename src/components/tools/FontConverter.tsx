'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, ArrowRight, Copy, Check, RefreshCw } from 'lucide-react';
import { convertFont, conversionOptions } from '@/lib/fontConversion';
import type { FontConversionType } from '@/types';

export default function FontConverterPanel() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [conversionType, setConversionType] = useState<FontConversionType>('hinglish-to-unicode');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setOutput(convertFont(input, conversionType));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    setInput(output);
    setOutput('');
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0984e3, #74b9ff)' }}>
              <Type className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">फ़ॉन्ट कनवर्टर</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Font Conversion Engine</p>
            </div>
          </div>
        </motion.div>

        {/* Conversion Type Selector */}
        <div className="glass-card p-4">
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            रूपांतरण प्रकार (Conversion Type)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {conversionOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setConversionType(opt.value)}
                className={`p-2.5 rounded-lg text-xs text-left transition-all border ${
                  conversionType === opt.value
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border-glass)] hover:border-[var(--border-color)]'
                }`}
                style={{ background: conversionType === opt.value ? 'var(--accent-glow)' : 'var(--bg-tertiary)' }}
              >
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{opt.labelHindi}</span>
                <br />
                <span style={{ color: 'var(--text-muted)' }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input/Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              इनपुट (Input)
            </label>
            <textarea
              className="input-field min-h-[200px] resize-none"
              placeholder="यहाँ टेक्स्ट पेस्ट करें..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontFamily: conversionType.startsWith('krutidev') ? 'Kruti Dev 010' : 'Noto Sans Devanagari' }}
            />
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                आउटपुट (Output)
              </label>
              <button onClick={handleCopy} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-secondary)' }}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'कॉपी हुआ' : 'कॉपी'}
              </button>
            </div>
            <textarea
              className="input-field min-h-[200px] resize-none"
              readOnly
              value={output}
              style={{ fontFamily: conversionType.endsWith('krutidev') ? 'Kruti Dev 010' : 'Noto Sans Devanagari' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={handleConvert}>
            <ArrowRight className="w-4 h-4" />रूपांतरित करें
          </button>
          <button className="btn-secondary" onClick={handleSwap}>
            <RefreshCw className="w-4 h-4 inline mr-1" />स्वैप
          </button>
        </div>
      </div>
    </div>
  );
}
