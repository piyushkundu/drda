// ============================================
// Government Hindi Dictionary
// ============================================
// Official administrative vocabulary used in Indian government offices

import type { GovDictionaryEntry } from '@/types';

export const govDictionary: GovDictionaryEntry[] = [
  // Administrative Terms
  { hindi: 'निस्तारण', english: 'Disposal', hinglish: 'nistaran', category: 'Administrative', usage: 'शिकायत का निस्तारण किया गया।' },
  { hindi: 'आख्या', english: 'Report/Reply', hinglish: 'aakhya', category: 'Administrative', usage: 'आख्या प्रेषित की जाती है।' },
  { hindi: 'अधोहस्ताक्षरी', english: 'Undersigned', hinglish: 'adhohastakshari', category: 'Administrative', usage: 'अधोहस्ताक्षरी द्वारा प्रमाणित किया जाता है।' },
  { hindi: 'स्थलीय जांच', english: 'Spot Inspection', hinglish: 'sthaliya janch', category: 'Investigation', usage: 'स्थलीय जांच कराई गई।' },
  { hindi: 'संतुष्ट', english: 'Satisfied', hinglish: 'santusht', category: 'Administrative', usage: 'विभाग संतुष्ट है।' },
  { hindi: 'प्रेषित', english: 'Forwarded/Sent', hinglish: 'preshit', category: 'Communication', usage: 'पत्र प्रेषित किया जाता है।' },
  { hindi: 'कार्यवाही', english: 'Action/Proceedings', hinglish: 'karyavahi', category: 'Administrative', usage: 'उचित कार्यवाही की जाए।' },
  { hindi: 'अधिशासी अधिकारी', english: 'Executive Officer', hinglish: 'adhishasi adhikari', category: 'Designation', usage: 'अधिशासी अधिकारी, नगर पालिका' },
  { hindi: 'शिकायतकर्ता', english: 'Complainant', hinglish: 'shikayatkarta', category: 'Legal', usage: 'शिकायतकर्ता की शिकायत प्राप्त हुई।' },
  { hindi: 'संलग्नक', english: 'Enclosure/Attachment', hinglish: 'sanlagnak', category: 'Document', usage: 'संलग्नक के रूप में प्रति संलग्न है।' },

  // Office Terms
  { hindi: 'कार्यालय आदेश', english: 'Office Order', hinglish: 'karyalay aadesh', category: 'Document', usage: 'कार्यालय आदेश जारी किया जाता है।' },
  { hindi: 'अवगत कराना', english: 'To Inform', hinglish: 'avgat karana', category: 'Communication', usage: 'सूचनार्थ अवगत कराया जाता है।' },
  { hindi: 'सूचनार्थ', english: 'For Information', hinglish: 'soochanaarth', category: 'Communication', usage: 'सूचनार्थ एवं आवश्यक कार्यवाही हेतु।' },
  { hindi: 'आवश्यक कार्यवाही', english: 'Necessary Action', hinglish: 'avashyak karyavahi', category: 'Administrative', usage: 'आवश्यक कार्यवाही हेतु प्रेषित।' },
  { hindi: 'अनुपालन', english: 'Compliance', hinglish: 'anupaalan', category: 'Legal', usage: 'आदेश का अनुपालन सुनिश्चित करें।' },
  { hindi: 'तत्काल', english: 'Immediate', hinglish: 'tatkal', category: 'Priority', usage: 'तत्काल कार्यवाही आवश्यक है।' },
  { hindi: 'संदर्भ', english: 'Reference', hinglish: 'sandarbh', category: 'Document', usage: 'उपरोक्त संदर्भ में' },
  { hindi: 'उपरोक्त', english: 'Above Mentioned', hinglish: 'uparokt', category: 'General', usage: 'उपरोक्त विषय पर' },
  { hindi: 'विषय', english: 'Subject', hinglish: 'vishay', category: 'Document', usage: 'विषय: शिकायत निस्तारण के संबंध में' },
  { hindi: 'संबंध में', english: 'In Relation To', hinglish: 'sambandh mein', category: 'General', usage: 'उक्त विषय के संबंध में' },

  // DRDA Related
  { hindi: 'जिला ग्रामीण विकास अभिकरण', english: 'District Rural Development Agency', hinglish: 'jila gramin vikas abhikaran', category: 'DRDA', usage: 'जिला ग्रामीण विकास अभिकरण, [जिला नाम]' },
  { hindi: 'ग्राम पंचायत', english: 'Gram Panchayat', hinglish: 'gram panchayat', category: 'Panchayat', usage: 'ग्राम पंचायत [नाम]' },
  { hindi: 'मनरेगा', english: 'MGNREGA', hinglish: 'manrega', category: 'Scheme', usage: 'मनरेगा योजना के अंतर्गत' },
  { hindi: 'प्रधानमंत्री आवास योजना', english: 'PMAY', hinglish: 'pradhanmantri aawas yojana', category: 'Scheme', usage: 'प्रधानमंत्री आवास योजना के अंतर्गत' },
  { hindi: 'सामाजिक अंकेक्षण', english: 'Social Audit', hinglish: 'samajik ankekshan', category: 'Audit', usage: 'सामाजिक अंकेक्षण में पाया गया।' },

  // Legal/Compliance
  { hindi: 'अधिनियम', english: 'Act', hinglish: 'adhiniyam', category: 'Legal', usage: 'अधिनियम के प्रावधानों के अनुसार' },
  { hindi: 'प्रावधान', english: 'Provision', hinglish: 'praavdhan', category: 'Legal', usage: 'नियमानुसार प्रावधान' },
  { hindi: 'अनुमोदन', english: 'Approval', hinglish: 'anumodan', category: 'Administrative', usage: 'अनुमोदन प्रदान किया जाता है।' },
  { hindi: 'स्वीकृति', english: 'Sanction/Approval', hinglish: 'swikriti', category: 'Administrative', usage: 'प्रशासनिक स्वीकृति प्रदान की जाती है।' },
  { hindi: 'निर्देश', english: 'Direction/Instruction', hinglish: 'nirdesh', category: 'Administrative', usage: 'निर्देशानुसार कार्यवाही करें।' },

  // Panchayat/Block
  { hindi: 'ब्लॉक विकास अधिकारी', english: 'Block Development Officer', hinglish: 'block vikas adhikari', category: 'Designation', usage: 'ब्लॉक विकास अधिकारी, [ब्लॉक नाम]' },
  { hindi: 'ग्राम प्रधान', english: 'Village Head', hinglish: 'gram pradhan', category: 'Designation', usage: 'ग्राम प्रधान [ग्राम नाम]' },
  { hindi: 'पंचायत सचिव', english: 'Panchayat Secretary', hinglish: 'panchayat sachiv', category: 'Designation', usage: 'पंचायत सचिव [ग्राम पंचायत नाम]' },
  { hindi: 'जिलाधिकारी', english: 'District Magistrate', hinglish: 'jiladhikari', category: 'Designation', usage: 'जिलाधिकारी, [जिला नाम]' },
  { hindi: 'उप जिलाधिकारी', english: 'Sub District Magistrate', hinglish: 'up jiladhikari', category: 'Designation', usage: 'उप जिलाधिकारी, [तहसील नाम]' },

  // Nagar Palika
  { hindi: 'नगर पालिका परिषद', english: 'Municipal Council', hinglish: 'nagar palika parishad', category: 'Nagar Palika', usage: 'नगर पालिका परिषद, [नगर नाम]' },
  { hindi: 'नगर निगम', english: 'Municipal Corporation', hinglish: 'nagar nigam', category: 'Nagar Palika', usage: 'नगर निगम, [शहर नाम]' },
  { hindi: 'सभापति', english: 'Chairman', hinglish: 'sabhapati', category: 'Designation', usage: 'सभापति, नगर पालिका परिषद' },

  // IGRS
  { hindi: 'एकीकृत शिकायत निवारण प्रणाली', english: 'IGRS', hinglish: 'ekikrit shikayat nivaran pranali', category: 'IGRS', usage: 'IGRS पोर्टल पर प्राप्त शिकायत' },
  { hindi: 'शिकायत संख्या', english: 'Complaint Number', hinglish: 'shikayat sankhya', category: 'IGRS', usage: 'शिकायत संख्या: [संख्या]' },
  { hindi: 'ऑनलाइन शिकायत', english: 'Online Complaint', hinglish: 'online shikayat', category: 'IGRS', usage: 'ऑनलाइन शिकायत प्राप्त हुई है।' },

  // Document Types
  { hindi: 'नोटशीट', english: 'Note Sheet', hinglish: 'notesheet', category: 'Document', usage: 'नोटशीट संलग्न है।' },
  { hindi: 'स्मरण पत्र', english: 'Reminder Letter', hinglish: 'smaran patra', category: 'Document', usage: 'प्रथम स्मरण पत्र' },
  { hindi: 'अर्धशासकीय पत्र', english: 'Demi-Official Letter', hinglish: 'ardhshasikiye patra', category: 'Document', usage: 'अर्धशासकीय पत्र प्रेषित' },
  { hindi: 'परिपत्र', english: 'Circular', hinglish: 'paripatra', category: 'Document', usage: 'परिपत्र जारी किया जाता है।' },
  { hindi: 'अधिसूचना', english: 'Notification', hinglish: 'adhisuchna', category: 'Document', usage: 'अधिसूचना प्रकाशित की जाती है।' },

  // Common Phrases
  { hindi: 'सेवा में', english: 'To', hinglish: 'seva mein', category: 'Letter', usage: 'सेवा में,' },
  { hindi: 'विषयांतर्गत', english: 'Under the Subject', hinglish: 'vishayantargat', category: 'Letter', usage: 'विषयांतर्गत निवेदन है कि' },
  { hindi: 'महोदय', english: 'Sir', hinglish: 'mahodaya', category: 'Salutation', usage: 'महोदय,' },
  { hindi: 'कृपया', english: 'Kindly', hinglish: 'kripaya', category: 'General', usage: 'कृपया अवगत करायें।' },
  { hindi: 'यथाशीघ्र', english: 'As Soon As Possible', hinglish: 'yathashighra', category: 'Priority', usage: 'यथाशीघ्र कार्यवाही करें।' },
  { hindi: 'भवदीय', english: 'Yours Faithfully', hinglish: 'bhavadiya', category: 'Closing', usage: 'भवदीय' },
  { hindi: 'प्रतिलिपि', english: 'Copy To', hinglish: 'pratilipi', category: 'Letter', usage: 'प्रतिलिपि:' },
];

// Category list for filtering
export const dictionaryCategories = [
  'Administrative', 'Communication', 'Legal', 'Document', 'Designation',
  'DRDA', 'Panchayat', 'Nagar Palika', 'IGRS', 'Scheme', 'Audit',
  'Investigation', 'Priority', 'Letter', 'Salutation', 'Closing', 'General',
];

// Quick lookup for Smart Fix
export const smartFixMap: Record<string, string> = {};
govDictionary.forEach(entry => {
  smartFixMap[entry.hinglish.toLowerCase()] = entry.hindi;
});

// Common Hinglish to Hindi administrative fixes
export const commonFixes: Record<string, string> = {
  'avgat': 'अवगत',
  'karna': 'करना',
  'karana': 'कराना',
  'krana': 'कराना',
  'janch': 'जांच',
  'karai': 'कराई',
  'gai': 'गई',
  'nestran': 'निस्तारण',
  'nistaran': 'निस्तारण',
  'aakhaya': 'आख्या',
  'aakhya': 'आख्या',
  'preshit': 'प्रेषित',
  'karyvahi': 'कार्यवाही',
  'karyavahi': 'कार्यवाही',
  'shikayat': 'शिकायत',
  'adhikari': 'अधिकारी',
  'sanlagnak': 'संलग्नक',
  'anupaalan': 'अनुपालन',
  'anumodan': 'अनुमोदन',
  'nirdesh': 'निर्देश',
  'tatkal': 'तत्काल',
  'sandarbh': 'संदर्भ',
  'vishay': 'विषय',
  'sambandh': 'संबंध',
  'adhiniyam': 'अधिनियम',
  'praavdhan': 'प्रावधान',
  'swikriti': 'स्वीकृति',
  'adhishasi': 'अधिशासी',
  'adhohastakshari': 'अधोहस्ताक्षरी',
  'sthaliya': 'स्थलीय',
  'santusht': 'संतुष्ट',
  'soochanaarth': 'सूचनार्थ',
  'avashyak': 'आवश्यक',
  'mahodaya': 'महोदय',
  'kripaya': 'कृपया',
  'bhavadiya': 'भवदीय',
  'pratilipi': 'प्रतिलिपि',
  'yathashighra': 'यथाशीघ्र',
  'paripatra': 'परिपत्र',
  'adhisuchna': 'अधिसूचना',
  'uparokt': 'उपरोक्त',
  'notesheet': 'नोटशीट',
  'jiladhikari': 'जिलाधिकारी',
  'manrega': 'मनरेगा',
  'gram': 'ग्राम',
  'panchayat': 'पंचायत',
  'pradhan': 'प्रधान',
  'sachiv': 'सचिव',
  'sabhapati': 'सभापति',
  'nagar': 'नगर',
  'palika': 'पालिका',
  'nigam': 'निगम',
  'parishad': 'परिषद',
};

export function searchDictionary(query: string): GovDictionaryEntry[] {
  const q = query.toLowerCase();
  return govDictionary.filter(entry =>
    entry.hindi.includes(query) ||
    entry.english.toLowerCase().includes(q) ||
    entry.hinglish.toLowerCase().includes(q) ||
    entry.category.toLowerCase().includes(q)
  );
}
