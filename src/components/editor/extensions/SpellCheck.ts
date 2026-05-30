import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const spellCheckPluginKey = new PluginKey('hindiSpellCheck');

export interface SpellError {
  word: string;
  from: number;
  to: number;
  suggestions: string[];
}

let activeSpellError: SpellError | null = null;
let contextMenuPos: { x: number; y: number } | null = null;
let contextMenuElement: HTMLDivElement | null = null;

// User dictionary cache
const userDictionary = new Set<string>();
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('hindi_user_dict');
    if (saved) {
      JSON.parse(saved).forEach((w: string) => userDictionary.add(w));
    }
  } catch {}
}

export function addToUserDictionary(word: string) {
  userDictionary.add(word);
  if (typeof window !== 'undefined') {
    localStorage.setItem('hindi_user_dict', JSON.stringify(Array.from(userDictionary)));
  }
}

function removeContextMenu() {
  if (contextMenuElement && contextMenuElement.parentNode) {
    contextMenuElement.parentNode.removeChild(contextMenuElement);
    contextMenuElement = null;
  }
  activeSpellError = null;
  contextMenuPos = null;
}

export const HindiSpellCheck = Extension.create({
  name: 'hindiSpellCheck',

  addProseMirrorPlugins() {
    const editor = this.editor;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    return [
      new Plugin({
        key: spellCheckPluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, apiResults: {} as Record<string, string[]> };
          },
          apply(tr, oldState, oldEditorState, newEditorState) {
            const spellCheckResults = tr.getMeta('spellcheckResults');
            
            let apiResults = oldState.apiResults;
            if (spellCheckResults) {
              apiResults = spellCheckResults;
            }

            // Always rebuild decorations if document changed or we have new results
            if (tr.docChanged || spellCheckResults || tr.getMeta('forceSpellCheck')) {
              const decorations = buildDecorations(newEditorState.doc, apiResults);
              return { decorations, apiResults };
            }

            return {
              decorations: oldState.decorations.map(tr.mapping, tr.doc),
              apiResults
            };
          },
        },
        view(view) {
          return {
            update(view, prevState) {
              if (view.state.doc.eq(prevState.doc)) return;

              if (debounceTimeout) clearTimeout(debounceTimeout);

              debounceTimeout = setTimeout(async () => {
                // Extract unique words from current document
                const words = new Set<string>();
                view.state.doc.descendants((node: any) => {
                  if (!node.isText) return;
                  
                  // Skip KrutiDev
                  const marks = node.marks || [];
                  const isKrutiDev = marks.some((m: any) => m.type.name === 'textStyle' && m.attrs.fontFamily && /kruti/i.test(m.attrs.fontFamily));
                  if (isKrutiDev) return;

                  const text = node.text || '';
                  const matches = text.match(/[\u0900-\u097F]+/g);
                  if (matches) {
                    matches.forEach((w: string) => {
                      if (!userDictionary.has(w)) words.add(w);
                    });
                  }
                });

                const uniqueWords = Array.from(words);
                if (uniqueWords.length === 0) return;

                try {
                  const res = await fetch('/api/spellcheck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ words: uniqueWords })
                  });
                  if (!res.ok) return;
                  const data = await res.json();
                  
                  if (data && data.results) {
                    view.dispatch(view.state.tr.setMeta('spellcheckResults', data.results));
                  }
                } catch (e) {
                  console.error('Spellcheck API error', e);
                }
              }, 600); // 600ms debounce
            },
            destroy() {
              if (debounceTimeout) clearTimeout(debounceTimeout);
            }
          };
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorations : DecorationSet.empty;
          },
          handleDOMEvents: {
            contextmenu(view, event) {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!pos) return false;

              const pluginState = spellCheckPluginKey.getState(view.state);
              if (!pluginState) return false;

              const decos = pluginState.decorations.find(pos.pos, pos.pos);
              const spellDeco = decos.find((d: Decoration) => d.spec?.spellError);

              if (!spellDeco) {
                removeContextMenu();
                return false;
              }

              event.preventDefault();
              event.stopPropagation();

              const spellError: SpellError = spellDeco.spec.spellError;
              activeSpellError = spellError;

              showSpellContextMenu(event.clientX, event.clientY, spellError, view, editor);

              return true;
            },
            click() {
              removeContextMenu();
              return false;
            },
            keydown() {
              removeContextMenu();
              return false;
            },
          },
        },
      }),
    ];
  },
});

function buildDecorations(doc: any, apiResults: Record<string, string[]>): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;

    const text = node.text || '';
    if (!text.trim()) return;

    const marks = node.marks || [];
    const isKrutiDev = marks.some((m: any) =>
      m.type.name === 'textStyle' &&
      m.attrs.fontFamily &&
      /kruti/i.test(m.attrs.fontFamily)
    );
    if (isKrutiDev) return;

    // Regex to find words in text node
    const wordRegex = /[\u0900-\u097F]+/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      
      // If word is in API results and NOT in user dictionary
      if (apiResults[word] && !userDictionary.has(word)) {
        const from = pos + match.index;
        const to = from + word.length;
        
        const error: SpellError = {
          word,
          from,
          to,
          suggestions: apiResults[word]
        };

        decorations.push(
          Decoration.inline(from, to, {
            class: 'spell-error',
            'data-spell-word': word,
          }, {
            spellError: error,
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

function showSpellContextMenu(x: number, y: number, error: SpellError, view: any, editor: any) {
  removeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'spell-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    z-index: 9999;
    background: #1e1e3e;
    border: 1px solid rgba(108, 92, 231, 0.3);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(108, 92, 231, 0.15);
    min-width: 200px;
    max-width: 280px;
    overflow: hidden;
    font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
    animation: spellMenuFadeIn 0.15s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    padding: 8px 12px;
    font-size: 11px;
    color: #e17055;
    font-weight: 600;
    border-bottom: 1px solid rgba(108, 92, 231, 0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.5px;
  `;
  header.innerHTML = `<span style="font-size: 13px;">⚠</span> गलत शब्द: <span style="color: #ff6b6b; font-weight: 700;">${error.word}</span>`;
  menu.appendChild(header);

  const suggestions = error.suggestions;

  if (suggestions.length > 0) {
    for (const suggestion of suggestions) {
      const item = document.createElement('div');
      item.className = 'spell-menu-item';
      item.style.cssText = `
        padding: 8px 12px;
        font-size: 14px;
        color: #e8e8ff;
        cursor: pointer;
        transition: all 0.12s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.03);
      `;
      item.innerHTML = `<span style="color: #00b894; font-size: 12px;">✓</span> ${suggestion}`;

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(108, 92, 231, 0.2)';
        item.style.color = '#a29bfe';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.color = '#e8e8ff';
      });

      item.addEventListener('click', () => {
        replaceWord(view, editor, error, suggestion);
        removeContextMenu();
      });

      menu.appendChild(item);
    }
  } else {
    const noSugg = document.createElement('div');
    noSugg.style.cssText = `padding: 8px 12px; font-size: 12px; color: #6b6ba0; font-style: italic;`;
    noSugg.textContent = 'कोई सुझाव उपलब्ध नहीं';
    menu.appendChild(noSugg);
  }

  const sep = document.createElement('div');
  sep.style.cssText = `height: 1px; background: rgba(108, 92, 231, 0.15); margin: 2px 0;`;
  menu.appendChild(sep);

  const addBtn = document.createElement('div');
  addBtn.className = 'spell-menu-item';
  addBtn.style.cssText = `
    padding: 8px 12px;
    font-size: 12px;
    color: #74b9ff;
    cursor: pointer;
    transition: all 0.12s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  addBtn.innerHTML = `<span style="font-size: 12px;">📖</span> शब्दकोश में जोड़ें`;
  addBtn.addEventListener('mouseenter', () => addBtn.style.background = 'rgba(116, 185, 255, 0.15)');
  addBtn.addEventListener('mouseleave', () => addBtn.style.background = 'transparent');
  addBtn.addEventListener('click', () => {
    addToUserDictionary(error.word);
    removeContextMenu();
    const tr = view.state.tr.setMeta('forceSpellCheck', true);
    view.dispatch(tr);
  });
  menu.appendChild(addBtn);

  const ignoreBtn = document.createElement('div');
  ignoreBtn.className = 'spell-menu-item';
  ignoreBtn.style.cssText = `
    padding: 8px 12px;
    font-size: 12px;
    color: #fdcb6e;
    cursor: pointer;
    transition: all 0.12s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 0 0 8px 8px;
  `;
  ignoreBtn.innerHTML = `<span style="font-size: 12px;">🚫</span> अनदेखा करें`;
  ignoreBtn.addEventListener('mouseenter', () => ignoreBtn.style.background = 'rgba(253, 203, 110, 0.15)');
  ignoreBtn.addEventListener('mouseleave', () => ignoreBtn.style.background = 'transparent');
  ignoreBtn.addEventListener('click', () => {
    addToUserDictionary(error.word);
    removeContextMenu();
    const tr = view.state.tr.setMeta('forceSpellCheck', true);
    view.dispatch(tr);
  });
  menu.appendChild(ignoreBtn);

  document.body.appendChild(menu);
  contextMenuElement = menu;

  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      removeContextMenu();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 10);

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  });
}

function replaceWord(view: any, editor: any, error: SpellError, replacement: string) {
  const pluginState = spellCheckPluginKey.getState(view.state);
  if (!pluginState) return;

  let found = false;
  view.state.doc.descendants((node: any, pos: number) => {
    if (found || !node.isText) return;
    const text = node.text || '';
    
    const wordRegex = /[\u0900-\u097F]+/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      if (match[0] === error.word) {
        const from = pos + match.index;
        const to = from + error.word.length;

        if (Math.abs(from - error.from) < 100) {
          const docWord = view.state.doc.textBetween(from, to);
          if (docWord === error.word) {
            const tr = view.state.tr.replaceWith(
              from,
              to,
              view.state.schema.text(replacement, node.marks)
            );
            view.dispatch(tr);
            found = true;
            break;
          }
        }
      }
    }
  });
}
