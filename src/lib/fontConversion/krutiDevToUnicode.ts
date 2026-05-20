// Ported perfectly from UP NIC font converter

export function krutiDevToUnicode(text: string): string {
  if (!text) return '';

  const array_one = [
    "ñ","Q+Z","sas","aa",")Z","ZZ","‘","’","“","”",
    "å","ƒ","„","…","†","‡","ˆ","‰","Š","‹", 
    "¶+","d+","[+k","[+","x+","T+","t+","M+","<+","Q+",";+","j+","u+",
    "Ùk","Ù","ä","–","—","é","™","=kk","f=k",  
    "à","á","â","ã","ºz","º","í","{k","{","=","«",   
    "Nî","Vî","Bî","Mî","<î","|","K","}",
    "J","Vª","Mª","<ªª","Nª","Ø","Ý","nzZ","æ","ç","Á","xz","#",":",
    "v‚","vks","vkS","vk","v","b±","Ã","bZ","b","m","Å",",s",",","_",
    "ô","d","Dk","D","£","[k","[","x","Xk","X","Ä","?k","?","³", 
    "p","Pk","P","N","t","Tk","T",">","÷","¥",
    "ê","ë","V","B","ì","ï","M+","<+","M","<",".k",".",    
    "r","Rk","R","Fk","F",")","n","/k","èk","/","Ë","è","u","Uk","U",   
    "i","Ik","I","Q","¶","c","Ck","C","Hk","H","e","Ek","E",
    ";","¸","j","y","Yk","Y","G","o","Ok","O",
    "'k","'","\"k","\"","l","Lk","L","g", 
    "È","z", 
    "Ì","Í","Î","Ï","Ñ","Ò","Ó","Ô","Ö","Ø","Ù","Ük","Ü",
    "‚","¨","ks","©","kS","k","h","q","w","`","s","¢","S",
    "a","¡","%","W","•","·","∙","·","~j","~","\\","+"," ः",
    "^","*","Þ","ß","(","¼","½","¿","À","¾","A","-","&","&","Œ","]","~ ","@",
    "ाे","ाॅ","ंै","े्र","अौ","अो","आॅ"
  ];

  const array_two = [
    "॰","QZ+","sa","a","र्द्ध","Z","\"","\"","'","'",
    "०","१","२","३","४","५","६","७","८","९",   
    "फ़्","क़","ख़","ख़्","ग़","ज़्","ज़","ड़","ढ़","फ़","य़","ऱ","ऩ",
    "त्त","त्त्","क्त","दृ","कृ","न्न","न्न्","=k","f=",
    "ह्न","ह्य","हृ","ह्म","ह्र","ह्","द्द","क्ष","क्ष्","त्र","त्र्", 
    "छ्य","ट्य","ठ्य","ड्य","ढ्य","द्य","ज्ञ","द्व",
    "श्र","ट्र","ड्र","ढ्र","छ्र","क्र","फ्र","र्द्र","द्र","प्र","प्र","ग्र","रु","रू",
    "ऑ","ओ","औ","आ","अ","ईं","ई","ई","इ","उ","ऊ","ऐ","ए","ऋ",
    "क्क","क","क","क्","ख","ख","ख्","ग","ग","ग्","घ","घ","घ्","ङ",
    "च","च","च्","छ","ज","ज","ज्","झ","झ्","ञ",
    "ट्ट","ट्ठ","ट","ठ","ड्ड","ड्ढ","ड़","ढ़","ड","ढ","ण","ण्",   
    "त","त","त्","थ","थ्","द्ध","द","ध","ध","ध्","ध्","ध्","न","न","न्",    
    "प","प","प्","फ","फ्","ब","ब","ब्","भ","भ्","म","म","म्",  
    "य","य्","र","ल","ल","ल्","ळ","व","व","व्",   
    "श","श्","ष","ष्","स","स","स्","ह", 
    "ीं","्र",    
    "द्द","ट्ट","ट्ठ","ड्ड","कृ","भ","्य","ड्ढ","झ्","क्र","त्त्","श","श्",
    "ॉ","ो","ो","ौ","ौ","ा","ी","ु","ू","ृ","े","े","ै",
    "ं","ँ","ः","ॅ","ऽ","ऽ","ऽ","ऽ","्र","्","?","़",":",
    "‘","’","“","”",";","(",")","{","}","=","।",".","-","µ","॰",",","् ","/",
    "ो","ॉ","ैं","्रे","औ","ओ","ऑ"
  ];

  let modified_substring = text;

  // Substitute array_two elements in place of corresponding array_one elements
  if (modified_substring !== "") {
    for (let input_symbol_idx = 0; input_symbol_idx < array_one.length; input_symbol_idx++) {
      let idx = 0;
      while (idx !== -1) {
        modified_substring = modified_substring.replace(array_one[input_symbol_idx], array_two[input_symbol_idx]);
        idx = modified_substring.indexOf(array_one[input_symbol_idx]);
      }
    }
  }

  // Code for Glyph1 : ± (reph+anusvAr)
  modified_substring = modified_substring.replace(/±/g, "Zं"); 

  // Glyp2: Æ
  modified_substring = modified_substring.replace(/Æ/g, "र्f");

  let position_of_i = modified_substring.indexOf("f");
  while (position_of_i !== -1) {
    let character_next_to_i = modified_substring.charAt(position_of_i + 1);
    let character_to_be_replaced = "f" + character_next_to_i;
    modified_substring = modified_substring.replace(character_to_be_replaced, character_next_to_i + "ि");
    position_of_i = modified_substring.indexOf("f", position_of_i + 1);
  }

  // Glyph3 & Glyph4: Ç  É
  modified_substring = modified_substring.replace(/Ç/g, "fa");
  modified_substring = modified_substring.replace(/É/g, "र्fa");

  position_of_i = modified_substring.indexOf("fa");
  while (position_of_i !== -1) {
    let character_next_to_ip2 = modified_substring.charAt(position_of_i + 2);
    let character_to_be_replaced = "fa" + character_next_to_ip2;
    modified_substring = modified_substring.replace(character_to_be_replaced, character_next_to_ip2 + "िं");
    position_of_i = modified_substring.indexOf("fa", position_of_i + 2);
  }

  // Glyph5: Ê
  modified_substring = modified_substring.replace(/Ê/g, "ीZ");

  // following loop to eliminate 'chhotee ee kee maatraa' on half-letters as a result of above transformation.
  let position_of_wrong_ee = modified_substring.indexOf("ि्");
  while (position_of_wrong_ee !== -1) {
    let consonent_next_to_wrong_ee = modified_substring.charAt(position_of_wrong_ee + 2);
    let character_to_be_replaced = "ि्" + consonent_next_to_wrong_ee;
    modified_substring = modified_substring.replace(character_to_be_replaced, "्" + consonent_next_to_wrong_ee + "ि");
    position_of_wrong_ee = modified_substring.indexOf("ि्", position_of_wrong_ee + 2);
  }

  // Eliminating reph "Z" and putting 'half - r' at proper position for this.
  let set_of_matras = "अ आ इ ई उ ऊ ए ऐ ओ औ ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ";
  let position_of_R = modified_substring.indexOf("Z");

  while (position_of_R > 0) {
    let probable_position_of_half_r = position_of_R - 1;
    let character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);

    while (set_of_matras.match(character_at_probable_position_of_half_r) != null && probable_position_of_half_r > 0) {
      probable_position_of_half_r = probable_position_of_half_r - 1;
      character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);
    }

    let previous_to_position_of_half_r = probable_position_of_half_r - 1;
    let character_previous_to_position_of_half_r = modified_substring.charAt(previous_to_position_of_half_r);

    while (character_previous_to_position_of_half_r && character_previous_to_position_of_half_r.match("्") != null && probable_position_of_half_r > 0) {
      probable_position_of_half_r = previous_to_position_of_half_r - 1;
      character_at_probable_position_of_half_r = modified_substring.charAt(probable_position_of_half_r);
      previous_to_position_of_half_r = probable_position_of_half_r - 1;
      character_previous_to_position_of_half_r = modified_substring.charAt(previous_to_position_of_half_r);
    }

    let character_to_be_replaced = modified_substring.substr(probable_position_of_half_r, (position_of_R - probable_position_of_half_r));
    let new_replacement_string = "र्" + character_to_be_replaced;
    character_to_be_replaced = character_to_be_replaced + "Z";
    modified_substring = modified_substring.replace(character_to_be_replaced, new_replacement_string);
    position_of_R = modified_substring.indexOf("Z");
  }

  return modified_substring;
}

export default krutiDevToUnicode;
