// ============================================
// हिंदी लेखक - AI Hindi Writer
// Core Application Logic - Powered by Sarvam AI
// ============================================

(function () {
  'use strict';

  // ====== CONFIG ======
  const SARVAM_API_KEY = 'sk_m1nd33fo_iQ5jcdXRTXkpmRQoZQzndkVB';
  const SARVAM_TRANSLITERATE_URL = 'https://api.sarvam.ai/transliterate';

  // ====== STATE ======
  const state = {
    mode: 'hinglish', // 'hinglish' | 'krutidev'
    liveConvert: true,
    debounceTimer: null,
    isConverting: false,
  };

  // ====== DOM REFS ======
  const $ = (s) => document.querySelector(s);
  const editorInput = $('#editorInput');
  const editorOutput = $('#editorOutput');
  const convertBtn = $('#convertBtn');
  const convertBtnText = $('#convertBtnText');
  const modeHinglish = $('#modeHinglish');
  const modeKrutidev = $('#modeKrutidev');
  const liveToggle = $('#liveToggle');
  const liveBadge = $('#liveBadge');
  const liveBadgeText = $('#liveBadgeText');
  const statusDot = $('#statusDot');
  const statusText = $('#statusText');
  const outputLabel = $('#outputLabel');
  const modeStatus = $('#modeStatus');
  const conversionStatus = $('#conversionStatus');
  const inputWordCount = $('#inputWordCount');
  const inputCharCount = $('#inputCharCount');
  const fontSizeSelect = $('#fontSizeSelect');
  const toastContainer = $('#toastContainer');

  // ====== INIT ======
  function init() {
    // Sarvam API key is hardcoded, always connected
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'Sarvam AI Connected';
    bindEvents();
  }

  // ====== EVENTS ======
  function bindEvents() {
    // Mode switch
    modeHinglish.addEventListener('click', () => setMode('hinglish'));
    modeKrutidev.addEventListener('click', () => setMode('krutidev'));

    // Live toggle
    liveToggle.addEventListener('click', toggleLive);

    // Convert button
    convertBtn.addEventListener('click', doConvert);

    // Input typing
    editorInput.addEventListener('input', onInputChange);

    // Toolbar formatting
    document.querySelectorAll('.toolbar-btn[data-command]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editorOutput.focus();
        document.execCommand(btn.dataset.command, false, null);
      });
    });

    // Font size
    fontSizeSelect.addEventListener('change', () => {
      editorOutput.style.fontSize = fontSizeSelect.value + 'px';
    });

    // Quick actions
    $('#btnCopyOutput').addEventListener('click', copyOutput);
    $('#btnDownload').addEventListener('click', downloadOutput);
    $('#btnClearAll').addEventListener('click', clearAll);

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) doConvert();
    });
  }

  // ====== MODE ======
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('active'));
    if (mode === 'hinglish') {
      modeHinglish.classList.add('active');
      editorInput.placeholder = "यहाँ Hinglish में लिखें... (e.g., 'mera naam Bharat hai')";
      outputLabel.textContent = 'शुद्ध हिंदी Output';
      modeStatus.textContent = '📝 Hinglish → Hindi';
    } else {
      modeKrutidev.classList.add('active');
      editorInput.placeholder = 'KrutiDev font text यहाँ paste करें...';
      outputLabel.textContent = 'Unicode Hindi Output';
      modeStatus.textContent = '🔄 KrutiDev → Unicode';
    }
  }

  // ====== LIVE TOGGLE ======
  function toggleLive() {
    state.liveConvert = !state.liveConvert;
    liveToggle.classList.toggle('active', state.liveConvert);
    liveBadge.className = state.liveConvert ? 'live-badge on' : 'live-badge off';
    liveBadgeText.textContent = state.liveConvert ? 'LIVE' : 'MANUAL';
  }

  // ====== INPUT HANDLING ======
  function onInputChange() {
    updateCounts();

    if (state.liveConvert) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => {
        doConvert();
      }, 700);
    }
  }

  function updateCounts() {
    const text = editorInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    inputWordCount.textContent = `Words: ${words}`;
    inputCharCount.textContent = `Chars: ${chars}`;
  }

  // ====== CONVERT ======
  async function doConvert() {
    const text = editorInput.value.trim();
    if (!text) return;
    if (state.isConverting) return;

    if (state.mode === 'krutidev') {
      // KrutiDev conversion - offline
      const result = krutiDevToUnicode(text);
      editorOutput.textContent = result;
      conversionStatus.textContent = '✅ Converted (KrutiDev)';
      showToast('KrutiDev → Unicode conversion done!', 'success');
    } else {
      // Hinglish → Hindi via Sarvam AI
      await convertWithSarvam(text);
    }
  }

  // ====== SARVAM AI TRANSLITERATION ======
  async function convertWithSarvam(text) {
    state.isConverting = true;
    setConverting(true);

    try {
      const response = await fetch(SARVAM_TRANSLITERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY,
        },
        body: JSON.stringify({
          input: text,
          source_language_code: 'en-IN',
          target_language_code: 'hi-IN',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const hindiText = data.transliterated_text || '';

      if (hindiText) {
        // Fix any known translation errors from Sarvam API
        const correctedHindiText = applyCustomCorrections(hindiText);
        
        // Since we are using KrutiDev font, convert Unicode Hindi to KrutiDev format
        const krutiDevText = unicodeToKrutidev(correctedHindiText);
        editorOutput.textContent = krutiDevText;
        conversionStatus.textContent = '✅ Converted';
        showToast('Hindi conversion done! ✨', 'success');
      } else {
        throw new Error('Empty response from Sarvam AI');
      }
    } catch (err) {
      console.error('Sarvam API error:', err);
      conversionStatus.textContent = '❌ Error';
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      state.isConverting = false;
      setConverting(false);
    }
  }

  function setConverting(active) {
    if (active) {
      convertBtnText.innerHTML = '<div class="spinner"></div> Converting...';
      convertBtn.disabled = true;
      conversionStatus.textContent = '⏳ Converting...';
    } else {
      convertBtnText.textContent = '✨ Convert';
      convertBtn.disabled = false;
    }
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

  // ====== QUICK ACTIONS ======
  function copyOutput() {
    const text = editorOutput.innerText || editorOutput.textContent;
    if (!text.trim()) {
      showToast('कुछ convert करें पहले!', 'info');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('Copied to clipboard! 📋', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
  }

  function downloadOutput() {
    const text = editorOutput.innerText || editorOutput.textContent;
    if (!text.trim()) {
      showToast('कुछ convert करें पहले!', 'info');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hindi_text.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('File downloaded! 💾', 'success');
  }

  function clearAll() {
    editorInput.value = '';
    editorOutput.textContent = '';
    updateCounts();
    conversionStatus.textContent = 'Ready';
    showToast('All cleared!', 'info');
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
