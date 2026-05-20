// Phonetic IME for Mangal (Unicode) and KrutiDev direct typing
import { hinglishToHindi } from './fontConversion/hinglishToHindi';
import { unicodeToKrutiDev } from './fontConversion/unicodeToKrutiDev';

export type IMEMode = 'unicode' | 'mangal' | 'krutidev';

const RESET_CHARS = new Set([' ', '\n', '.', ',', '।', ';', ':', '!', '?', '(', ')', '"', "'", '-']);
const PASS_THROUGH = /^[0-9@#$%^&*+=|\\/<>~`_\[\]{}]$/;

export class PhoneticIME {
  private buffer = '';
  private lastInserted = '';
  mode: IMEMode = 'unicode';

  reset() { this.buffer = ''; this.lastInserted = ''; }

  processKey(key: string): { deleteCount: number; insertText: string } | null {
    if (this.mode === 'unicode') return null;
    if (key.length !== 1) return null;
    if (RESET_CHARS.has(key)) { this.reset(); return null; }
    if (PASS_THROUGH.test(key)) { this.reset(); return null; }

    this.buffer += key;
    let hindi = hinglishToHindi(this.buffer);
    if (this.mode === 'krutidev') hindi = unicodeToKrutiDev(hindi);

    const deleteCount = [...this.lastInserted].length;
    this.lastInserted = hindi;
    return { deleteCount, insertText: hindi };
  }
}
