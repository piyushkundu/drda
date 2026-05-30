import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { getContextSuggestions } from '@/lib/contextPairs';
import { useAIStore } from '@/stores/aiStore';

export const ghostTextPluginKey = new PluginKey('ghostText');

// AI context suggestion cache
let aiSuggestionCache: { context: string; suggestion: string; timestamp: number } | null = null;
let aiRequestTimeout: ReturnType<typeof setTimeout> | null = null;
let lastAIRequestContext = '';

// Dictionary context suggestion cache
let dictSuggestionCache: { prefix: string; suggestion: string; timestamp: number } | null = null;
let dictRequestTimeout: ReturnType<typeof setTimeout> | null = null;
let lastDictPrefix = '';

// ── Optimized AI Prompt for Hindi Government Context ──
const AI_AUTOCOMPLETE_PROMPT = `तुम एक Hindi government document auto-complete engine हो।
तुम्हारा काम है अगले 1-8 शब्द predict करना जो naturally आएंगे।
Context: सरकारी पत्र, DRDA, Social Audit, IGRS शिकायत, Panchayat
Rules:
1. सिर्फ predicted words output करो, कुछ और नहीं
2. formal/शासकीय Hindi use करो
3. पूरे sentence का context देखो
4. Short रखो (max 8 words)`;

// Debounced Dictionary fetcher
function fetchDictAutocomplete(prefix: string) {
  if (dictRequestTimeout) clearTimeout(dictRequestTimeout);
  if (prefix.length < 1) return;
  if (lastDictPrefix === prefix) return;

  dictRequestTimeout = setTimeout(async () => {
    lastDictPrefix = prefix;
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(prefix)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        const remaining = best.slice(prefix.length);
        if (remaining) {
          dictSuggestionCache = {
            prefix,
            suggestion: remaining,
            timestamp: Date.now()
          };
          // Force editor to re-evaluate GhostText
          const editor = (window as any).__tiptapEditor;
          if (editor && editor.view) {
            editor.view.dispatch(editor.view.state.tr.setMeta('dictSuggestion', true));
          }
        }
      }
    } catch {
      // Silently fail
    }
  }, 150); // fast debounce
}

// Debounced AI suggestion fetcher — improved with better prompt
function fetchAISuggestion(fullText: string, lastSentence: string) {
  if (aiRequestTimeout) clearTimeout(aiRequestTimeout);
  if (lastSentence.length < 1) return;
  if (lastAIRequestContext === lastSentence) return;

  aiRequestTimeout = setTimeout(async () => {
    lastAIRequestContext = lastSentence;
    try {
      const aiStore = useAIStore.getState();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          prompt: `Complete this Hindi text naturally. Output ONLY the next 1-8 words. Context: "${lastSentence}"`,
          model: aiStore.selectedModel
        })
      });
      if (!res.ok) return;
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try { result += JSON.parse(data).text; } catch {}
        });
      }
      if (result && result.trim()) {
        let clean = result.trim();
        // Remove if it repeats the input
        if (clean.startsWith(lastSentence)) {
          clean = clean.slice(lastSentence.length).trim();
        }
        // Take only first line
        clean = clean.split('\n')[0].trim();
        // Remove quotes, markdown
        clean = clean.replace(/^["'`]+|["'`]+$/g, '').trim();
        // Limit length
        if (clean.length > 80) clean = clean.slice(0, 80);

        if (clean) {
          aiSuggestionCache = {
            context: lastSentence,
            suggestion: clean,
            timestamp: Date.now()
          };
          // Force editor to re-evaluate GhostText
          const editor = (window as any).__tiptapEditor;
          if (editor && editor.view) {
            editor.view.dispatch(editor.view.state.tr.setMeta('aiSuggestion', true));
          }
        }
      }
    } catch {
      // Silently fail
    }
  }, 400); // Reduced from 800ms to 400ms for faster response
}

export const GhostText = Extension.create({
  name: 'ghostText',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostTextPluginKey,
        state: {
          init() {
            return { decorationSet: DecorationSet.empty, suggestionText: null as string | null };
          },
          apply(tr, oldState, oldEditorState, newEditorState) {
            if (!useAIStore.getState().isAutoSuggestEnabled) {
              return { decorationSet: DecorationSet.empty, suggestionText: null };
            }

            const selection = newEditorState.selection;
            if (!selection.empty) {
              return { decorationSet: DecorationSet.empty, suggestionText: null };
            }

            const $cursor = selection.$head;
            const textNode = $cursor.parent;
            if (!textNode.isTextblock) {
              return { decorationSet: DecorationSet.empty, suggestionText: null };
            }

            // Get text before cursor
            const textBefore = $cursor.parent.textContent.slice(0, $cursor.parentOffset);
            const words = textBefore.split(/\s+/).filter(w => w.length > 0);

            if (words.length === 0) {
              return { decorationSet: DecorationSet.empty, suggestionText: null };
            }

            let bestRemaining: string | null = null;

            // ── Priority 1: Context Pair suggestions (bigram/trigram) ──
            // Check for multi-word context matches
            const contextSuggestions = getContextSuggestions(textBefore);
            if (contextSuggestions.length > 0) {
              // If the last word looks like a partial match of the suggestion, complete it
              const lastWord = words[words.length - 1];
              const textForContext = words.slice(0, -1).join(' ');
              const contextForPrefix = getContextSuggestions(textForContext);
              
              if (contextForPrefix.length > 0) {
                // Check if lastWord is a prefix of any context suggestion
                for (const sugg of contextForPrefix) {
                  if (sugg.startsWith(lastWord) && sugg !== lastWord) {
                    bestRemaining = sugg.slice(lastWord.length);
                    break;
                  }
                }
              }
              
              // If no partial match, suggest the full next word after a space
              if (!bestRemaining) {
                // Check if user just finished a word (textBefore ends with space)
                if (textBefore.endsWith(' ') || textBefore.endsWith('\u00A0')) {
                  bestRemaining = contextSuggestions[0];
                }
              }
            }

            // ── Priority 2: Dictionary API Prefix Search ──
            if (!bestRemaining) {
              const lastWord = words[words.length - 1];
              // Only trigger if we are inside a word (no trailing space)
              if (lastWord && !textBefore.endsWith(' ') && !textBefore.endsWith('\u00A0')) {
                // Check if we have a cached dict suggestion
                if (dictSuggestionCache && 
                    dictSuggestionCache.prefix === lastWord &&
                    (Date.now() - dictSuggestionCache.timestamp) < 5000) {
                  bestRemaining = dictSuggestionCache.suggestion;
                } else {
                  // Request new dictionary suggestion
                  fetchDictAutocomplete(lastWord);
                }
              }
            }

            // ── Priority 3: AI context-based suggestions ──
            // Removed threshold to allow AI suggestions from the very first character
            if (!bestRemaining && textBefore.length > 0) {
              // Check if we have a cached AI suggestion that matches
              const cleanTextBefore = textBefore.trimEnd();
              if (aiSuggestionCache && 
                  cleanTextBefore.endsWith(aiSuggestionCache.context) &&
                  (Date.now() - aiSuggestionCache.timestamp) < 30000) {
                bestRemaining = aiSuggestionCache.suggestion;
              } else {
                // Request new AI suggestion in background
                const fullDocText = newEditorState.doc.textContent;
                const lastSentence = words.slice(-10).join(' ');
                fetchAISuggestion(fullDocText, lastSentence);
              }
            }

            if (bestRemaining) {
              const widget = document.createElement('span');
              widget.textContent = bestRemaining;
              widget.className = 'ghost-text';
              widget.style.color = '#b0b0b0';
              widget.style.opacity = '0.6';
              widget.style.pointerEvents = 'none';
              widget.style.whiteSpace = 'pre';
              widget.style.fontStyle = 'italic';

              const deco = Decoration.widget($cursor.pos, widget, { side: 1 });

              return {
                decorationSet: DecorationSet.create(newEditorState.doc, [deco]),
                suggestionText: bestRemaining
              };
            }

            return { decorationSet: DecorationSet.empty, suggestionText: null };
          }
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            return pluginState ? pluginState.decorationSet : DecorationSet.empty;
          },
          handleKeyDown(view, event) {
            if (event.key === 'Tab') {
              const pluginState = this.getState(view.state);
              if (pluginState && pluginState.suggestionText) {
                event.preventDefault();
                event.stopPropagation();
                const textToInsert = pluginState.suggestionText.endsWith(' ') 
                  ? pluginState.suggestionText 
                  : pluginState.suggestionText + ' ';
                const tr = view.state.tr.insertText(textToInsert);
                view.dispatch(tr);
                // Clear caches after accepting
                aiSuggestionCache = null;
                dictSuggestionCache = null;
                return true;
              }
            }
            // Escape to dismiss suggestion
            if (event.key === 'Escape') {
              aiSuggestionCache = null;
              dictSuggestionCache = null;
            }
            return false;
          }
        }
      })
    ];
  }
});
