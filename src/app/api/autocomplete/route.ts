import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Global cache for dictionary words
let dictionaryWords: string[] | null = null;
let priorityWords: string[] | null = null;

function loadDictionaries() {
  if (dictionaryWords && priorityWords) return { dictionaryWords, priorityWords };

  try {
    const dictDir = path.join(process.cwd(), 'src', 'dictionaries');
    const dicPath = path.join(dictDir, 'hi_IN.dic');
    const priorityPath = path.join(dictDir, 'priority_words.json');

    // Load Priority Words
    if (fs.existsSync(priorityPath)) {
      priorityWords = JSON.parse(fs.readFileSync(priorityPath, 'utf-8'));
    } else {
      priorityWords = [];
    }

    if (!fs.existsSync(dicPath)) {
      console.error('Hunspell dictionary file not found in src/dictionaries');
      return { dictionaryWords: [], priorityWords: priorityWords || [] };
    }

    const dicContent = fs.readFileSync(dicPath, 'utf-8');
    
    console.time('dictionary_load');
    const lines = dicContent.split(/\r?\n/);
    const words: string[] = [];
    
    // Skip first line (word count)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Remove Hunspell flags (everything after the first '/')
      const word = line.split('/')[0];
      
      // Basic sanitization
      if (!word || /^[\d०-९]+$/.test(word) || /^[a-zA-Z]+$/.test(word)) continue;
      
      words.push(word);
    }
    
    dictionaryWords = words;
    console.timeEnd('dictionary_load');
    
    return { dictionaryWords, priorityWords };
  } catch (err) {
    console.error('Error loading dictionary:', err);
    return { dictionaryWords: [], priorityWords: [] };
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const prefix = searchParams.get('q');
    
    if (!prefix || prefix.trim().length < 1) {
      return NextResponse.json({ results: [] });
    }

    const cleanPrefix = prefix.trim();
    const { dictionaryWords, priorityWords } = loadDictionaries();
    
    const matches: string[] = [];
    const seen = new Set<string>();

    // 1. First, search in Priority Words (already sorted by frequency)
    if (priorityWords) {
      for (const word of priorityWords) {
        if (word.startsWith(cleanPrefix) && word !== cleanPrefix) {
          // Remove punctuation like '।' from the end just in case
          const cleanWord = word.replace(/[।.,]+$/, '');
          if (!seen.has(cleanWord)) {
            matches.push(cleanWord);
            seen.add(cleanWord);
            if (matches.length >= 5) break;
          }
        }
      }
    }
    
    // 2. If we need more, search the global dictionary
    if (matches.length < 5 && dictionaryWords) {
      const globalMatches: string[] = [];
      for (let i = 0; i < dictionaryWords.length; i++) {
        const word = dictionaryWords[i];
        if (word.startsWith(cleanPrefix) && word !== cleanPrefix && !seen.has(word)) {
          globalMatches.push(word);
        }
      }
      
      // Sort global matches by length (shorter first)
      globalMatches.sort((a, b) => a.length - b.length);
      
      // Append to our matches
      for (const gm of globalMatches) {
        matches.push(gm);
        seen.add(gm);
        if (matches.length >= 5) break;
      }
    }
    
    return NextResponse.json({ results: matches.slice(0, 5) });
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
