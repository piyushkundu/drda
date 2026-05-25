'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

function getEditor(): Editor | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as Record<string, Editor>).__tiptapEditor || null;
}

import { getGlobalFontMode } from '@/components/editor/Editor';

// Specific characters requested by user
const CHARS = ['/', '\\', '?', '!', "'", '"', '>', '<', ':', ';'];

export default function SpecialCharPanel() {
  const [fontMode, setFontMode] = useState<string>('unicode');

  // Poll the global font mode from the editor
  useEffect(() => {
    const check = () => {
      setFontMode(getGlobalFontMode());
    };
    const interval = setInterval(check, 300);
    return () => clearInterval(interval);
  }, []);

  const insertChar = useCallback((char: string) => {
    const editor = getEditor();
    if (!editor) return;
    editor.chain().focus().insertContent(char).run();
  }, []);

  // Only show when Mangal or KrutiDev is active
  if (fontMode !== 'mangal' && fontMode !== 'krutidev') return null;

  return (
    <div className="special-char-panel">
      <div className="special-char-panel__body">
        <div className="special-char-panel__chars">
          {CHARS.map((ch, cIdx) => (
            <button
              key={cIdx}
              className="special-char-panel__char-btn"
              onClick={() => insertChar(ch)}
              title={`Insert ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
