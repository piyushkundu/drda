// ============================================
// हिंदी लेखक - AI Hindi Writer
// Core Application Logic - Powered by Sarvam AI
// ============================================

(function () {
  'use strict';

  // ====== CONFIG ======
  const GROQ_API_KEY = '';
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';

  // ====== STATE ======
  let currentConversionId = 0;
  const state = {
    mode: 'hinglish', // 'hinglish' | 'krutidev'
    liveConvert: true,
    debounceTimer: null,
    isConverting: false,
  };

  // ====== DOM REFS ======
  const $ = (s) => document.querySelector(s);
  const a4Editor = $('#a4Editor');
  const btnCopyUnicode = $('#btnCopyUnicode');
  const btnCopyKrutidev = $('#btnCopyKrutidev');
  const liveBadge = $('#liveBadge');
  const liveBadgeText = $('#liveBadgeText');
  const conversionStatus = $('#conversionStatus');
  const inputWordCount = $('#inputWordCount');
  const inputCharCount = $('#inputCharCount');
  const fontSizeSelect = $('#fontSizeSelect');
  const toastContainer = $('#toastContainer');

  // ====== INIT ======
  function init() {
    bindEvents();
    a4Editor.focus();
  }

  // ====== EVENTS ======
  function bindEvents() {
    // Input typing trigger
    a4Editor.addEventListener('input', onInputChange);

    // Toolbar formatting
    document.querySelectorAll('.toolbar-btn[data-command]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        a4Editor.focus();
        document.execCommand(btn.dataset.command, false, null);
      });
    });

    // Font size
    fontSizeSelect.addEventListener('change', () => {
      a4Editor.focus();
      document.execCommand('fontSize', false, "7");
      let fontElements = a4Editor.querySelectorAll('font[size="7"]');
      fontElements.forEach(el => {
          el.removeAttribute("size");
          el.style.fontSize = fontSizeSelect.value + "px";
      });
    });

    // Copy actions
    btnCopyUnicode.addEventListener('click', copyUnicode);
    btnCopyKrutidev.addEventListener('click', copyKrutidev);
  }

  // ====== INPUT HANDLING ======
  function onInputChange() {
    updateCounts();

    if (state.liveConvert) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => {
        doConvertInPlace();
      }, 400); // Reduced from 1200ms for snappier response
    }
  }

  function updateCounts() {
    const text = a4Editor.innerText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    inputWordCount.textContent = `Words: ${words}`;
    inputCharCount.textContent = `Chars: ${chars}`;
  }

  // ====== CURSOR MANAGEMENT ======
  function insertCursorMarker() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return false;
    
    const range = sel.getRangeAt(0);
    // Don't insert if outside editor
    if (!a4Editor.contains(range.commonAncestorContainer)) return false;

    // Remove existing marker if any
    const existing = document.getElementById('cursor-marker');
    if (existing) existing.remove();

    const marker = document.createElement('span');
    marker.id = 'cursor-marker';
    range.insertNode(marker);
    return true;
  }

  function restoreCursorMarker() {
    const marker = document.getElementById('cursor-marker');
    if (marker) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(marker);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      marker.remove();
    }
  }

  // ====== CONVERT IN PLACE ======
  async function doConvertInPlace() {
    const rawText = a4Editor.innerText.trim();
    if (!rawText) return;

    // Track this request to handle race conditions
    const conversionId = ++currentConversionId;

    // Save cursor position
    const hasCursor = insertCursorMarker();
    const htmlContent = a4Editor.innerHTML;

    await convertWithGroq(htmlContent, hasCursor, conversionId);
  }

  // ====== GROQ AI TRANSLITERATION ======
  async function convertWithGroq(htmlContent, hasCursor, conversionId) {
    state.isConverting = true;
    setConverting(true);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an expert Hinglish to Shuddh Hindi transliterator. 
Convert the user's Hinglish text into pure Unicode Devanagari Hindi. 
CRITICAL INSTRUCTIONS:
1. Output ONLY the translated raw text/HTML. Do not wrap the output in markdown code blocks, tags, or conversational fillers.
2. The user's input may contain HTML tags (like <b>, <div>, <span id="cursor-marker"></span>). YOU MUST PRESERVE ALL HTML EXACTLY AS IT IS. Do not strip, alter, or translate any HTML tags or attributes.
3. Only transliterate the plain text nodes between the tags.
4. Ensure high accuracy for proper nouns, Indian names, and places (e.g., 'baghpat' should accurately be 'बागपत').`
            },
            {
              role: "user",
              content: htmlContent
            }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let hindiHTML = data.choices && data.choices[0] && data.choices[0].message.content;

      // If a newer request was started, or if the user typed something while waiting, abort replacement!
      // This is crucial to prevent "beach hai he chod deta hai" (deleting keystrokes).
      const currentHTMLWithoutMarker = a4Editor.innerHTML.replace(/<span id="cursor-marker">.*?<\/span>/gi, '');
      const requestedHTMLWithoutMarker = htmlContent.replace(/<span id="cursor-marker">.*?<\/span>/gi, '');
      
      if (conversionId !== currentConversionId || currentHTMLWithoutMarker !== requestedHTMLWithoutMarker) {
         // User kept typing. Ignore this stale response.
         const marker = document.getElementById('cursor-marker');
         if (marker) marker.remove();
         return; 
      }

      if (hindiHTML) {
        // Fix any known translation errors
        hindiHTML = applyCustomCorrections(hindiHTML);
        
        // Clean up any markdown blocks Groq might accidentally inject
        hindiHTML = hindiHTML.replace(/^```html\s*/i, '').replace(/```$/i, '').trim();
        
        // Replace editor content
        a4Editor.innerHTML = hindiHTML;
        
        // Restore cursor
        if (hasCursor) {
           restoreCursorMarker();
        }
        
        updateCounts();
        conversionStatus.textContent = '✅ Updated';
      }
    } catch (err) {
      console.error('Groq API error:', err);
      if (conversionId === currentConversionId) conversionStatus.textContent = '❌ Error';
      // Ensure marker is removed if failed
      if (hasCursor) restoreCursorMarker(); 
    } finally {
      if (conversionId === currentConversionId) {
        state.isConverting = false;
        setConverting(false);
      }
    }
  }

  function setConverting(active) {
    if (active) {
      conversionStatus.textContent = '⏳ Converting...';
      liveBadge.style.opacity = '0.5';
    } else {
      setTimeout(() => { 
        if(conversionStatus.textContent === '✅ Updated') conversionStatus.textContent = 'Ready'; 
      }, 2000);
      liveBadge.style.opacity = '1';
    }
  }

  // ====== COPY ACTIONS ======
  function copyUnicode() {
    const text = a4Editor.innerText;
    if (!text.trim()) return showToast('Document is empty!', 'info');
    navigator.clipboard.writeText(text)
      .then(() => showToast('Hindi copied to clipboard! 📋', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
  }

  function copyKrutidev() {
    const text = a4Editor.innerText;
    if (!text.trim()) return showToast('Document is empty!', 'info');
    
    // The editor contains Unicode. We need to convert to KrutiDev to copy.
    const krutiText = unicodeToKrutidev(text);
    
    navigator.clipboard.writeText(krutiText)
      .then(() => showToast('KrutiDev copied to clipboard! ✨ (Ready to paste in MS Word/Govt portals)', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
  }

  // ====== CUSTOM DICTIONARY / AUTO-CORRECTIONS ======
  function applyCustomCorrections(text) {
    let corrected = text;
    const dictionary = {
      // Add more known mistranslations here
      'बड़ियापत': 'बागपत',
      'बड़ियापत': 'बागपत', // precomposed character variant
      'बडियापत': 'बागपत',
      'बदियापत': 'बागपत',
      'बघपत': 'बागपत'
    };

    for (const [wrong, right] of Object.entries(dictionary)) {
      const regex = new RegExp(wrong, 'g');
      corrected = corrected.replace(regex, right);
    }
    return corrected;
  }

  // ====== UNICODE TO KRUTIDEV CONVERTER ======
  function unicodeToKrutidev(unicodeText) {
    if (!unicodeText) return "";
    
    var array_one = [
        "‘", "’", "“", "”", "(", ")", "{", "}", "=", "।", "?", "-", "µ", "॰", ",", ".", "् ", 
        "०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "x", "फ़्", "क़", "ख़", "ग़", "ज़्", "ज़", "ड़", "ढ़", "फ़", "य़", "ऱ", "ऩ", 
        "त्त्", "त्त", "क्त", "दृ", "कृ", "ह्न", "ह्य", "हृ", "ह्म", "ह्र", "ह्", "द्द", "क्ष्", "क्ष", "त्र्", "त्र","ज्ञ", "छ्य", "ट्य", "ठ्य", "ड्य", "ढ्य", "द्य","द्व", "श्र", "ट्र", "ड्र", "ढ्र", "छ्र", "क्र", "फ्र", "द्र", "प्र", "ग्र", "रु", "रू", "्र", "ओ", "औ", "आ", "अ", "ई", "इ", "उ", "ऊ", "ऐ", "ए", "ऋ", "क्", "क", "क्क", "ख्", "ख", "ग्", "ग", "घ्", "घ", "ङ", "चै", "च्", "च", "छ", "ज्", "ज", "झ्", "झ", "ञ", "ट्ट", "ट्ठ", "ट", "ठ", "ड्ड", "ड्ढ", "ड", "ढ", "ण्", "ण", "त्", "त", "थ्", "थ", "द्ध", "द", "ध्", "ध", "न्", "न", "प्", "प", "फ्", "फ", "ब्", "ब", "भ्", "भ", "म्", "म", "य्", "य", "र", "ल्", "ल", "ळ", "व्", "व", "श्", "श", "ष्", "ष", "स्", "स", "ह", "ऑ", "ॉ", "ो", "ौ", "ा", "ी", "ु", "ू", "ृ", "े", "ै", "ं", "ँ", "ः", "ॅ", "ऽ", "् ", "्"
    ];

    var array_two = [
        "^", "*", "Þ", "ß", "¼", "½", "¿", "À", "¾", "A", "\\", "&", "&", "Œ", "]","-","~ ", 
        "å", "ƒ", "„", "…", "†", "‡", "ˆ", "‰", "Š", "‹","Û", "¶", "d", "[k", "x", "T", "t", "M+", "<+", "Q", ";", "j", "u", 
        "Ù", "Ùk", "ä", "–", "—", "à", "á", "â", "ã", "ºz", "º", "í", "{", "{k", "«", "=", "K", "Nî", "Vî", "Bî", "Mî", "<î", "|","}", "J", "Vª", "Mª", "<ªª", "Nª", "Ø", "Ý", "æ", "ç", "xz", "#", ":", "z", 
        "vks", "vkS", "vk", "v", "bZ", "b", "m", "Å", ",s", ",", "_", "D", "d", "ô", "[", "[k", "X", "x", "?", "?k", "³", "pkS", "P", "p", "N", "T", "t", "÷", ">", "¥", "ê", "ë", "V", "B", "ì", "ï", "M", "<", ".", ".k", "R", "r", "F", "Fk", ")", "n", "/", "/k", "U", "u", "I", "i", "¶", "Q", "C", "c", "H", "Hk", "E", "e", "¸", ";", "j", "Y", "y", "G", "O", "o", "'", "'k", "\"", "\"k", "L", "l", "g", "v‚", "‚", "ks", "kS", "k", "h", "q", "w", "`", "s", "S", "a", "¡", "%", "W", "·", "~ ", "~"
    ];

    var modified_substring = unicodeText;

    modified_substring = modified_substring.replace(/क़/g, "क़");
    modified_substring = modified_substring.replace(/ख़‌/g, "ख़");
    modified_substring = modified_substring.replace(/ग़/g, "ग़");
    modified_substring = modified_substring.replace(/ज़/g, "ज़");
    modified_substring = modified_substring.replace(/ड़/g, "ड़");
    modified_substring = modified_substring.replace(/ढ़/g, "ढ़");
    modified_substring = modified_substring.replace(/ऩ/g, "ऩ");
    modified_substring = modified_substring.replace(/फ़/g, "फ़");
    modified_substring = modified_substring.replace(/य़/g, "य़");
    modified_substring = modified_substring.replace(/ऱ/g, "ऱ");

    var position_of_f = modified_substring.indexOf("ि");
    while (position_of_f != -1) {
        var character_left_to_f = modified_substring.charAt(position_of_f - 1);
        modified_substring = modified_substring.replace(character_left_to_f + "ि", "f" + character_left_to_f);
        position_of_f = position_of_f - 1;
        while ((modified_substring.charAt(position_of_f - 1) == "्") && (position_of_f != 0)) {
            var string_to_be_replaced = modified_substring.charAt(position_of_f - 2) + "्";
            modified_substring = modified_substring.replace(string_to_be_replaced + "f", "f" + string_to_be_replaced);
            position_of_f = position_of_f - 2;
        }
        position_of_f = modified_substring.search(/ि/, position_of_f + 1);
    }

    var set_of_matras = "ािीुूृेैोौं:ँॅ";
    modified_substring += '  '; 
    var position_of_half_R = modified_substring.indexOf("र्");
    while (position_of_half_R > 0) {
        var probable_position_of_Z = position_of_half_R + 2;
        var character_right_to_probable_position_of_Z = modified_substring.charAt(probable_position_of_Z + 1);
        while (set_of_matras.indexOf(character_right_to_probable_position_of_Z) != -1) {
            probable_position_of_Z = probable_position_of_Z + 1;
            character_right_to_probable_position_of_Z = modified_substring.charAt(probable_position_of_Z + 1);
        }
        var string_to_be_replaced = modified_substring.substr(position_of_half_R + 2, (probable_position_of_Z - position_of_half_R - 1));
        modified_substring = modified_substring.replace("र्" + string_to_be_replaced, string_to_be_replaced + "Z");
        position_of_half_R = modified_substring.indexOf("र्");
    }
    modified_substring = modified_substring.substr(0, modified_substring.length - 2);

    for (var input_symbol_idx = 0; input_symbol_idx < array_one.length; input_symbol_idx++) {
        var idx = 0;
        while (idx != -1) {
            modified_substring = modified_substring.replace(array_one[input_symbol_idx], array_two[input_symbol_idx]);
            idx = modified_substring.indexOf(array_one[input_symbol_idx]);
        }
    }
    return modified_substring;
  }

  // ====== KRUTIDEV TO UNICODE CONVERTER ======
  function krutiDevToUnicode(input) {
    const mapTable = [
      ['ÊÙ', 'ह्न'], ['## ', ''], ['ÙÒ', 'ड्ढ'], ['Ù', 'ह्'], ['å', 'ॅ'],
      ['¼', '़'], ['Ë', 'द्द'], ['Í', 'ट्ट'], ['Î', 'ट्ठ'], ['Ï', 'ड्ड'],
      ['Ñ', 'ड्ढ'], ['Ó', 'द्ध'], ['Ô', 'द्व'], ['Ö', 'श्र'],
      ['{', 'क्ष'], ['=kk', 'क्का'], ['=kh', 'क्खा'], ['Dkk', 'क्का'],
      ['Dkh', 'क्खा'], ['d~', 'क्'], ['Dh', 'क्ख'], ['d', 'क'],
      ['D', 'क्'], ['[k', 'ख'], ['[', 'ख्'], ['x', 'ग'],
      ['X', 'ग्'], ['?k', 'घ'], ['?', 'घ्'], ['³', 'ङ'],
      ['p', 'च'], ['P', 'च्'], ['N', 'छ'], ['t', 'ज'],
      ['T', 'ज्'], ['>k', 'झ'], ['>', 'झ्'], ['¥', 'ञ'],
      ['V', 'ट'], ['B', 'ठ'], ['M+', 'ढ'], ['M', 'ड'],
      ['<+', 'ढ'], ['<', 'ड'], ['.k', 'ण'], ['.', 'ण्'],
      ['r', 'त'], ['R', 'त्'], ['Fk', 'थ'], ['F', 'थ्'],
      ['n', 'द'], ['U', 'ध'], ['è', 'ध्'], ['/k', 'न'],
      ['/', 'न्'], ['i', 'प'], ['I', 'प्'], ['Q', 'फ'],
      ['c', 'ब'], ['C', 'ब्'], ['Hk', 'भ'], ['H', 'भ्'],
      ['e', 'म'], ['E', 'म्'], [';', 'य'], ['J', 'य्'],
      ['j', 'र'], ['y', 'ल'], ['Y', 'ल्'], ['o', 'व'],
      ['v', 'श'], ['\'k', 'ष'], ['\'', 'ष्'], ['l', 'स'],
      ['L', 'स्'], ['g', 'ह'], ['È', 'क्त'], ['à', 'त्र'],
      ['=', 'क्'], ['v', 'श'], ['f', 'ड'], ['q', 'फ़'],
      ['W', 'ज़'], ['w', 'ग़'],
      ['É', 'न्न'], ['ê', 'त्त'], ['ë', 'न्ह'], ['ì', 'प्र'],
      ['í', 'भ्र'], ['î', 'म्र'], ['ï', 'ह्म'], ['ð', 'ह्य'],
      ['ñ', 'ह्र'], ['ò', 'ह्ल'], ['ó', 'द्ध'], ['ô', 'द्व'],
    ];

    const matraMap = [
      ['¨k', 'ी'], ['¨', 'ी'], ['s', 'ु'], ['q', 'ू'],
      ['s', 'ु'], ['q', 'ू'], ['`', 'ृ'], ['z', 'र्'],
      ['a', 'े'], ['k', 'ा'], ['h', 'ै'], ['\u0027', '्'],
    ];

    let s = input;
    const sortedMap = [...mapTable].sort((a, b) => b[0].length - a[0].length);

    s = s.replace(/f+k/g, 'h');
    s = s.replace(/fh/g, 'ी');

    let result = '';
    let i = 0;

    for (const [kru, uni] of sortedMap) {
      s = s.split(kru).join(uni);
    }

    let chars = s.split('');
    result = '';
    for (i = 0; i < chars.length; i++) {
      if (chars[i] === 'f') {
        if (i + 1 < chars.length) {
          result += chars[i + 1] + 'ि';
          i++;
        } else {
          result += 'ि';
        }
      } else {
        result += chars[i];
      }
    }

    s = result;

    for (const [kru, uni] of matraMap) {
      s = s.split(kru).join(uni);
    }

    s = s.replace(/~/, '्');
    s = s.replace(/a/g, 'े');
    s = s.replace(/S/g, 'ं');
    s = s.replace(/W/g, 'ँ');
    s = s.replace(/A/g, 'ं');
    s = s.replace(/Å/g, 'ॅं');
    s = s.replace(/¡/g, '!');
    s = s.replace(/K/g, 'ज्ञ');
    s = s.replace(/\%/g, 'ः');
    s = s.replace(/Œ/g, 'ऑ');
    s = s.replace(/vk/g, 'आ');
    s = s.replace(/b/g, 'ई');
    s = s.replace(/m/g, 'ऋ');
    s = s.replace(/´/g, '॰');
    s = s.replace(/ƒ/g, '०');
    s = s.replace(/„/g, '१');
    s = s.replace(/…/g, '२');
    s = s.replace(/†/g, '३');
    s = s.replace(/‡/g, '४');
    s = s.replace(/ˆ/g, '५');
    s = s.replace(/‰/g, '६');
    s = s.replace(/Š/g, '७');
    s = s.replace(/‹/g, '८');
    s = s.replace(/Œ/g, '९');
    s = s.replace(/\|/g, '।');

    return s;
  }



  // ====== TOAST ======
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ====== START ======
  init();
})();
