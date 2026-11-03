// ============================================================================
// NSAP Official Social Audit Excel Workbook - Official 24-Column Template
// जनपद बागपत - राष्ट्रीय वृद्धावस्था पेंशन योजना (NSAP) सोशल ऑडिट
// Supports Kruti Dev 010 (Official Govt Standard) & Unicode / Mangal
// ============================================================================

export interface NSAPColumnDef {
  colIndex: number; // 0-23
  colNumber: number; // 1-24
  headerKrutiDev: string;
  headerUnicode: string;
  subHeaderKrutiDev?: string;
  subHeaderUnicode?: string;
  width: number; // pixels
  align: 0 | 1 | 2; // 0: Center, 1: Left, 2: Right (FortuneSheet ht)
  isRegistrationId?: boolean;
  bgGroupColor?: string;
}

export const NSAP_COLUMN_DEFS: NSAPColumnDef[] = [
  // 1. S.No
  {
    colIndex: 0,
    colNumber: 1,
    headerKrutiDev: 'Ø0la0',
    headerUnicode: 'क्र०सं०',
    width: 60,
    align: 0,
    bgGroupColor: '#e2efda' // Light green
  },
  // 2. Gram Panchayat Name
  {
    colIndex: 1,
    colNumber: 2,
    headerKrutiDev: 'xzke iapk;r dk uke ',
    headerUnicode: 'ग्राम पंचायत का नाम',
    width: 130,
    align: 1,
    bgGroupColor: '#e2efda'
  },
  // 3. Total Beneficiaries
  {
    colIndex: 2,
    colNumber: 3,
    headerKrutiDev: 'dqy ykHkkfFkZ;ksa dh la[;k ',
    headerUnicode: 'कुल लाभार्थियों की संख्या',
    width: 95,
    align: 0,
    bgGroupColor: '#e2efda'
  },
  // 4-7. Verified Beneficiaries (सत्यापित लाभार्थी)
  {
    colIndex: 3,
    colNumber: 4,
    headerKrutiDev: 'lR;kfir ykHkkFkhZ',
    headerUnicode: 'सत्यापित लाभार्थी',
    subHeaderKrutiDev: 'ÁR;{k :i ls lR;kiu dh la[;k',
    subHeaderUnicode: 'प्रत्यक्ष रूप से सत्यापन की संख्या',
    width: 105,
    align: 0,
    bgGroupColor: '#d9ead3'
  },
  {
    colIndex: 4,
    colNumber: 5,
    headerKrutiDev: 'lR;kfir ykHkkFkhZ',
    headerUnicode: 'सत्यापित लाभार्थी',
    subHeaderKrutiDev: 'ifjokj ds ek/;e ls lR;kfir ykHkkFkhZ dh la[;k',
    subHeaderUnicode: 'परिवार के माध्यम से सत्यापित संख्या',
    width: 120,
    align: 0,
    bgGroupColor: '#d9ead3'
  },
  {
    colIndex: 5,
    colNumber: 6,
    headerKrutiDev: 'lR;kfir ykHkkFkhZ',
    headerUnicode: 'सत्यापित लाभार्थी',
    subHeaderKrutiDev: 'dqy la[;k',
    subHeaderUnicode: 'कुल संख्या',
    width: 80,
    align: 0,
    bgGroupColor: '#d9ead3'
  },
  {
    colIndex: 6,
    colNumber: 7,
    headerKrutiDev: 'lR;kfir ykHkkFkhZ',
    headerUnicode: 'सत्यापित लाभार्थी',
    subHeaderKrutiDev: 'ykHkkFkhZ ls lEidZ u gksus ds dkj.k',
    subHeaderUnicode: 'लाभार्थी से सम्पर्क न होने के कारण',
    width: 140,
    align: 1,
    bgGroupColor: '#d9ead3'
  },
  // 8-10. Unverified (सत्यापन नहीं किया जा सका)
  {
    colIndex: 7,
    colNumber: 8,
    headerKrutiDev: 'ykHkkFkhZ ftudk lR;kiu ugha fd;k tk ldk',
    headerUnicode: 'लाभार्थी जिनका सत्यापन नहीं किया जा सका',
    subHeaderKrutiDev: 'la[;k',
    subHeaderUnicode: 'संख्या',
    width: 60,
    align: 0,
    bgGroupColor: '#fff2cc' // Light yellow
  },
  {
    colIndex: 8,
    colNumber: 9,
    headerKrutiDev: 'ykHkkFkhZ ftudk lR;kiu ugha fd;k tk ldk',
    headerUnicode: 'लाभार्थी जिनका सत्यापन नहीं किया जा सका',
    subHeaderKrutiDev: 'ykHkkFkhZ  dk uke',
    subHeaderUnicode: 'लाभार्थी का नाम',
    width: 120,
    align: 1,
    bgGroupColor: '#fff2cc'
  },
  {
    colIndex: 9,
    colNumber: 10,
    headerKrutiDev: 'ykHkkFkhZ ftudk lR;kiu ugha fd;k tk ldk',
    headerUnicode: 'लाभार्थी जिनका सत्यापन नहीं किया जा सका',
    subHeaderKrutiDev: 'iathdj.k la[;k',
    subHeaderUnicode: 'पंजीकरण संख्या',
    width: 140,
    align: 0,
    isRegistrationId: true,
    bgGroupColor: '#fff2cc'
  },
  // 11-13. Benefit Not Received (लाभ प्राप्त नहीं हुआ)
  {
    colIndex: 10,
    colNumber: 11,
    headerKrutiDev: 'ykHkkFkhZ ftudks ykHk izkIr ugha gqvk',
    headerUnicode: 'लाभार्थी जिनको लाभ प्राप्त नहीं हुआ',
    subHeaderKrutiDev: 'la[;k',
    subHeaderUnicode: 'संख्या',
    width: 60,
    align: 0,
    bgGroupColor: '#fce4d6' // Soft peach
  },
  {
    colIndex: 11,
    colNumber: 12,
    headerKrutiDev: 'ykHkkFkhZ ftudks ykHk izkIr ugha gqvk',
    headerUnicode: 'लाभार्थी जिनको लाभ प्राप्त नहीं हुआ',
    subHeaderKrutiDev: 'ykHkkFkhZ  dk uke',
    subHeaderUnicode: 'लाभार्थी का नाम',
    width: 120,
    align: 1,
    bgGroupColor: '#fce4d6'
  },
  {
    colIndex: 12,
    colNumber: 13,
    headerKrutiDev: 'ykHkkFkhZ ftudks ykHk izkIr ugha gqvk',
    headerUnicode: 'लाभार्थी जिनको लाभ प्राप्त नहीं हुआ',
    subHeaderKrutiDev: 'iathdj.k la[;k',
    subHeaderUnicode: 'पंजीकरण संख्या',
    width: 140,
    align: 0,
    isRegistrationId: true,
    bgGroupColor: '#fce4d6'
  },
  // 14-17. Ineligible Beneficiaries (अपात्र लाभार्थी)
  {
    colIndex: 13,
    colNumber: 14,
    headerKrutiDev: 'vik= ykHkkFkhZ ',
    headerUnicode: 'अपात्र लाभार्थी',
    subHeaderKrutiDev: 'la[;k',
    subHeaderUnicode: 'संख्या',
    width: 60,
    align: 0,
    bgGroupColor: '#f8cbad' // Soft orange
  },
  {
    colIndex: 14,
    colNumber: 15,
    headerKrutiDev: 'vik= ykHkkFkhZ ',
    headerUnicode: 'अपात्र लाभार्थी',
    subHeaderKrutiDev: 'ykHkkFkhZ  dk uke',
    subHeaderUnicode: 'लाभार्थी का नाम',
    width: 130,
    align: 1,
    bgGroupColor: '#f8cbad'
  },
  {
    colIndex: 15,
    colNumber: 16,
    headerKrutiDev: 'vik= ykHkkFkhZ ',
    headerUnicode: 'अपात्र लाभार्थी',
    subHeaderKrutiDev: 'iathdj.k la[;k',
    subHeaderUnicode: 'पंजीकरण संख्या',
    width: 150,
    align: 0,
    isRegistrationId: true,
    bgGroupColor: '#f8cbad'
  },
  {
    colIndex: 16,
    colNumber: 17,
    headerKrutiDev: 'vik= ykHkkFkhZ ',
    headerUnicode: 'अपात्र लाभार्थी',
    subHeaderKrutiDev: 'vik= gksus dk dkj.k',
    subHeaderUnicode: 'अपात्र होने का कारण',
    width: 240,
    align: 1,
    bgGroupColor: '#f8cbad'
  },
  // 18-21. Deceased Beneficiaries (मृतक लाभार्थी)
  {
    colIndex: 17,
    colNumber: 18,
    headerKrutiDev: 'e`rd ykHkkFkhZ',
    headerUnicode: 'मृतक लाभार्थी',
    subHeaderKrutiDev: 'la[;k',
    subHeaderUnicode: 'संख्या',
    width: 55,
    align: 0,
    bgGroupColor: '#ea9999' // Light coral
  },
  {
    colIndex: 18,
    colNumber: 19,
    headerKrutiDev: 'e`rd ykHkkFkhZ',
    headerUnicode: 'मृतक लाभार्थी',
    subHeaderKrutiDev: 'ykHkkFkhZ  dk uke',
    subHeaderUnicode: 'लाभार्थी का नाम',
    width: 130,
    align: 1,
    bgGroupColor: '#ea9999'
  },
  {
    colIndex: 19,
    colNumber: 20,
    headerKrutiDev: 'e`rd ykHkkFkhZ',
    headerUnicode: 'मृतक लाभार्थी',
    subHeaderKrutiDev: 'iathdj.k la[;k',
    subHeaderUnicode: 'पंजीकरण संख्या',
    width: 150,
    align: 0,
    isRegistrationId: true,
    bgGroupColor: '#ea9999'
  },
  {
    colIndex: 20,
    colNumber: 21,
    headerKrutiDev: 'e`rd ykHkkFkhZ',
    headerUnicode: 'मृतक लाभार्थी',
    subHeaderKrutiDev: 'e`R;q dh frfFk',
    subHeaderUnicode: 'मृत्यु की तिथि',
    width: 110,
    align: 0,
    bgGroupColor: '#ea9999'
  },
  // 22. Financial Irregularity
  {
    colIndex: 21,
    colNumber: 22,
    headerKrutiDev: 'ik;h x;h foRrh; vfuferrk ¼;fn dksbZ gks½ dk fooj.k',
    headerUnicode: 'पायी गयी वित्तीय अनियमितता (यदि कोई हो) का विवरण',
    width: 170,
    align: 1,
    bgGroupColor: '#d9e1f2' // Soft blue
  },
  // 23. Responsible Person
  {
    colIndex: 22,
    colNumber: 23,
    headerKrutiDev: 'vfu;ferrk ds nks"kh O;fDr;ksa ds uke@inuke',
    headerUnicode: 'अनियमितता के दोषी व्यक्तियों के नाम/पदनाम',
    width: 170,
    align: 1,
    bgGroupColor: '#d9e1f2'
  },
  // 24. Other remarks
  {
    colIndex: 23,
    colNumber: 24,
    headerKrutiDev: 'vU; fooj.k',
    headerUnicode: 'अन्य विवरण',
    width: 130,
    align: 1,
    bgGroupColor: '#d9e1f2'
  }
];

/**
 * Standard Header Merges (FortuneSheet 0-based coordinates)
 * Row 0: Empty spacer (r=0)
 * Row 1: Title Header across A2:X2 (r=1, c=0, rs=1, cs=24)
 * Row 2 & 3: Main & Sub-Headers (r=2, r=3)
 * Row 4: Column Numbering 1..24 (r=4)
 * Row 5: First data row (r=5)
 */
export const STANDARD_HEADER_MERGES: Record<string, { r: number; c: number; rs: number; cs: number }> = {
  // Title across all 24 columns: A2:X2
  '1_0': { r: 1, c: 0, rs: 1, cs: 24 },

  // Columns with 2-row merged headers (A3:A4, B3:B4, C3:C4)
  '2_0': { r: 2, c: 0, rs: 2, cs: 1 }, // S.No
  '2_1': { r: 2, c: 1, rs: 2, cs: 1 }, // GP Name
  '2_2': { r: 2, c: 2, rs: 2, cs: 1 }, // Total Beneficiaries

  // Multi-column grouped headers (Row 2 spans cols, Row 3 has sub-headers)
  '2_3': { r: 2, c: 3, rs: 1, cs: 4 }, // D3:G3 (सत्यापित लाभार्थी)
  '2_7': { r: 2, c: 7, rs: 1, cs: 3 }, // H3:J3 (असत्यापित लाभार्थी)
  '2_10': { r: 2, c: 10, rs: 1, cs: 3 }, // K3:M3 (लाभ प्राप्त नहीं हुआ)
  '2_13': { r: 2, c: 13, rs: 1, cs: 4 }, // N3:Q3 (अपात्र लाभार्थी)
  '2_17': { r: 2, c: 17, rs: 1, cs: 4 }, // R3:U3 (मृतक लाभार्थी)

  // Trailing single columns spanning 2 rows (V3:V4, W3:W4, X3:X4)
  '2_21': { r: 2, c: 21, rs: 2, cs: 1 }, // Financial Irregularity
  '2_22': { r: 2, c: 22, rs: 2, cs: 1 }, // Responsible Person
  '2_23': { r: 2, c: 23, rs: 2, cs: 1 }  // Remarks
};

export const STANDARD_ROW_HEIGHTS: Record<string, number> = {
  '0': 20,
  '1': 60,  // Title
  '2': 50,  // Header Row 1
  '3': 60,  // Header Row 2
  '4': 24   // Column Numbers
};

export const DEFAULT_FONT_NAME = 'Kruti Dev 010';
export const DEFAULT_FONT_SIZE = 10;
