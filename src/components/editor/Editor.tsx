'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useRef, useCallback, useState } from 'react';
import { inscriptMap } from '@/lib/keyboardLayouts';
import { krutiDevToUnicode } from '@/lib/fontConversion';
import { Indent } from './extensions/Indent';
import { GhostText } from './extensions/GhostText';
import { LineHeight } from './extensions/LineHeight';
import { FontSize } from './extensions/FontSize';
import { DOMSerializer } from 'prosemirror-model';

// Custom extensions to preserve styles
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: el => el.getAttribute('style'), renderHTML: attrs => attrs.style ? { style: attrs.style } : {} }
    }
  }
});
const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: el => el.getAttribute('style'), renderHTML: attrs => attrs.style ? { style: attrs.style } : {} }
    }
  }
});
const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: el => el.getAttribute('style'), renderHTML: attrs => attrs.style ? { style: attrs.style } : {} }
    }
  }
});
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: el => el.getAttribute('style'), renderHTML: attrs => attrs.style ? { style: attrs.style } : {} }
    }
  }
});

// Global font mode — set by RibbonToolbar
let globalFontMode: 'unicode' | 'mangal' | 'krutidev' = 'unicode';
export function setGlobalFontMode(m: 'unicode' | 'mangal' | 'krutidev') {
  globalFontMode = m;
}
export function getGlobalFontMode() {
  return globalFontMode;
}

interface EditorComponentProps {
  content: string;
  onUpdate: (html: string) => void;
}

function ContinuousEditor({ content, onUpdate }: EditorComponentProps) {
  const isSettingContent = useRef(false);
  const [numPages, setNumPages] = useState(1);
  const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle, Color, FontFamily, FontSize,
      CustomTable.configure({ resizable: true }), CustomTableRow, CustomTableHeader, CustomTableCell,
      Indent,
      GhostText,
      LineHeight,
      Subscript, Superscript,
      Placeholder.configure({ placeholder: `यहाँ टाइप करें...` }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isSettingContent.current) onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'tiptap focus:outline-none', spellcheck: 'false' },

      // ── Smart Word Paste ──
      // Preserves Word tables, formatting, and fixes KrutiDev smart quote corruption.
      handlePaste(view, event) {
        const cd = event.clipboardData;
        if (!cd) return false;

        const htmlData = cd.getData('text/html');
        const plainData = cd.getData('text/plain');

        if (!htmlData && !plainData) return false;

        // Auto-detection helpers
        const isDevanagari = (text: string): boolean => {
          const devanagariChars = text.match(/[\u0900-\u097F]/g);
          return !!devanagariChars && devanagariChars.length > text.length * 0.15;
        };
        const isAsciiKrutiDev = (text: string): boolean => {
          // Check for typical KrutiDev English characters that form Hindi words
          const asciiChars = text.match(/[a-zA-Z]/g);
          return !!asciiChars && asciiChars.length > text.length * 0.15 && !isDevanagari(text);
        };

        if (htmlData) {
          event.preventDefault();

          // 1. Parse the Word HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlData, 'text/html');
          const body = doc.body;

          // 2. Remove Word meta/style/script elements
          body.querySelectorAll('style, meta, link, title, xml, script, comment').forEach(el => el.remove());

          // 3. Remove HTML comments (Word conditional comments <!--[if ...]-->)
          const removeComments = (node: Node) => {
            const toRemove: Node[] = [];
            node.childNodes.forEach(child => {
              if (child.nodeType === Node.COMMENT_NODE) {
                toRemove.push(child);
              } else if (child.childNodes.length) {
                removeComments(child);
              }
            });
            toRemove.forEach(n => n.parentNode?.removeChild(n));
          };
          removeComments(body);

          // 4. Remove Word namespace elements (o:p, w:sdt, etc.) but keep content
          const allEls = body.querySelectorAll('*');
          const nsToRemove: Element[] = [];
          allEls.forEach(el => {
            const tag = el.tagName.toLowerCase();
            if (tag.includes(':')) nsToRemove.push(el);
          });
          nsToRemove.forEach(el => {
            const txt = el.textContent || '';
            if (txt.trim() && txt.trim() !== '\u00a0') {
              el.replaceWith(doc.createTextNode(txt));
            } else {
              el.remove();
            }
          });

          // 5. Clean all elements — keep only TipTap-compatible styles
          const cleanEl = (el: Element) => {
            const keep = new Set(['style', 'colspan', 'rowspan']);
            const attrsToRemove: string[] = [];
            for (let i = 0; i < el.attributes.length; i++) {
              if (!keep.has(el.attributes[i].name.toLowerCase())) {
                attrsToRemove.push(el.attributes[i].name);
              }
            }
            attrsToRemove.forEach(a => el.removeAttribute(a));

            const style = el.getAttribute('style');
            let hasFontFamily = '';
            let isKrutiDev = false;

            if (style) {
              const isBlock = /^(P|DIV|TD|TH|H[1-6]|LI|BLOCKQUOTE)$/i.test(el.tagName);
              const kept: string[] = [];

              style.split(';').forEach(rule => {
                const s = rule.trim();
                if (!s) return;
                const idx = s.indexOf(':');
                if (idx === -1) return;
                const prop = s.substring(0, idx).trim().toLowerCase();

                if (prop.startsWith('mso-')) return;
                if (/^(margin|padding|line-height|text-indent|tab-stops|font-size|page-break|widows|orphans|word-spacing|letter-spacing)/.test(prop)) return;

                if (prop === 'font-family') { 
                  hasFontFamily = rule.substring(idx + 1).trim();
                  if (/Kruti\s*Dev/i.test(hasFontFamily)) {
                    isKrutiDev = true;
                  } else {
                    if (!isBlock) kept.push(s); 
                  }
                  return; 
                }

                if (prop === 'text-align' && isBlock) { kept.push(s); return; }
                if (['font-weight', 'font-style', 'text-decoration'].includes(prop)) { kept.push(s); return; }
                if (prop === 'color' || prop.includes('background')) { kept.push(s); return; }
              });

              if (kept.length) {
                el.setAttribute('style', kept.join('; '));
              } else {
                el.removeAttribute('style');
              }
            }

            if (isKrutiDev) {
              el.setAttribute('data-krutidev', 'true');
            }

            Array.from(el.children).forEach(child => cleanEl(child));

            if (hasFontFamily && !isKrutiDev && /^(P|DIV|TD|TH|H[1-6]|LI|BLOCKQUOTE)$/i.test(el.tagName)) {
              if (el.innerHTML.trim()) {
                const span = doc.createElement('span');
                span.setAttribute('style', `font-family: ${hasFontFamily}`);
                while (el.firstChild) {
                  span.appendChild(el.firstChild);
                }
                el.appendChild(span);
              }
            }
          };
          Array.from(body.children).forEach(child => cleanEl(child));

          // 6. Handle explicit KrutiDev elements AND Auto-detect missing fonts
          const processTextNodes = (node: Node, inKrutiDevContext: boolean = false) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              let isKrutiMarked = el.getAttribute('data-krutidev') === 'true';
              
              if (isKrutiMarked) {
                el.removeAttribute('data-krutidev');
                const currentStyle = el.getAttribute('style') || '';
                if (!/kruti/i.test(currentStyle)) {
                  el.setAttribute('style', `${currentStyle}${currentStyle && !currentStyle.endsWith(';') ? ';' : ''} font-family: 'Kruti Dev 010', sans-serif;`);
                }
              }
              
              // If it has explicit font, don't override
              const style = el.getAttribute('style') || '';
              const hasExplicitFont = /font-family/i.test(style);
              const thisIsKruti = isKrutiMarked || (/kruti/i.test(style));
              
              Array.from(node.childNodes).forEach(child => 
                processTextNodes(child, inKrutiDevContext || thisIsKruti)
              );
            } else if (node.nodeType === Node.TEXT_NODE) {
              let text = node.nodeValue || '';
              if (!text.trim()) return;

              // If text is not inside an explicitly styled KrutiDev block, auto-detect it
              if (!inKrutiDevContext) {
                if (isAsciiKrutiDev(text)) {
                  // Text looks like KrutiDev but isn't styled as such. Wrap it.
                  const span = doc.createElement('span');
                  span.style.fontFamily = "'Kruti Dev 010'";
                  node.parentNode?.insertBefore(span, node);
                  span.appendChild(node);
                } else if (isDevanagari(text)) {
                  // Text is Devanagari. Wrap it in Mangal.
                  const span = doc.createElement('span');
                  span.style.fontFamily = "Mangal";
                  node.parentNode?.insertBefore(span, node);
                  span.appendChild(node);
                  
                  // Also normalize quotes
                  node.nodeValue = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"');
                } else {
                  // Normal english text
                  node.nodeValue = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"');
                }
              }
            }
          };
          processTextNodes(body);

          // 7. Remove empty paragraphs
          body.querySelectorAll('p').forEach(p => {
            const text = (p.textContent || '').replace(/\u00a0/g, '').trim();
            if (!text && !p.querySelector('img, table')) {
              p.remove();
            }
          });

          let html = body.innerHTML.replace(/Kruti\s*Dev\s*(\d+)/gi, 'Kruti Dev $1').trim();
          
          if (editor && html) {
            editor.chain().focus().insertContent(html, {
              parseOptions: { preserveWhitespace: false }
            }).run();
          }
          return true;
        }

        // Fallback to plain text if no HTML
        if (plainData) {
          event.preventDefault();
          let text = plainData
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, "-");
            
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          const html = lines.map(l => {
            if (isAsciiKrutiDev(l)) {
              return `<p><span style="font-family: 'Kruti Dev 010'">${l}</span></p>`;
            } else if (isDevanagari(l)) {
              return `<p><span style="font-family: 'Mangal'">${l}</span></p>`;
            }
            return `<p>${l}</p>`;
          }).join('');
          
          if (editor && html) {
            editor.chain().focus().insertContent(html).run();
          }
          return true;
        }

        return false;
      },

      handleKeyDown(view, event) {
        // Page Break Shortcut (Ctrl + Enter) inserts manual break
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { from, to } = state.selection;
          
          // Just insert an HR to visually represent a page break if needed, 
          // or we can just ignore it since it's pageless. We'll insert a visual line.
          const hr = document.createElement('hr');
          hr.className = 'page-break';
          editor.commands.insertContent('<hr class="page-break" />');
          return true;
        }

        // Unicode mode — let browser/OS handle everything naturally
        if (globalFontMode === 'unicode') return false;

        // Pass through Ctrl/Alt/Meta combos and special keys
        if (event.ctrlKey || event.altKey || event.metaKey) return false;
        if (event.key.length !== 1) return false;

        // ── KrutiDev mode ──
        // User types using Remington layout (KrutiDev keys). We insert ASCII characters
        // and explicitly wrap them in the Kruti Dev 010 font mark so they render as Hindi visually.
        if (globalFontMode === 'krutidev') {
          event.preventDefault();
          const { state, dispatch } = view;
          const { from, to } = state.selection;
          
          const mark = state.schema.marks.textStyle.create({ fontFamily: "'Kruti Dev 010'" });
          
          const activeMarks = state.storedMarks || state.selection.$from.marks();
          const allMarks = [...activeMarks.filter(m => m.type.name !== 'textStyle'), mark];
          
          const tr = state.tr.replaceWith(from, to, state.schema.text(event.key, allMarks));
          dispatch(tr);
          return true;
        }

        // ── Mangal mode ──
        // Mangal is a Unicode font. For standard Hindi typing without an OS IME, we provide the standard InScript layout.
        if (globalFontMode === 'mangal') {
          // If they are already typing Hindi characters (e.g. using Windows Hindi IME), just pass it through
          if (/[\u0900-\u097F]/.test(event.key)) return false;

          const mappedChar = inscriptMap[event.key];
          if (mappedChar) {
            event.preventDefault();
            const { state, dispatch } = view;
            const { from, to } = state.selection;
            
            // Explicitly apply Mangal font mark so the toolbar doesn't revert to Unicode
            const mark = state.schema.marks.textStyle.create({ fontFamily: 'Mangal' });
            
            // Also preserve any other active marks (like bold, italic)
            const activeMarks = state.storedMarks || state.selection.$from.marks();
            const allMarks = [...activeMarks.filter(m => m.type.name !== 'textStyle'), mark];
            
            const tr = state.tr.replaceWith(from, to, state.schema.text(mappedChar, allMarks));
            dispatch(tr);
            return true;
          }
        }
        
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      isSettingContent.current = true;
      editor.commands.setContent(content);
      isSettingContent.current = false;
    }
  }, [content]); // eslint-disable-line

  useEffect(() => {
    if (editor) {
      (window as unknown as Record<string, unknown>).__tiptapEditor = editor;
    }
  }, [editor]);

  const handleSheetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!useUIStore.getState().directCursorMode || !editor) return;

    const tiptapEl = editor.view.dom;
    if (!tiptapEl) return;

    const rect = tiptapEl.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Page padding is typically 80px (defined in Editor as PAGE_PADDING)
    let targetX = e.clientX - rect.left - 80;
    if (targetX < 0) targetX = 0;

    const lastNode = tiptapEl.lastElementChild;
    if (!lastNode) return;
    const lastRect = lastNode.getBoundingClientRect();
    const lastY = lastRect.bottom - rect.top;

    // If clicked below the last paragraph
    if (clickY > lastY + 10) {
      const diff = clickY - lastY;
      const linesToInsert = Math.ceil(diff / 25.2);
      
      if (linesToInsert > 0) {
        // Premium instant insertion
        editor.chain()
          .focus('end')
          .insertContent('<p></p>'.repeat(linesToInsert))
          .setIndent({ paddingLeft: targetX, textIndent: 0, paddingRight: 0 })
          .run();
        return;
      } else {
        editor.chain().focus('end').setIndent({ paddingLeft: targetX, textIndent: 0, paddingRight: 0 }).run();
        return;
      }
    }

    // If clicked inside the text area, use exact coordinates to prevent ProseMirror from snapping to nearby text
    const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (coords) {
      const resolved = editor.state.doc.resolve(coords.pos);
      const isLineEmpty = resolved.parent.textContent.trim() === '';
      
      if (isLineEmpty) {
        editor.chain()
          .setTextSelection(coords.pos)
          .setIndent({ paddingLeft: targetX, textIndent: 0, paddingRight: 0 })
          .run();
      } else {
        // Line has text. Check if we clicked to the left or right of the text.
        const currentPadding = parseInt(resolved.parent.attrs.paddingLeft) || 0;
        
        // Dynamically measure the exact width of a non-breaking space for accurate padding
        const measureSpace = () => {
          const span = document.createElement('span');
          span.style.fontFamily = 'Noto Sans Devanagari, Mangal, serif';
          span.style.fontSize = '14px';
          span.style.visibility = 'hidden';
          span.style.position = 'absolute';
          span.style.whiteSpace = 'pre';
          span.innerText = '\u00A0';
          document.body.appendChild(span);
          const width = span.getBoundingClientRect().width;
          document.body.removeChild(span);
          return width > 0 ? width : 4.0; // Fallback to 4px
        };
        const exactSpaceWidth = measureSpace();
        
        // If clicked to the left of the text
        if (resolved.parentOffset === 0 && targetX < currentPadding - 10) {
          e.preventDefault(); // Stop ProseMirror's default snap
          const gap = currentPadding - targetX;
          const numSpaces = Math.max(0, Math.round(gap / exactSpaceWidth));
          
          editor.chain()
            .setIndent({ paddingLeft: targetX, textIndent: 0, paddingRight: 0 })
            .insertContentAt(coords.pos, '\u00A0'.repeat(numSpaces))
            .setTextSelection(coords.pos) // Move cursor to the actual click position
            .run();
        } 
        // If clicked to the right of the text
        else if (resolved.parentOffset === resolved.parent.content.size) {
          const cursorPos = editor.view.coordsAtPos(coords.pos);
          if (e.clientX > cursorPos.left + 15) {
            e.preventDefault();
            const gap = e.clientX - cursorPos.left;
            const numSpaces = Math.max(0, Math.round(gap / exactSpaceWidth));
            
            editor.chain()
              .insertContentAt(coords.pos, '\u00A0'.repeat(numSpaces))
              .setTextSelection(coords.pos + numSpaces)
              .run();
          }
        }
      }
    }
  };

  const calculatePagination = useCallback(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const children = Array.from(dom.children) as HTMLElement[];
    
    const pageHeight = 1056;
    const gap = 40;
    const cycle = pageHeight + gap; // 1096
    const paddingTop = 72;
    const paddingBottom = 72;
    const safeHeight = pageHeight - paddingTop - paddingBottom; // 912

    let styleEl = document.getElementById('pagination-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pagination-styles';
      document.head.appendChild(styleEl);
    }

    // Temporarily clear styles to read natural positions accurately
    styleEl.innerHTML = '';
    
    // Force a single reflow to get true unpaginated positions
    const editorTop = dom.getBoundingClientRect().top;
    
    const newStyles = [];
    let accumulatedShift = 0;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      let forceNextPage = false;
      
      if (child.tagName === 'HR' && child.classList.contains('page-break')) {
        forceNextPage = true;
        newStyles.push(`.tiptap > *:nth-child(${i + 1}) { opacity: 0; margin: 0 !important; height: 0 !important; padding: 0 !important; border: 0 !important; }`);
      }
      
      const rect = child.getBoundingClientRect();
      const naturalTop = rect.top - editorTop;
      const height = rect.height;
      
      // Calculate where this element falls considering all previous pushes
      const top = naturalTop + accumulatedShift;
      
      const pageIndex = Math.floor(top / cycle);
      const currentSafeTop = pageIndex * cycle + paddingTop;
      const currentSafeBottom = pageIndex * cycle + pageHeight - paddingBottom;
      
      let pushAmount = 0;
      
      if (forceNextPage) {
        const nextPageSafeTop = (pageIndex + 1) * cycle + paddingTop;
        pushAmount = Math.max(0, nextPageSafeTop - top);
      } else {
        // Prevent elements from being stranded in the gap / top margin
        if (top < currentSafeTop - 1) {
          pushAmount = currentSafeTop - top;
        }
        
        const effectiveTop = top + pushAmount;
        const effectiveBottom = effectiveTop + height;
        
        // Push if element overflows the bottom boundary
        if (effectiveBottom > currentSafeBottom + 1) {
          if (height <= safeHeight) {
            const nextPageSafeTop = (pageIndex + 1) * cycle + paddingTop;
            pushAmount = nextPageSafeTop - top;
          } else {
            // Massive element: push only if it didn't start right at the top
            if (effectiveTop > currentSafeTop + 20) {
              const nextPageSafeTop = (pageIndex + 1) * cycle + paddingTop;
              pushAmount = nextPageSafeTop - top;
            }
          }
        }
      }
      
      if (pushAmount > 0) {
        // Injecting via CSS skips TipTap's DOM sanitization entirely
        newStyles.push(`.tiptap > *:nth-child(${i + 1}) { padding-top: ${pushAmount}px !important; }`);
        accumulatedShift += pushAmount;
      }
    }
    
    // Apply styles only for screen display so it doesn't break physical printing
    styleEl.innerHTML = `@media screen {\n${newStyles.join('\n')}\n}`;
    
    // Calculate true total height using the unpaginated DOM height + total injected shifts
    const totalHeight = dom.getBoundingClientRect().height + accumulatedShift;
    const calculatedPages = Math.max(1, Math.ceil((totalHeight + 40) / cycle));
    setNumPages(calculatedPages);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      if (paginationTimeoutRef.current) clearTimeout(paginationTimeoutRef.current);
      paginationTimeoutRef.current = setTimeout(calculatePagination, 100);
    };
    editor.on('update', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    setTimeout(calculatePagination, 100);
    return () => {
      editor.off('update', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      if (paginationTimeoutRef.current) clearTimeout(paginationTimeoutRef.current);
    };
  }, [editor, calculatePagination]);

  return (
    <div className="relative w-full flex justify-center" onClick={handleSheetClick}>
      {/* Visual A4 Pages Layer */}
      <div className="absolute top-0 flex flex-col items-center pointer-events-none z-0" style={{ gap: '40px', paddingTop: '40px', paddingBottom: '40px' }}>
        {Array.from({ length: numPages }).map((_, i) => (
          <div key={i} className="relative bg-white shadow-md flex-shrink-0" style={{ width: '816px', height: '1056px' }}>
            <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 text-[11px] text-gray-500 font-sans tracking-wide">
              पृष्ठ {i + 1} / {numPages}
            </div>
            {/* Premium Margin Line */}
            <div className="absolute top-[60px] bottom-[60px] left-[80px] w-[1px] bg-blue-400/20 dark:bg-blue-400/10 mix-blend-multiply dark:mix-blend-screen" />
          </div>
        ))}
      </div>
      
      {/* Text Editor Layer */}
      <div className="relative z-10 w-[816px] py-[40px]">
        <EditorContent editor={editor} className="tiptap-editor page-content" />
      </div>
    </div>
  );
}

function InteractiveRuler() {
  const [textIndent, setTextIndent] = useState(0);
  const [paddingLeft, setPaddingLeft] = useState(0);
  const [paddingRight, setPaddingRight] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const [guideLine, setGuideLine] = useState<number | null>(null);

  const rulerRef = useRef<HTMLDivElement>(null);

  // Sync ruler markers with the cursor position in the active editor
  useEffect(() => {
    const interval = setInterval(() => {
      const editor = (window as any).__tiptapEditor;
      if (editor && !dragging) {
        const attrs = editor.getAttributes('paragraph');
        setTextIndent(parseInt(attrs.textIndent) || 0);
        setPaddingLeft(parseInt(attrs.paddingLeft) || 0);
        setPaddingRight(parseInt(attrs.paddingRight) || 0);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [dragging]);

  const applyIndent = useCallback((ti: number, pl: number, pr: number) => {
    const editor = (window as any).__tiptapEditor;
    if (editor) {
      editor.commands.setIndent({
        textIndent: ti || null,
        paddingLeft: pl || null,
        paddingRight: pr || null,
      });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(type);
  };

  useEffect(() => {
    if (!dragging) {
      setGuideLine(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!rulerRef.current) return;

      const rulerRect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rulerRect.left;

      // Margin area is 80px on each side of 816px page
      const PAGE_PADDING = 80;
      const PAGE_WIDTH = 816;

      if (dragging === 'firstLine') {
        const value = Math.max(-200, Math.min(x - PAGE_PADDING - paddingLeft, 400));
        const rounded = Math.round(value / 4) * 4; // snap to 4px grid
        setTextIndent(rounded);
        setGuideLine(PAGE_PADDING + paddingLeft + rounded);
      } else if (dragging === 'leftIndent') {
        const value = Math.max(0, Math.min(x - PAGE_PADDING, 400));
        const rounded = Math.round(value / 4) * 4;
        setPaddingLeft(rounded);
        setGuideLine(PAGE_PADDING + rounded);
        // Also move first-line indent marker along with it
      } else if (dragging === 'rightIndent') {
        const value = Math.max(0, Math.min(PAGE_WIDTH - x - PAGE_PADDING, 400));
        const rounded = Math.round(value / 4) * 4;
        setPaddingRight(rounded);
        setGuideLine(PAGE_WIDTH - PAGE_PADDING - rounded);
      }
    };

    const handlePointerUp = () => {
      if (dragging) {
        applyIndent(textIndent, paddingLeft, paddingRight);
        setDragging(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, textIndent, paddingLeft, paddingRight, applyIndent]);

  // Page width is 816px. Base padding is 80px left/right.
  const PAGE_PADDING = 80;
  const firstLinePos = PAGE_PADDING + paddingLeft + textIndent;
  const leftIndentPos = PAGE_PADDING + paddingLeft;
  const rightIndentPos = 816 - PAGE_PADDING - paddingRight;

  return (
    <div className="ruler-wrapper" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--bg-primary)',
      padding: '8px 0 0 0',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div ref={rulerRef} style={{
        width: '816px',
        height: '28px',
        position: 'relative',
        userSelect: 'none',
      }}>
        {/* Ruler background — gray margin areas like MS Word */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          {/* Left margin (gray) */}
          <div style={{ width: `${PAGE_PADDING}px`, background: '#d4d4d8', height: '100%' }} />
          {/* Content area (white) */}
          <div style={{ flex: 1, background: '#f9fafb', height: '100%' }} />
          {/* Right margin (gray) */}
          <div style={{ width: `${PAGE_PADDING}px`, background: '#d4d4d8', height: '100%' }} />
        </div>

        {/* Tick marks */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          {Array.from({ length: 33 }).map((_, i) => {
            // Each inch ≈ 96px at 100%. Page content = 816 - 160 = 656px ≈ ~6.8 inches
            // We use equal divisions across the full width
            const isMajor = i % 4 === 0;
            const isMid = i % 2 === 0 && !isMajor;
            const h = isMajor ? '16px' : isMid ? '10px' : '6px';
            return (
              <div key={i} style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-end',
                height: '100%',
                position: 'relative',
              }}>
                <div style={{
                  width: '1px',
                  height: h,
                  background: isMajor ? '#71717a' : '#a1a1aa',
                }} />
                {isMajor && i > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: '4px',
                    fontSize: '9px',
                    fontFamily: "'Inter', sans-serif",
                    color: '#52525b',
                    userSelect: 'none',
                    fontWeight: 500,
                  }}>
                    {i / 4}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag guide line (vertical dotted line extending down into page) */}
        {guideLine !== null && (
          <div style={{
            position: 'absolute',
            left: `${guideLine}px`,
            top: '28px',
            width: '1px',
            height: '1100px',
            borderLeft: '1px dashed var(--accent-primary)',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 100,
          }} />
        )}

        {/* ── First Line Indent Marker (▼ top triangle) ── */}
        <div
          className={`ruler-marker marker-first-line ${dragging === 'firstLine' ? 'dragging' : ''}`}
          style={{
            position: 'absolute',
            left: `${firstLinePos}px`,
            top: '0px',
            transform: 'translateX(-6px)',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            zIndex: 61,
            padding: '2px',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'firstLine')}
          title="पहली पंक्ति इंडेंट (First Line Indent)"
        >
          <svg width="12" height="10" viewBox="0 0 12 10">
            <path d="M1,0 L11,0 L6,8 Z" fill={dragging === 'firstLine' ? '#6c5ce7' : '#555'} stroke="#fff" strokeWidth="0.5" />
          </svg>
        </div>

        {/* ── Left Indent Marker (▲ bottom triangle + □ rectangle) ── */}
        <div
          className={`ruler-marker marker-left-indent ${dragging === 'leftIndent' ? 'dragging' : ''}`}
          style={{
            position: 'absolute',
            left: `${leftIndentPos}px`,
            bottom: '0px',
            transform: 'translateX(-6px)',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            zIndex: 61,
            padding: '0 2px',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'leftIndent')}
          title="बाएँ इंडेंट (Left Indent)"
        >
          <svg width="12" height="14" viewBox="0 0 12 14">
            <path d="M6,0 L11,7 L1,7 Z" fill={dragging === 'leftIndent' ? '#6c5ce7' : '#555'} stroke="#fff" strokeWidth="0.5" />
            <rect x="1.5" y="9" width="9" height="5" rx="1" fill={dragging === 'leftIndent' ? '#6c5ce7' : '#555'} stroke="#fff" strokeWidth="0.5" />
          </svg>
        </div>

        {/* ── Right Indent Marker (▲ bottom triangle) ── */}
        <div
          className={`ruler-marker marker-right-indent ${dragging === 'rightIndent' ? 'dragging' : ''}`}
          style={{
            position: 'absolute',
            left: `${rightIndentPos}px`,
            bottom: '0px',
            transform: 'translateX(-6px)',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            zIndex: 61,
            padding: '0 2px',
          }}
          onPointerDown={(e) => handlePointerDown(e, 'rightIndent')}
          title="दाएँ इंडेंट (Right Indent)"
        >
          <svg width="12" height="10" viewBox="0 0 12 10">
            <path d="M6,0 L11,8 L1,8 Z" fill={dragging === 'rightIndent' ? '#6c5ce7' : '#555'} stroke="#fff" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Border line at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '1px',
          background: '#a1a1aa',
        }} />
      </div>
    </div>
  );
}

export default function Editor() {
  const { pages, updateContent, newDocument, zoom, hydrateFromStorage, isHydrated } = useDocumentStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    hydrateFromStorage();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isHydrated && (!pages || pages.length === 0)) newDocument();
  }, [isHydrated]); // eslint-disable-line

  const handleUpdate = useCallback((html: string) => updateContent(html), [updateContent]);

  // Use scale for zooming. Transform origin top center so it scales out equally.
  const scale = zoom / 100;

  return (
    <div ref={containerRef} className="multi-page-editor h-full overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="zoom-container" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', minHeight: '100%', paddingBottom: '100px' }}>
        <InteractiveRuler />
        <div className="pages-container">
          <ContinuousEditor
            content={pages[0] || '<p></p>'}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}
