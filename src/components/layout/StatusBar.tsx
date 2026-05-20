'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useAIStore } from '@/stores/aiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { FileText, Wifi, WifiOff, Type, Minus, Plus } from 'lucide-react';

export default function StatusBar() {
  const { currentDocument, pages, activePageIndex, isDirty, isAutoSaving, zoom, setZoom } = useDocumentStore();
  const { isConnected, setConnected } = useAIStore();
  const { aiModel } = useSettingsStore();

  // Auto-check Groq API connection every 30 seconds
  useEffect(() => {
    const check = () => {
      fetch('/api/ai/models')
        .then(r => r.json())
        .then(d => setConnected(d.connected))
        .catch(() => setConnected(false));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [setConnected]);

  // Calculate statistics from all pages
  const fullContent = pages.join(' ');
  const textContent = fullContent.replace(/<[^>]*>/g, '');
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const charCount = textContent.replace(/\s+/g, '').length;
  const pageCount = pages.length;
  const currentPage = activePageIndex + 1;

  return (
    <div className="status-bar shrink-0">
      <div className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        <span>{currentDocument?.title || 'कोई दस्तावेज़ नहीं'}</span>
      </div>
      <span>|</span>
      <span>पृष्ठ {currentPage} / {pageCount}</span>
      <span>|</span>
      <span>{wordCount} शब्द</span>
      <span>|</span>
      <span>{charCount} वर्ण</span>
      <span>|</span>
      <div className="flex items-center gap-1.5">
        <Type className="w-3.5 h-3.5" />
        <span>Unicode Hindi</span>
      </div>
      <div className="flex-1" />
      {isAutoSaving && <span className="animate-pulse">💾 सहेजा जा रहा है...</span>}
      {isDirty && !isAutoSaving && <span>● असहेजित</span>}
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 border-l border-r border-[#e4e4e4] px-3 dark:border-gray-700 h-full">
        <button 
          onClick={() => setZoom(zoom - 10)} 
          className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-10 text-center text-xs font-medium">{zoom}%</span>
        <button 
          onClick={() => setZoom(zoom + 10)} 
          className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        {isConnected ? (
          <><Wifi className="w-3.5 h-3.5" /><span>AI: {aiModel}</span></>
        ) : (
          <><WifiOff className="w-3.5 h-3.5 opacity-60" /><span>AI: ऑफ़लाइन</span></>
        )}
      </div>
    </div>
  );
}

