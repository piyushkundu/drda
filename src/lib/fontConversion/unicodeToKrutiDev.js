"use strict";
// Ported perfectly from UP NIC font converter for Unicode to Kruti Dev 010
Object.defineProperty(exports, "__esModule", { value: true });
exports.unicodeToKrutiDev = unicodeToKrutiDev;
function unicodeToKrutiDev(text) {
    if (!text)
        return '';
    var array_one = [
        "‘", "’", "“", "”", "(", ")", "{", "}", "=", "।", "?", "-", "µ", "॰", ",", ".", "् ",
        "०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "x", "+", ";", "_",
        "फ़्", "क़", "ख़", "ग़", "ज़्", "ज़", "ड़", "ढ़", "फ़", "य़", "ऱ", "ऩ",
        "त्त्", "त्त", "क्त", "दृ", "कृ",
        "श्व", "ह्न", "ह्य", "हृ", "ह्म", "ह्र", "ह्", "द्द", "क्ष्", "क्ष", "त्र्", "त्र", "ज्ञ",
        "छ्य", "ट्य", "ठ्य", "ड्य", "ढ्य", "द्य", "द्व",
        "श्र", "ट्र", "ड्र", "ढ्र", "छ्र", "क्र", "फ्र", "द्र", "प्र", "ग्र", "रु", "रू",
        "्र",
        "ओ", "औ", "आ", "अ", "ई", "इ", "उ", "ऊ", "ऐ", "ए", "ऋ",
        "क्", "क", "क्क", "ख्", "ख", "ग्", "ग", "घ्", "घ", "ङ",
        "चै", "च्", "च", "छ", "ज्", "ज", "झ्", "झ", "ञ",
        "ट्ट", "ट्ठ", "ट", "ठ", "ड्ड", "ड्ढ", "ड", "ढ", "ण्", "ण",
        "त्", "त", "थ्", "थ", "द्ध", "द", "ध्", "ध", "न्", "न",
        "प्", "प", "फ्", "फ", "ब्", "ब", "भ्", "भ", "म्", "म",
        "य्", "य", "र", "ल्", "ल", "ळ", "व्", "व",
        "श्", "श", "ष्", "ष", "स्", "स", "ह",
        "ऑ", "ॉ", "ो", "ौ", "ा", "ी", "ु", "ू", "ृ", "े", "ै",
        "ं", "ँ", "ः", "ॅ", "ऽ", "् ", "्", "़", "/"
    ];
    var array_two = [
        "^", "*", "Þ", "ß", "¼", "½", "¿", "À", "¾", "A", "\\", "&", "&", "Œ", "]", "-", "~ ",
        "å", "ƒ", "„", "…", "†", "‡", "ˆ", "‰", "Š", "‹", "Û", "$", "(", "&",
        "¶+", "d+", "[k+", "x+", "T+", "t+", "M+", "<+", "Q+", ";+", "j+", "u+",
        "Ù", "Ùk", "ä", "–", "—",
        "Üo", "à", "á", "â", "ã", "ºz", "º", "í", "{", "{k", "«", "=", "K",
        "Nî", "Vî", "Bî", "Mî", "<î", "|", "}",
        "J", "Vª", "Mª", "<ªª", "Nª", "Ø", "Ý", "æ", "ç", "xz", "#", ":",
        "z",
        "vks", "vkS", "vk", "v", "bZ", "b", "m", "Å", ",s", ",", "_",
        "D", "d", "ô", "[", "[k", "X", "x", "?", "?k", "³",
        "pkS", "P", "p", "N", "T", "t", "÷", ">", "¥",
        "ê", "ë", "V", "B", "ì", "ï", "M", "<", ".", ".k",
        "R", "r", "F", "Fk", ")", "n", "è", "èk", "U", "u",
        "I", "i", "¶", "Q", "C", "c", "H", "Hk", "E", "e",
        "¸", ";", "j", "Y", "y", "G", "O", "o",
        "'", "'k", "\"", "\"k", "L", "l", "g",
        "v‚", "‚", "ks", "kS", "k", "h", "q", "w", "`", "s", "S",
        "a", "¡", "%", "W", "·", "~ ", "~", "+", "@"
    ];
    var modified_substring = text;
    // 1. Replace 2-byte nukta_varNa with 1-byte
    modified_substring = modified_substring.replace(/त्र्य/g, "«य");
    modified_substring = modified_substring.replace(/श्र्य/g, "Ü‍‍zय");
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
    // 2. Code for replacing "ि" (chhotee ee kii maatraa) with "f" and correcting its position
    var position_of_f = modified_substring.indexOf("ि");
    while (position_of_f !== -1) {
        var character_left_to_f = modified_substring.charAt(position_of_f - 1);
        modified_substring = modified_substring.replace(character_left_to_f + "ि", "f" + character_left_to_f);
        position_of_f = position_of_f - 1;
        while ((modified_substring.charAt(position_of_f - 1) === "्") && (position_of_f !== 0)) {
            var string_to_be_replaced = modified_substring.charAt(position_of_f - 2) + "्";
            modified_substring = modified_substring.replace(string_to_be_replaced + "f", "f" + string_to_be_replaced);
            position_of_f = position_of_f - 2;
        }
        position_of_f = modified_substring.indexOf("ि", position_of_f + 1);
    }
    // 3. Eliminating "र्" and putting Z at proper position
    var set_of_matras = "ािीुूृेैोौं:ँॅ";
    modified_substring += '  '; // add two spaces to avoid UNDEFINED char
    var position_of_half_R = modified_substring.indexOf("र्");
    while (position_of_half_R > 0) {
        var probable_position_of_Z = position_of_half_R + 2;
        var character_at_probable_position_of_Z = modified_substring.charAt(probable_position_of_Z);
        while (set_of_matras.includes(character_at_probable_position_of_Z)) {
            probable_position_of_Z = probable_position_of_Z + 1;
            character_at_probable_position_of_Z = modified_substring.charAt(probable_position_of_Z);
        }
        var right_to_position_of_Z = probable_position_of_Z + 1;
        if (right_to_position_of_Z > 0) {
            var character_right_to_position_of_Z = modified_substring.charAt(right_to_position_of_Z);
            while (character_right_to_position_of_Z === "्") {
                probable_position_of_Z = right_to_position_of_Z + 1;
                character_at_probable_position_of_Z = modified_substring.charAt(probable_position_of_Z);
                right_to_position_of_Z = probable_position_of_Z + 1;
                character_right_to_position_of_Z = modified_substring.charAt(right_to_position_of_Z);
            }
        }
        // Original NIC uses: substr(position_of_half_R + 2, (probable_position_of_Z - position_of_half_R) - 1)
        var len = (probable_position_of_Z - position_of_half_R) - 1;
        var string_to_be_replaced = modified_substring.substring(position_of_half_R + 2, position_of_half_R + 2 + len);
        modified_substring = modified_substring.replace("र्" + string_to_be_replaced, string_to_be_replaced + "Z");
        position_of_half_R = modified_substring.indexOf("र्");
    }
    modified_substring = modified_substring.substring(0, modified_substring.length - 2);
    // 4. Substitute array_two elements in place of corresponding array_one elements
    for (var input_symbol_idx = 0; input_symbol_idx < array_one.length; input_symbol_idx++) {
        var idx = 0;
        while (idx !== -1) {
            modified_substring = modified_substring.replace(array_one[input_symbol_idx], array_two[input_symbol_idx]);
            idx = modified_substring.indexOf(array_one[input_symbol_idx]);
        }
    }
    // 5. Post-processing
    modified_substring = modified_substring.replace(/Zksa/g, "ksZa");
    modified_substring = modified_substring.replace(/~ Z/g, "Z~");
    modified_substring = modified_substring.replace(/Zk/g, "kZ");
    modified_substring = modified_substring.replace(/Zh/g, "Ê");
    return modified_substring;
}
exports.default = unicodeToKrutiDev;
