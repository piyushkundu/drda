import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nspell from 'nspell';

// Global cache for nspell instance to prevent reloading on every request
let spellChecker: nspell | null = null;

function getSpellChecker() {
  if (spellChecker) return spellChecker;

  try {
    const dictDir = path.join(process.cwd(), 'src', 'dictionaries');
    const affPath = path.join(dictDir, 'hi_IN.aff');
    const dicPath = path.join(dictDir, 'hi_IN.dic');

    if (!fs.existsSync(affPath) || !fs.existsSync(dicPath)) {
      console.error('Hunspell dictionary files not found in src/dictionaries');
      return null;
    }

    const aff = fs.readFileSync(affPath, 'utf-8');
    const dic = fs.readFileSync(dicPath, 'utf-8');

    console.time('nspell_init');
    spellChecker = nspell(aff, dic);
    console.timeEnd('nspell_init');
    
    return spellChecker;
  } catch (err) {
    console.error('Error initializing nspell:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { words } = await req.json();
    
    if (!words || !Array.isArray(words)) {
      return NextResponse.json({ error: 'Invalid payload, expected { words: string[] }' }, { status: 400 });
    }

    const spell = getSpellChecker();
    if (!spell) {
      return NextResponse.json({ error: 'Spellchecker not initialized' }, { status: 500 });
    }

    const results: Record<string, string[]> = {};

    for (const word of words) {
      // Basic sanitization
      const cleanWord = word.replace(/[,।:.!?;()'"]/g, '').trim();
      
      // Skip empty
      if (!cleanWord) continue;
      
      // Skip numbers
      if (/^[\d०-९]+$/.test(cleanWord)) continue;
      
      // Skip words with digits mixed in (like abbreviations)
      if (/[\d०-९]/.test(cleanWord)) continue;
      
      // Skip purely English words
      if (/^[a-zA-Z]+$/.test(cleanWord)) continue;

      // Check spelling
      const isCorrect = spell.correct(cleanWord);
      
      if (!isCorrect) {
        // If wrong, get suggestions
        results[word] = spell.suggest(cleanWord).slice(0, 5); // Limit to top 5 suggestions
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Spellcheck API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
