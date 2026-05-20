import { krutiDevToUnicode } from './fontConversion/krutiDevToUnicode';

const RESET_CHARS = new Set([' ', '\n', '.', ',', '।', ';', ':', '!', '?', '(', ')', '"', "'", '-']);

export class RemingtonIME {
  private buffer = '';
  private lastInserted = '';

  reset() { 
    this.buffer = ''; 
    this.lastInserted = ''; 
  }

  processKey(key: string): { deleteCount: number; insertText: string } | null {
    if (key.length !== 1) return null;
    if (RESET_CHARS.has(key)) { 
      this.reset(); 
      return null; 
    }

    this.buffer += key;
    const hindi = krutiDevToUnicode(this.buffer);

    const deleteCount = [...this.lastInserted].length;
    this.lastInserted = hindi;
    return { deleteCount, insertText: hindi };
  }
}
