'use client';

import { useCallback, useState, useEffect } from 'react';

import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2, Table, Minus, Highlighter,
  FileDown, Printer, Bot, Sparkles, Palette, FilePlus, Type, FileText, LayoutTemplate,
  ClipboardPaste, Scissors, Copy, Paintbrush, Strikethrough, Subscript, Superscript, Eraser,
  IndentDecrease, IndentIncrease, Baseline, PaintBucket, Grid, WrapText, ArrowDownAZ,
  Pilcrow, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash, Split, MousePointerClick,
  FolderOpen
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useAIStore } from '@/stores/aiStore';
import { convertFont } from '@/lib/fontConversion';
import { parseDocxToHtml } from '@/lib/docxParser';
import { setGlobalFontMode } from '@/components/editor/Editor';

function getEditor(): Editor | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as Record<string, Editor>).__tiptapEditor || null;
}

function handleSplitTable(editor: Editor): boolean {
  const { state, dispatch } = editor.view;
  const { selection } = state;
  let rowPos = -1;
  let tablePos = -1;
  let depth = selection.$anchor.depth;
  while (depth > 0) {
    const node = selection.$anchor.node(depth);
    if (node.type.name === 'table_row') {
      rowPos = selection.$anchor.before(depth);
    }
    if (node.type.name === 'table') {
      tablePos = selection.$anchor.before(depth);
      break;
    }
    depth--;
  }

  if (rowPos !== -1 && tablePos !== -1) {
    try {
      const tr = state.tr.split(rowPos);
      if (dispatch) {
        dispatch(tr);
        return true;
      }
    } catch (e) {
      console.error("Failed to split table:", e);
    }
  }
  return false;
}

function convertEditorContent(html: string, converter: (t: string) => string, direction: 'krutidev-to-mangal' | 'mangal-to-krutidev'): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Target font family after conversion
  const targetFont = direction === 'krutidev-to-mangal' ? 'Mangal' : "'Kruti Dev 010'";
  const targetFontCheck = direction === 'krutidev-to-mangal' ? /mangal/i : /kruti/i;
  const sourcePattern = direction === 'krutidev-to-mangal' ? /Kruti\s*Dev\s*\d*/i : /Mangal|Noto\s*Sans\s*Devanagari/i;
  
  // Check if text is primarily Devanagari Unicode (already converted)
  const isDevanagari = (text: string): boolean => {
    const devanagariChars = text.match(/[\u0900-\u097F]/g);
    return !!devanagariChars && devanagariChars.length > text.length * 0.3;
  };
  
  // Check if text is primarily ASCII (KrutiDev encoded)
  const isAsciiKrutiDev = (text: string): boolean => {
    const asciiChars = text.match(/[a-zA-Z]/g);
    return !!asciiChars && asciiChars.length > text.length * 0.3;
  };

  // Check if an element or any ancestor already has the target font
  const hasTargetFont = (el: Node): boolean => {
    let node: Node | null = el;
    while (node && node !== div) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const style = (node as HTMLElement).style;
        if (style && style.fontFamily && targetFontCheck.test(style.fontFamily)) {
          return true;
        }
      }
      node = node.parentNode;
    }
    return false;
  };
  
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const text = node.textContent;
      if (!text.trim()) return; // skip whitespace-only
      
      let shouldConvert = true;
      if (direction === 'krutidev-to-mangal') {
        if (isDevanagari(text)) shouldConvert = false;
      } else {
        if (isAsciiKrutiDev(text)) shouldConvert = false;
      }
      
      if (shouldConvert) {
        node.textContent = converter(text);
      }
      
      // Ensure this text node's parent has the target font
      // If not, wrap the text node in a span with the target font
      if (!hasTargetFont(node)) {
        const span = document.createElement('span');
        span.style.fontFamily = targetFont;
        node.parentNode?.insertBefore(span, node);
        span.appendChild(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      
      // Update font-family in inline styles if present
      if (el.style && el.style.fontFamily) {
        if (sourcePattern.test(el.style.fontFamily)) {
          el.style.fontFamily = targetFont;
        }
      }
      
      // Recurse into children (copy to array first since we may modify the DOM)
      Array.from(el.childNodes).forEach(walk);
    }
  };
  walk(div);
  
  return div.innerHTML;
}

const fontFamilies = [
  { label: 'Noto Sans Devanagari', value: 'Noto Sans Devanagari' },
  { label: 'Mangal', value: 'Mangal' },
  { label: 'Arial Unicode', value: 'Arial Unicode MS' },
  { label: 'Kruti Dev 010', value: 'Kruti Dev 010' },
  { label: 'Inter', value: 'Inter' },
];

const fontSizes = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
const colors = [
  '#000000', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#ffffff',
];

export type FontMode = 'unicode' | 'mangal' | 'krutidev';

// ── Auto-pagination: Split HTML into page-sized chunks ──────────────
// Mimics MS Word page flow: renders content offscreen with exact page
// dimensions, measures each block, and splits at page boundaries.
const PAGE_CONTENT_HEIGHT = 931; // 1123px page height - 96px top - 96px bottom padding

function splitHtmlIntoPages(html: string): string[] {
  // Create an offscreen container that matches the exact page content area
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; top: -99999px; left: -99999px;
    width: 656px;
    font-family: 'Noto Sans Devanagari', 'Mangal', serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a2e;
    visibility: hidden;
    overflow: visible;
  `;
  // Add table styles to match the editor
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .pg-measure table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    .pg-measure table td, .pg-measure table th { border: 1.5px solid #c0c0d0; padding: 8px 12px; vertical-align: top; }
    .pg-measure table th { background: #f0f0f8; font-weight: 600; }
    .pg-measure p { margin-top: 0; margin-bottom: 0; }
    .pg-measure h1 { font-size: 1.8em; font-weight: 700; margin: 0.5em 0; }
    .pg-measure h2 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0; }
    .pg-measure h3 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0; }
    .pg-measure ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
    .pg-measure ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
    .pg-measure li { margin-bottom: 0.25rem; }
  `;
  document.head.appendChild(styleTag);
  container.classList.add('pg-measure');
  document.body.appendChild(container);

  // Parse HTML and extract top-level block elements
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Collect all top-level child nodes as blocks
  const blocks: HTMLElement[] = [];
  const childNodes = Array.from(tempDiv.childNodes);

  for (const node of childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      blocks.push(node as HTMLElement);
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      // Wrap orphan text nodes in <p>
      const p = document.createElement('p');
      p.textContent = node.textContent;
      blocks.push(p);
    }
  }

  // If no blocks found, return the whole HTML as one page
  if (blocks.length === 0) {
    document.body.removeChild(container);
    document.head.removeChild(styleTag);
    return [html || '<p></p>'];
  }

  // Measure each block's rendered height
  const blockHeights: number[] = [];
  for (const block of blocks) {
    // Clear container and add only this block to measure
    container.innerHTML = '';
    container.appendChild(block.cloneNode(true));
    // Force layout
    const height = container.getBoundingClientRect().height;
    blockHeights.push(height);
  }

  // Now split blocks across pages
  const pages: string[] = [];
  let currentPageBlocks: string[] = [];
  let currentHeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const blockHeight = blockHeights[i];
    const blockHtml = blocks[i].outerHTML;

    // If this single block is taller than a page, it goes on its own page
    if (blockHeight > PAGE_CONTENT_HEIGHT) {
      // First, save any current accumulated blocks as a page
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks.join(''));
        currentPageBlocks = [];
        currentHeight = 0;
      }
      // Put the oversized block on its own page
      pages.push(blockHtml);
      continue;
    }

    // Check if adding this block would overflow the current page
    if (currentHeight + blockHeight > PAGE_CONTENT_HEIGHT && currentPageBlocks.length > 0) {
      // Save current page
      pages.push(currentPageBlocks.join(''));
      currentPageBlocks = [];
      currentHeight = 0;
    }

    currentPageBlocks.push(blockHtml);
    currentHeight += blockHeight;
  }

  // Don't forget the last page
  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks.join(''));
  }

  // Cleanup
  document.body.removeChild(container);
  document.head.removeChild(styleTag);

  // Ensure at least one page
  if (pages.length === 0) {
    pages.push('<p></p>');
  }

  return pages;
}

// Expose fontMode globally so Editor.tsx can read it
declare global {
  interface Window {
    __fontMode: FontMode;
  }
}

export default function RibbonToolbar() {

  const { ribbonTab, setRibbonTab, setSidebarPanel, directCursorMode, toggleDirectCursorMode } = useUIStore();
  const { isAutoSuggestEnabled, setAutoSuggestEnabled } = useAIStore();
  const { aiModel } = useSettingsStore();
  const theme = useSettingsStore(s => s.theme);
  const [fontMode, setFontMode] = useState<FontMode>('unicode');
  const [currentFontSize, setCurrentFontSize] = useState<string>('14');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formatPainter, setFormatPainter] = useState<Record<string, any> | null>(null);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  const runCmd = useCallback((callback: (editor: Editor) => void) => {
    const editor = getEditor();
    if (editor) callback(editor);
  }, []);

  const isActive = useCallback((check: string | Record<string, unknown>, attrs?: Record<string, unknown>) => {
    const editor = getEditor();
    if (!editor) return false;
    return editor.isActive(check as string, attrs);
  }, []);

  // Listen for cursor position changes to update the font dropdown automatically
  useEffect(() => {
    let checkInterval: number;
    
    const initListener = () => {
      const editor = getEditor();
      if (editor) {
        editor.on('transaction', () => {
          const textStyle = editor.getAttributes('textStyle');
          const fontFamily = textStyle.fontFamily || '';
          
          let detectedMode: FontMode = 'unicode';
          if (/kruti/i.test(fontFamily)) detectedMode = 'krutidev';
          else if (/mangal/i.test(fontFamily)) detectedMode = 'mangal';
          else if (/noto|inter/i.test(fontFamily)) detectedMode = 'unicode';
          
          setFontMode((prev) => {
            if (prev !== detectedMode) {
              setGlobalFontMode(detectedMode);
              return detectedMode;
            }
            return prev;
          });

          // Sync font size
          const fSize = textStyle.fontSize;
          if (fSize) {
            setCurrentFontSize(fSize.replace('px', ''));
          } else {
            setCurrentFontSize('14'); // default fallback
          }
        });
        clearInterval(checkInterval);
      }
    };
    
    checkInterval = window.setInterval(initListener, 500);
    return () => {
      clearInterval(checkInterval);
      const editor = getEditor();
      if (editor) editor.off('transaction');
    };
  }, []);

  // ── Font mode switch ── sets font + activates keyboard interceptor
  const switchFontMode = useCallback((mode: FontMode) => {
    setFontMode(mode);
    setGlobalFontMode(mode); // activates phonetic keyboard in Editor
    const editor = getEditor();
    if (!editor) return;
    const fontName = mode === 'mangal' ? 'Mangal'
      : mode === 'krutidev' ? "'Kruti Dev 010'"
      : 'Noto Sans Devanagari';
    editor.chain().focus().selectAll().setFontFamily(fontName).run();
    const end = editor.state.doc.content.size;
    editor.commands.setTextSelection(end);
  }, []);

  // ── Convert existing content ──
  // Only converts text encoding + updates font-family in existing spans.
  // Does NOT use selectAll or change any paragraph-level formatting.
  const convertContent = useCallback((direction: 'krutidev-to-mangal' | 'mangal-to-krutidev') => {
    const editor = getEditor();
    if (!editor) return;
    
    // Save cursor position
    const { from } = editor.state.selection;
    
    const html = editor.getHTML();
    const converted = convertEditorContent(html, (t) => {
      try { return convertFont(t, direction); } catch { return t; }
    }, direction);
    
    // Set content back — preserves all paragraph/node attributes (indent, align, etc.)
    editor.commands.setContent(converted);
    
    // Update font mode state WITHOUT calling selectAll().setFontFamily()
    const newMode: FontMode = direction === 'krutidev-to-mangal' ? 'mangal' : 'krutidev';
    setFontMode(newMode);
    setGlobalFontMode(newMode);
    
    // Restore cursor position (clamped to document size)
    const maxPos = editor.state.doc.content.size;
    editor.commands.setTextSelection(Math.min(from, maxPos));
  }, []);

  // ── Manual Page Break ───────────────────────────────
  const handleNewPage = useCallback(() => {
    const editor = getEditor();
    if (editor) {
      editor.commands.insertContent('<hr class="page-break" />');
    }
  }, []);

  // Reads .docx/.html/.htm and imports all content into the continuous editor,
  // separating Word sections with visual page breaks if necessary.
  const openLocalFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.doc,.html,.htm';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) return;

      setIsImporting(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      try {
        let finalHtml = '';

        // ── HTML / HTM — read raw HTML and inline CSS ──
        if (ext === 'html' || ext === 'htm') {
          const text = await file.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');

          // Collect all <style> blocks and embed them as inline styles
          const styleSheets = doc.querySelectorAll('style');
          let combinedCSS = '';
          styleSheets.forEach(s => { combinedCSS += s.textContent || ''; });

          // Inline critical table/cell styles from stylesheets into elements
          if (combinedCSS) {
            try {
              const tempStyle = document.createElement('style');
              tempStyle.textContent = combinedCSS;
              document.head.appendChild(tempStyle);
              const sheet = tempStyle.sheet;
              if (sheet) {
                for (let i = 0; i < sheet.cssRules.length; i++) {
                  const rule = sheet.cssRules[i] as CSSStyleRule;
                  if (!rule.selectorText) continue;
                  try {
                    const targets = doc.body.querySelectorAll(rule.selectorText);
                    targets.forEach(el => {
                      const htmlEl = el as HTMLElement;
                      for (let j = 0; j < rule.style.length; j++) {
                        const prop = rule.style[j];
                        if (!htmlEl.style.getPropertyValue(prop)) {
                          htmlEl.style.setProperty(prop, rule.style.getPropertyValue(prop), rule.style.getPropertyPriority(prop));
                        }
                      }
                    });
                  } catch { /* selector may not be valid */ }
                }
              }
              document.head.removeChild(tempStyle);
            } catch { /* CSS parsing error, skip */ }
          }

          doc.body.querySelectorAll('script, style, meta, link').forEach(el => el.remove());
          finalHtml = doc.body.innerHTML.trim();
        }
        // ── DOCX / DOC — use custom parser for exact styling ──
        else if (ext === 'docx' || ext === 'doc') {
          const arrayBuffer = await file.arrayBuffer();
          finalHtml = await parseDocxToHtml(arrayBuffer);
        }

        // ── Auto-paginate the content across multiple pages ──
        if (finalHtml) {
          // Load the full continuous content into the store
          useDocumentStore.getState().loadFileAsPages([finalHtml], file.name);
          
          // Auto-detect font for the whole document
          setTimeout(() => {
            const editor = getEditor();
            if (editor) {
              const text = editor.getText();
              if (/[a-zA-Z]/.test(text) && !/[\u0900-\u097F]/.test(text)) {
                setFontMode('krutidev');
                setGlobalFontMode('krutidev');
              }
            }
          }, 500);
        }
      } catch (err) {
        console.error('Failed to open file:', err);
        alert('फ़ाइल खोलने में त्रुटि। कृपया .docx या .html फ़ाइल चुनें।');
      } finally {
        setIsImporting(false);
      }
    });

    input.click();
  }, []);

  // ── PDF Download ────────────────────────────────────────────────────
  const downloadPdf = useCallback(async () => {
    const editor = getEditor();
    if (!editor) return;
    setIsExporting(true);
    try {
      const html = editor.getHTML();
      const printDiv = document.createElement('div');
      printDiv.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: 794px; padding: 60px 80px;
        font-family: 'Noto Sans Devanagari', Arial, sans-serif;
        font-size: 14px; line-height: 1.8; color: #000;
        background: white;
      `;
      printDiv.innerHTML = html;
      document.body.appendChild(printDiv);
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(printDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(printDiv);
      const { default: jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, heightLeft - pdfHeight, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('document.pdf');
    } catch (err) { console.error(err); alert('PDF export failed.'); }
    finally { setIsExporting(false); }
  }, []);

  // ── DOCX Download ───────────────────────────────────────────────────
  const downloadDocx = useCallback(async () => {
    const editor = getEditor();
    if (!editor) return;
    setIsExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const html = editor.getHTML();
      const div = document.createElement('div');
      div.innerHTML = html;
      const paragraphs: InstanceType<typeof Paragraph>[] = [];
      div.querySelectorAll('p, h1, h2, h3, li').forEach((el) => {
        const text = el.textContent || '';
        const tag = el.tagName.toLowerCase();
        const isHeading = ['h1', 'h2', 'h3'].includes(tag);
        paragraphs.push(new Paragraph({
          heading: isHeading ? (tag === 'h1' ? HeadingLevel.HEADING_1 : tag === 'h2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3) : undefined,
          children: [new TextRun({
            text,
            bold: el.closest('strong') !== null || isHeading,
            font: fontMode === 'mangal' ? 'Mangal' : fontMode === 'krutidev' ? 'Kruti Dev 010' : 'Noto Sans Devanagari',
            size: 28,
          })],
        }));
      });
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'document.docx'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('DOCX export failed.'); }
    finally { setIsExporting(false); }
  }, [fontMode]);

  // ── Font Size Controls ──────────────────────────────────────────────
  const changeFontSize = useCallback((delta: number) => {
    const editor = getEditor();
    if (!editor) return;
    const currentSize = editor.getAttributes('textStyle').fontSize || '14px';
    const parsed = parseInt(currentSize);
    if (!isNaN(parsed)) {
      const newSize = Math.max(8, parsed + delta);
      editor.chain().focus().setFontSize(`${newSize}px`).run();
    }
  }, []);

  // ── Format Painter ──────────────────────────────────────────────────
  const toggleFormatPainter = useCallback(() => {
    if (formatPainter) {
      setFormatPainter(null);
    } else {
      const editor = getEditor();
      if (!editor) return;
      setFormatPainter({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        subscript: editor.isActive('subscript'),
        superscript: editor.isActive('superscript'),
        fontSize: editor.getAttributes('textStyle').fontSize,
        fontFamily: editor.getAttributes('textStyle').fontFamily,
        color: editor.getAttributes('textStyle').color,
      });
    }
  }, [formatPainter]);

  useEffect(() => {
    if (!formatPainter) return;
    const editor = getEditor();
    if (!editor) return;
    
    const handleSelectionUpdate = () => {
      const { empty } = editor.state.selection;
      if (!empty) {
        const chain = editor.chain().focus();
        if (formatPainter.bold) chain.setBold(); else chain.unsetBold();
        if (formatPainter.italic) chain.setItalic(); else chain.unsetItalic();
        if (formatPainter.underline) chain.setUnderline(); else chain.unsetUnderline();
        if (formatPainter.strike) chain.setStrike(); else chain.unsetStrike();
        if (formatPainter.subscript) chain.setSubscript(); else chain.unsetSubscript();
        if (formatPainter.superscript) chain.setSuperscript(); else chain.unsetSuperscript();
        if (formatPainter.fontSize) chain.setFontSize(formatPainter.fontSize);
        if (formatPainter.fontFamily) chain.setFontFamily(formatPainter.fontFamily);
        if (formatPainter.color) chain.setColor(formatPainter.color);
        
        chain.run();
        setFormatPainter(null); // Turn off after applying
      }
    };
    
    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [formatPainter]);

  return (
    <div className="ribbon-toolbar shrink-0 relative z-[100]">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-white/5 px-3">
        {(['home', 'insert', 'convert', 'export', 'ai'] as const).map((tab) => (
          <button key={tab} onClick={() => setRibbonTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors relative ${
              ribbonTab === tab ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}>
            {tab === 'home' ? 'Home' : tab === 'insert' ? 'Insert' : tab === 'convert' ? 'Convert' : tab === 'export' ? 'Export' : 'AI'}
            {ribbonTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--accent-gradient)' }} />}
          </button>
        ))}
      </div>

      {/* Ribbon Content */}
      <div className="flex items-stretch gap-1 px-2 py-1.5 flex-wrap md:flex-nowrap relative z-50 min-h-[90px]">

        {/* ── NEW PAGE (always visible) ── */}
        <div className="flex flex-col items-center justify-center px-2 border-r border-[#e4e4e4] dark:border-gray-700">
          <button className="flex flex-col items-center justify-center gap-1 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded min-w-[48px] h-full" onClick={handleNewPage} title="Add a new page to this document (Page Break)">
            <FilePlus className="w-6 h-6 text-blue-500" />
            <span className="text-[10px] mt-1">Add Page</span>
          </button>
        </div>

        {/* ── HOME TAB ── */}
        {ribbonTab === 'home' && (<>
          
          {/* Clipboard Group */}
          <div className="flex flex-col justify-start h-full px-2 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-start gap-1 h-full">
              <button className="flex flex-col items-center justify-center gap-1 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded h-[56px] w-[48px]" onClick={() => navigator.clipboard.readText().then(t => runCmd(ed => ed.chain().focus().insertContent(t).run())).catch(()=>alert('Clipboard access denied'))}>
                <ClipboardPaste className="w-7 h-7 text-yellow-600" />
                <span className="text-[10px] leading-tight">Paste</span>
              </button>
              <div className="flex flex-col gap-0.5 justify-start">
                <button className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded text-xs" onClick={() => document.execCommand('cut')}>
                  <Scissors className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /> <span>Cut</span>
                </button>
                <button className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded text-xs" onClick={() => document.execCommand('copy')}>
                  <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" /> <span>Copy</span>
                </button>
                <button className={`flex items-center gap-1.5 px-1 py-0.5 rounded text-xs ${formatPainter ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={toggleFormatPainter}>
                  <Paintbrush className="w-3.5 h-3.5" /> <span>Format Painter</span>
                </button>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Clipboard</div>
          </div>

          {/* Font Group */}
          <div className="flex flex-col justify-start h-full px-2 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <select className="select-field w-[130px] h-[24px] text-xs shrink-0"
                  onChange={(e) => {
                    const val = e.target.value;
                    const fontToSet = val === 'Kruti Dev 010' ? "'Kruti Dev 010'" : val;
                    runCmd((ed) => ed.chain().focus().setFontFamily(fontToSet).run());
                    let newMode: FontMode = 'unicode';
                    if (val === 'Mangal') newMode = 'mangal';
                    else if (val === 'Kruti Dev 010') newMode = 'krutidev';
                    setFontMode(newMode);
                    setGlobalFontMode(newMode);
                  }}
                  value={fontMode === 'krutidev' ? 'Kruti Dev 010' : fontMode === 'mangal' ? 'Mangal' : 'Noto Sans Devanagari'}>
                  {fontFamilies.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select className="select-field w-[50px] h-[24px] text-xs shrink-0"
                  onChange={(e) => runCmd((ed) => ed.chain().focus().setFontSize(`${e.target.value}px`).run())}
                  value={currentFontSize}>
                  {fontSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => changeFontSize(2)} className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded text-xs font-bold shrink-0" title="Increase Font Size">A^</button>
                <button onClick={() => changeFontSize(-2)} className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded text-xs font-bold shrink-0" title="Decrease Font Size">Av</button>
                <button onClick={() => runCmd(ed => ed.chain().focus().unsetAllMarks().run())} className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded shrink-0" title="Clear Formatting"><Eraser className="w-3.5 h-3.5 text-[#e74c3c]" /></button>
              </div>
              <div className="flex items-center gap-0.5">
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleBold().run())} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleItalic().run())} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('underline') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleUnderline().run())} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('strike') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleStrike().run())} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('subscript') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleSubscript().run())} title="Subscript"><Subscript className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('superscript') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleSuperscript().run())} title="Superscript"><Superscript className="w-3.5 h-3.5" /></button>
                
                <div className="w-[1px] h-4 bg-[#e4e4e4] dark:bg-gray-700 mx-1" />
                
                {/* Highlight */}
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => runCmd((ed) => ed.chain().focus().toggleHighlight({ color: '#fef08a' }).run())} title="Text Highlight Color"><Highlighter className="w-3.5 h-3.5 text-yellow-500" /></button>
                
                {/* Font Color */}
                <div className="relative group flex items-center z-10">
                  <button className="w-6 h-6 flex flex-col items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Font Color">
                    <Baseline className="w-3.5 h-3.5" />
                    <div className="w-3 h-[3px] bg-red-500 mt-[1px]" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 p-2 glass-card hidden group-hover:grid grid-cols-3 gap-1 min-w-[120px]">
                    {colors.map((c) => (
                      <button key={c} className="w-7 h-7 rounded-md border border-white/10 hover:scale-110 transition-transform"
                        style={{ background: c }} onClick={() => runCmd((ed) => ed.chain().focus().setColor(c).run())} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Font</div>
          </div>

          {/* Paragraph Group */}
          <div className="flex flex-col justify-start h-full px-2 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-0.5">
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleBulletList().run())} title="Bullets"><List className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().toggleOrderedList().run())} title="Numbering"><ListOrdered className="w-3.5 h-3.5" /></button>
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Multilevel List"><WrapText className="w-3.5 h-3.5" /></button>
                <div className="w-[1px] h-4 bg-[#e4e4e4] dark:bg-gray-700 mx-1" />
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Decrease Indent"><IndentDecrease className="w-3.5 h-3.5" /></button>
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Increase Indent"><IndentIncrease className="w-3.5 h-3.5" /></button>
                <div className="w-[1px] h-4 bg-[#e4e4e4] dark:bg-gray-700 mx-1" />
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Sort"><ArrowDownAZ className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${directCursorMode ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={toggleDirectCursorMode} title="Direct Cursor Mode (Click to Type)"><MousePointerClick className="w-3.5 h-3.5" /></button>
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Show/Hide ¶"><Pilcrow className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-0.5">
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive({ textAlign: 'left' }) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().setTextAlign('left').run())} title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive({ textAlign: 'center' }) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().setTextAlign('center').run())} title="Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive({ textAlign: 'right' }) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().setTextAlign('right').run())} title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                <button className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isActive({ textAlign: 'justify' }) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/10'}`} onClick={() => runCmd((ed) => ed.chain().focus().setTextAlign('justify').run())} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
                <div className="w-[1px] h-4 bg-[#e4e4e4] dark:bg-gray-700 mx-1" />
                <div className="relative group flex items-center z-20">
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Line and Paragraph Spacing">
                    <Baseline className="w-3.5 h-3.5 rotate-90 text-blue-600 dark:text-blue-400" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg hidden group-hover:flex flex-col gap-0.5 min-w-[100px] z-50">
                    {[
                      { label: '1.0 (Single)', value: '1.0' },
                      { label: '1.15', value: '1.15' },
                      { label: '1.25', value: '1.25' },
                      { label: '1.5', value: '1.5' },
                      { label: '1.8 (डिफ़ॉल्ट)', value: '1.8' },
                      { label: '2.0 (Double)', value: '2.0' },
                      { label: '2.5', value: '2.5' },
                      { label: '3.0', value: '3.0' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        className="px-2 py-1 text-[11px] text-left text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors whitespace-nowrap"
                        onClick={() => runCmd((ed) => ed.chain().focus().setLineHeight(item.value).run())}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-6 h-6 flex flex-col items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Shading">
                  <PaintBucket className="w-3.5 h-3.5" />
                  <div className="w-3 h-[3px] bg-transparent border border-gray-400 mt-[1px]" />
                </button>
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10" title="Borders"><Grid className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Paragraph</div>
          </div>

          {/* Undo / Redo Group */}
          <div className="flex flex-col justify-start h-full px-2 relative pb-4">
            <div className="flex items-center gap-1 h-full">
              <button className="flex flex-col items-center justify-center gap-1 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded h-[56px] w-[40px]" onClick={() => runCmd((ed) => ed.chain().focus().undo().run())}>
                <Undo2 className="w-6 h-6 text-blue-500" />
                <span className="text-[10px] leading-tight">Undo</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded h-[56px] w-[40px]" onClick={() => runCmd((ed) => ed.chain().focus().redo().run())}>
                <Redo2 className="w-6 h-6 text-blue-500" />
                <span className="text-[10px] leading-tight">Redo</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">History</div>
          </div>
          
        </>)}

        {/* ── INSERT TAB ── */}
        {ribbonTab === 'insert' && (<>
          {/* Table Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full z-30">
              <div className="relative group flex items-center h-full">
                <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-transparent hover:border-blue-100 dark:hover:border-blue-850">
                  <Table className="w-5 h-5 text-blue-500" />
                  <span className="text-[10px] font-medium">Table ▾</span>
                </button>
                
                {/* Visual Grid Selector Dropdown */}
                <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl hidden group-hover:flex flex-col gap-3 min-w-[220px] z-50">
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-150 dark:border-gray-700 pb-1 flex justify-between">
                    <span>तालिका आकार</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : 'ग्रिड चुनें'}
                    </span>
                  </div>
                  
                  {/* 10 x 8 Grid container */}
                  <div 
                    className="grid grid-cols-10 gap-[2px] p-0.5 bg-gray-50 dark:bg-gray-900 rounded border border-gray-150 dark:border-gray-800"
                    onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
                  >
                    {Array.from({ length: 8 }).map((_, rIdx) => {
                      const r = rIdx + 1;
                      return Array.from({ length: 10 }).map((_, cIdx) => {
                        const c = cIdx + 1;
                        const isActiveGrid = r <= hoverRow && c <= hoverCol;
                        return (
                          <div
                            key={`${r}-${c}`}
                            onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                            onClick={() => {
                              runCmd((ed) => ed.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run());
                            }}
                            className={`w-4 h-4 rounded-sm border transition-all cursor-pointer ${
                              isActiveGrid 
                                ? 'bg-blue-500 border-blue-600 scale-[1.05] shadow-sm' 
                                : 'bg-white dark:bg-gray-800 border-gray-250 dark:border-gray-750 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                            }`}
                          />
                        );
                      });
                    })}
                  </div>

                  {/* Manual input inputs */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-150 dark:border-gray-700">
                    <div className="text-[10px] font-semibold text-gray-400">कस्टम आकार दर्ज करें:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">कॉलम:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={tableCols} 
                          onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-[11px] font-medium outline-none text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">पंक्ति:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="30" 
                          value={tableRows} 
                          onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-[11px] font-medium outline-none text-center"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        runCmd((ed) => ed.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run());
                      }}
                      className="w-full py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors"
                    >
                      तालिका जोड़ें
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Table</div>
          </div>

          {/* Row & Column Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-1.5 h-full">
              {/* Insert Sub-group */}
              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700" onClick={() => runCmd((ed) => ed.chain().focus().addRowBefore().run())} title="Insert Row Above">
                    <ArrowUp className="w-2.5 h-2.5 text-blue-500" />
                    <span>ऊपर पंक्ति</span>
                  </button>
                  <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700" onClick={() => runCmd((ed) => ed.chain().focus().addRowAfter().run())} title="Insert Row Below">
                    <ArrowDown className="w-2.5 h-2.5 text-blue-500" />
                    <span>नीचे पंक्ति</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700" onClick={() => runCmd((ed) => ed.chain().focus().addColumnBefore().run())} title="Insert Column Left">
                    <ArrowLeft className="w-2.5 h-2.5 text-blue-500" />
                    <span>बाएँ कॉलम</span>
                  </button>
                  <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700" onClick={() => runCmd((ed) => ed.chain().focus().addColumnAfter().run())} title="Insert Column Right">
                    <ArrowRight className="w-2.5 h-2.5 text-blue-500" />
                    <span>दाएँ कॉलम</span>
                  </button>
                </div>
              </div>

              {/* Delete Sub-group */}
              <div className="w-[1px] h-8 bg-gray-200 dark:bg-gray-700 mx-0.5" />
              <div className="flex flex-col gap-1 justify-center">
                <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40" onClick={() => runCmd((ed) => ed.chain().focus().deleteRow().run())} title="Delete Selected Row">
                  <Trash className="w-2.5 h-2.5" />
                  <span>पंक्ति हटाएँ</span>
                </button>
                <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40" onClick={() => runCmd((ed) => ed.chain().focus().deleteColumn().run())} title="Delete Selected Column">
                  <Trash className="w-2.5 h-2.5" />
                  <span>कॉलम हटाएँ</span>
                </button>
              </div>
              <button className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-transparent" onClick={() => runCmd((ed) => ed.chain().focus().deleteTable().run())} title="Delete Entire Table">
                <Trash className="w-4 h-4" />
                <span className="text-[9px] font-semibold">तालिका हटाएँ</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Rows & Columns</div>
          </div>

          {/* Merge & Split Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg h-[56px] min-w-[56px] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all border border-transparent" onClick={() => runCmd((ed) => ed.chain().focus().mergeCells().run())} title="Merge Selected Cells">
                <span className="text-base font-bold">⊞</span>
                <span className="text-[9px] font-semibold leading-tight text-center">Merge<br/>Cells</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg h-[56px] min-w-[56px] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all border border-transparent" onClick={() => runCmd((ed) => ed.chain().focus().splitCell().run())} title="Split Merged Cell back to individual cells">
                <span className="text-base font-bold">⊟</span>
                <span className="text-[9px] font-semibold leading-tight text-center">Split<br/>Cell</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg h-[56px] min-w-[56px] hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-all border border-transparent" onClick={() => runCmd((ed) => {
                const success = handleSplitTable(ed);
                if (!success) {
                  alert("कृपया कर्सर को उस पंक्ति में रखें जहाँ से आप तालिका को दो हिस्सों में विभाजित करना चाहते हैं।");
                }
              })} title="Split Table into two separate tables at cursor row">
                <Split className="w-4 h-4 text-purple-500" />
                <span className="text-[9px] font-semibold leading-tight text-center">Split<br/>Table</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Merge & Split</div>
          </div>

          {/* General Tools */}
          <div className="flex flex-col justify-start h-full px-3 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg h-[56px] min-w-[50px] hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all" onClick={() => runCmd((ed) => ed.chain().focus().setHorizontalRule().run())} title="Insert Horizontal Rule Line">
                <Minus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Line</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Format</div>
          </div>
        </>)}

        {/* ── CONVERT TAB ── */}
        {ribbonTab === 'convert' && (<>
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              {fontMode === 'krutidev' ? (
                <button
                  onClick={() => convertContent('krutidev-to-mangal')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 2px 8px rgba(168,85,247,0.3)' }}
                  title="Convert KrutiDev text to Mangal (Unicode)">
                  <Type className="w-4 h-4" />
                  KrutiDev → Mangal
                </button>
              ) : (
                <button
                  onClick={() => convertContent('mangal-to-krutidev')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
                  title="Convert Mangal (Unicode) text to KrutiDev">
                  <Type className="w-4 h-4" />
                  Mangal → KrutiDev
                </button>
              )}
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Font Conversion</div>
          </div>
        </>)}

        {/* ── EXPORT TAB ── */}
        {ribbonTab === 'export' && (<>
          {/* Open File Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[60px] transition-all hover:shadow-md ${isImporting ? 'opacity-50 cursor-wait' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                onClick={openLocalFile}
                disabled={isImporting}
                title="लोकल फ़ाइल खोलें (DOCX / HTML)"
              >
                <FolderOpen className="w-5 h-5 text-orange-500" />
                <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">Open File</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Open</div>
          </div>
          {/* Download Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md ${isExporting ? 'opacity-50 cursor-wait' : 'hover:bg-red-50 dark:hover:bg-red-900/20'}`} onClick={downloadPdf} disabled={isExporting} title="Download PDF">
                <FileText className="w-5 h-5 text-red-500" />
                <span className="text-[10px] font-medium text-red-600 dark:text-red-400">PDF</span>
              </button>
              <button className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md ${isExporting ? 'opacity-50 cursor-wait' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}`} onClick={downloadDocx} disabled={isExporting} title="Download Word DOCX">
                <FileDown className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">DOCX</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => {
                const editor = getEditor(); if (!editor) return;
                const fontStack = fontMode === 'mangal' ? 'Mangal' : fontMode === 'krutidev' ? 'Kruti Dev 010' : "'Noto Sans Devanagari'";
                const blob = new Blob([`<html><head><meta charset="utf-8"><style>body{font-family:${fontStack},sans-serif;padding:60px 80px;line-height:1.8;}</style></head><body>${editor.getHTML()}</body></html>`], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'document.html'; a.click();
                URL.revokeObjectURL(url);
              }} title="Download HTML">
                <FileDown className="w-5 h-5 text-green-500" />
                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">HTML</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Download</div>
          </div>
          <div className="flex flex-col justify-start h-full px-3 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => window.print()} title="Print Document">
                <Printer className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Print</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Print</div>
          </div>
          {isImporting && <span className="text-xs text-orange-500 ml-2 animate-pulse flex items-center gap-1">📂 फ़ाइल खोल रहे हैं...</span>}
          {isExporting && <span className="text-xs text-yellow-500 ml-2 animate-pulse flex items-center gap-1">⏳ Exporting...</span>}
        </>)}

        {/* ── AI TAB ── */}
        {ribbonTab === 'ai' && (<>
          {/* Assistant Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button 
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[60px] transition-all ${isAutoSuggestEnabled ? 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 border border-transparent'}`} 
                onClick={() => setAutoSuggestEnabled(!isAutoSuggestEnabled)} 
                title="Toggle inline Auto-Suggest for Social Audit terms">
                <Bot className={`w-5 h-5 ${isAutoSuggestEnabled ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-medium leading-tight text-center">Auto<br/>Suggest</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">Assistant</div>
          </div>

          {/* AI Tools Group */}
          <div className="flex flex-col justify-start h-full px-3 border-r border-[#e4e4e4] dark:border-gray-700 relative pb-4">
            <div className="flex items-center gap-2 h-full">
              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400" onClick={() => {
                const editor = getEditor(); if (!editor) return;
                const html = editor.getHTML();
                if (!html.trim()) return;

                // Detect if content is in KrutiDev font mode
                const isKrutiDev = fontMode === 'krutidev';

                // If KrutiDev, convert to Unicode first so AI can understand Hindi
                let htmlToSend = html;
                if (isKrutiDev) {
                  htmlToSend = convertEditorContent(html, (t) => {
                    try { return convertFont(t, 'krutidev-to-mangal'); } catch { return t; }
                  }, 'krutidev-to-mangal');
                }

                fetch('/api/ai/correct', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: htmlToSend, model: aiModel }) })
                  .then(async (res) => {
                    const reader = res.body?.getReader(); if (!reader) return;
                    const decoder = new TextDecoder(); let result = '';
                    while (true) {
                      const { done, value } = await reader.read(); if (done) break;
                      const chunk = decoder.decode(value, { stream: true });
                      chunk.split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
                        const data = line.slice(6); if (data === '[DONE]') return;
                        try { result += JSON.parse(data).text; } catch {}
                      });
                    }
                    if (result) {
                      // Remove markdown code fences if the AI wraps output in ```html ... ```
                      result = result.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

                      // If original was KrutiDev, convert corrected Unicode back to KrutiDev
                      if (isKrutiDev) {
                        result = convertEditorContent(result, (t) => {
                          try { return convertFont(t, 'mangal-to-krutidev'); } catch { return t; }
                        }, 'mangal-to-krutidev');
                      }

                      editor.commands.setContent(result);
                    }
                  });
              }} title="Correct Grammar & Spelling">
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Correct</span>
              </button>

              <button className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg h-[56px] min-w-[56px] transition-all hover:shadow-md hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400" onClick={() => {
                const editor = getEditor(); if (!editor) return;
                let html = editor.getHTML();
                if (!html.trim()) return;
                html = html.replace(/(&nbsp;\s*){2,}/g, '&nbsp;');
                html = html.replace(/(\s{2,})/g, ' ');
                html = html.replace(/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');
                html = html.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, '');
                html = html.replace(/<p([^>]*)>\s+/g, '<p$1>');
                html = html.replace(/\s+<\/p>/g, '</p>');
                html = html.replace(/(<br\s*\/?>[\s]*){2,}/gi, '<br/>');
                html = html.replace(/\s+(।)/g, '$1');
                html = html.replace(/\s+(\,)/g, '$1');
                html = html.replace(/([^\s])\s{2,}([^\s])/g, '$1 $2');
                editor.commands.setContent(html);
              }} title="Clean up extra spaces & lines">
                <LayoutTemplate className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Format</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-400 absolute bottom-0 w-full text-center left-0 pointer-events-none">AI Tools</div>
          </div>
        </>)}
      </div>
    </div>
  );
}
