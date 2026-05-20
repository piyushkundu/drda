import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { getCompletions } from '@/lib/dictionaries';
import { useAIStore } from '@/stores/aiStore';

export const ghostTextPluginKey = new PluginKey('ghostText');

// AI context suggestion cache
let aiSuggestionCache: { context: string; suggestion: string; timestamp: number } | null = null;
let aiRequestTimeout: ReturnType<typeof setTimeout> | null = null;
let lastAIRequestContext = '';

// Debounced AI suggestion fetcher
function fetchAISuggestion(fullText: string, lastSentence: string) {
  if (aiRequestTimeout) clearTimeout(aiRequestTimeout);
  if (lastSentence.length < 10) return; // Too short for AI
  if (lastAIRequestContext === lastSentence) return; // Already requested

  aiRequestTimeout = setTimeout(async () => {
    lastAIRequestContext = lastSentence;
    try {
      const aiStore = useAIStore.getState();
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          prompt: `Complete this Hindi sentence naturally. Only output the remaining text (not the given text). Keep it short (max 15 words). Text: "${lastSentence}"`,
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
        // Clean up the AI response - take only the first sentence/clause
        let clean = result.trim();
        // Remove if it repeats the input
        if (clean.startsWith(lastSentence)) {
          clean = clean.slice(lastSentence.length).trim();
        }
        // Take only first line
        clean = clean.split('\n')[0].trim();
        // Limit length
        if (clean.length > 80) clean = clean.slice(0, 80);

        if (clean) {
          aiSuggestionCache = {
            context: lastSentence,
            suggestion: clean,
            timestamp: Date.now()
          };
        }
      }
    } catch {
      // Silently fail
    }
  }, 800); // 800ms debounce
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

            // ── Dictionary-based suggestions (priority 1) ──
            let bestRemaining: string | null = null;
            const maxLookback = Math.min(words.length, 5);
            for (let i = maxLookback; i >= 1; i--) {
              const phrase = words.slice(-i).join(' ');
              if (phrase.length === 0) continue;
              const completions = getCompletions(phrase, 3);
              if (completions.length > 0) {
                const best = completions[0];
                const remaining = best.slice(phrase.length);
                if (remaining.length > 0) {
                  bestRemaining = remaining;
                  break;
                }
              }
            }

            // ── AI context-based suggestions (priority 2 - if no dictionary match) ──
            if (!bestRemaining && textBefore.length > 15) {
              // Check if we have a cached AI suggestion that matches
              if (aiSuggestionCache && 
                  textBefore.endsWith(aiSuggestionCache.context) &&
                  (Date.now() - aiSuggestionCache.timestamp) < 30000) {
                bestRemaining = aiSuggestionCache.suggestion;
              } else {
                // Request new AI suggestion in background
                const fullDocText = newEditorState.doc.textContent;
                const lastSentence = words.slice(-8).join(' ');
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
                const tr = view.state.tr.insertText(pluginState.suggestionText);
                view.dispatch(tr);
                // Clear AI cache after accepting
                aiSuggestionCache = null;
                return true;
              }
            }
            // Escape to dismiss suggestion
            if (event.key === 'Escape') {
              aiSuggestionCache = null;
            }
            return false;
          }
        }
      })
    ];
  }
});
