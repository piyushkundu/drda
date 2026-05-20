'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Upload, Loader2, Copy, FileText, Languages } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';

export default function OCRScanner() {
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<'hin' | 'eng' | 'hin+eng'>('hin');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { updateContent } = useDocumentStore();
  const { setSidebarPanel } = useUIStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(language, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(file);
      setExtractedText(data.text);
      await worker.terminate();
    } catch (err) {
      setExtractedText('❌ OCR प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setIsProcessing(false);
    }
  };

  const insertIntoEditor = () => {
    const html = extractedText.split('\n').map(line => `<p>${line}</p>`).join('');
    updateContent(html);
    setSidebarPanel('editor');
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdcb6e, #ffeaa7)' }}>
              <ScanLine className="w-5 h-5 text-yellow-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold">OCR स्कैनर</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Extract Hindi text from images using Tesseract.js</p>
            </div>
          </div>
        </motion.div>

        {/* Language Selector */}
        <div className="glass-card p-4">
          <label className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Languages className="w-3.5 h-3.5" />भाषा (Language)
          </label>
          <div className="flex gap-2">
            {([
              { value: 'hin', label: 'हिंदी' },
              { value: 'eng', label: 'English' },
              { value: 'hin+eng', label: 'हिंदी + English' },
            ] as const).map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`badge cursor-pointer ${language === lang.value ? 'badge-info' : ''}`}
                style={language !== lang.value ? { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' } : {}}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="glass-card p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors min-h-[200px]"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Upload className="w-10 h-10 mb-3" style={{ color: 'var(--accent-secondary)' }} />
          <p className="text-sm font-medium">छवि अपलोड करें</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG supported — Click or drag</p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="glass-card p-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>प्रीव्यू</p>
            <img src={preview} alt="OCR Preview" className="max-h-48 rounded-lg border border-white/10 object-contain mx-auto" />
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
              <span className="text-sm">प्रोसेसिंग... {progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'var(--accent-gradient)' }}
              />
            </div>
          </div>
        )}

        {/* Extracted Text */}
        {extractedText && !isProcessing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />निकाला गया टेक्स्ट
              </h3>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs" onClick={() => navigator.clipboard.writeText(extractedText)}>
                  <Copy className="w-3.5 h-3.5 inline mr-1" />कॉपी
                </button>
                <button className="btn-primary text-xs" onClick={insertIntoEditor}>
                  संपादक में डालें
                </button>
              </div>
            </div>
            <pre
              className="p-4 rounded-lg text-sm whitespace-pre-wrap"
              style={{ background: 'var(--bg-tertiary)', fontFamily: 'var(--font-hindi)', color: 'var(--text-primary)' }}
            >
              {extractedText}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}
