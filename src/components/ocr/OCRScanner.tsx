'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Upload, Loader2, Copy, FileText } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';

export default function OCRScanner() {
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { updateContent } = useDocumentStore();
  const { setSidebarPanel } = useUIStore();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setIsProcessing(true);
    setExtractedText('');

    try {
      // Convert file to base64 data URL
      const base64Image = await fileToBase64(file);

      // Call Groq Vision API via our backend route
      const response = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'OCR API error');
      }

      const data = await response.json();
      setExtractedText(data.text || '❌ कोई टेक्स्ट नहीं मिला।');
    } catch (err) {
      console.error('OCR error:', err);
      setExtractedText(`❌ OCR प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।\n\nError: ${String(err)}`);
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
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>हिंदी और English दोनों से टेक्स्ट निकालें — AI-powered by Llama 4 Scout</p>
            </div>
          </div>
        </motion.div>


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

        {/* Processing State */}
        {isProcessing && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <span className="text-sm font-medium">AI से टेक्स्ट निकाला जा रहा है...</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Llama 4 Scout Vision model processing</p>
              </div>
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
