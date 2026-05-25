export const inscriptMap: Record<string, string> = {
  'q': 'ौ', 'w': 'ै', 'e': 'ा', 'r': 'ी', 't': 'ू', 'y': 'ब', 'u': 'ह', 'i': 'ग', 'o': 'द', 'p': 'ज', '[': 'ड', ']': '़',
  'a': 'ो', 's': 'े', 'd': '्', 'f': 'ि', 'g': 'ु', 'h': 'प', 'j': 'र', 'k': 'क', 'l': 'त', ';': 'च', '\'': 'ट',
  'z': 'र्', 'x': 'ं', 'c': 'म', 'v': 'न', 'b': 'व', 'n': 'ल', 'm': 'स', ',': ',', '.': '.', '/': 'य',
  'Q': 'औ', 'W': 'ऐ', 'E': 'आ', 'R': 'ई', 'T': 'ऊ', 'Y': 'भ', 'U': 'ङ', 'I': 'घ', 'O': 'ध', 'P': 'झ', '{': 'ढ', '}': 'ञ',
  'A': 'ओ', 'S': 'ए', 'D': 'अ', 'F': 'इ', 'G': 'उ', 'H': 'फ', 'J': 'श्र', 'K': 'ख', 'L': 'थ', ':': 'छ', '"': 'ठ',
  'Z': 'र्', 'X': 'ँ', 'C': 'ण', 'V': 'न', 'B': 'व', 'N': 'ळ', 'M': 'श', '<': 'ष', '>': '।', '?': 'य़',
  // Number keys — output decimal (English) digits in normal mode
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  // Shift+Number keys — Devanagari special characters (Mangal layout)
  '!': 'ऍ', '@': 'ॅ', '#': '्र', '$': 'र्', '%': 'ज्ञ', '^': 'त्र', '&': 'क्ष', '*': 'श्र', '(': '(', ')': ')',
  '-': '-', '=': 'ृ', '_': 'ः', '+': 'ऋ'
};

export const remingtonMap: Record<string, string> = {
  // We can just use the krutiDevToUnicodeMap conceptually, but for Krutidev font, 
  // we actually just want to type English letters so the font can render them!
};
