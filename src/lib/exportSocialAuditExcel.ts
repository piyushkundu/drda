import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { SocialAuditRecord, NSAPReportSummary } from '@/types/socialAudit';

export async function exportCalendarExcel(
  records: SocialAuditRecord[],
  fontMode: 'krutidev' | 'unicode' = 'krutidev',
  blockFilter: string = 'all'
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Social Audit Baghpat Portal';
  wb.created = new Date();

  const isKruti = fontMode === 'krutidev';
  const fontName = isKruti ? 'Kruti Dev 010' : 'Arial';

  const sheet = wb.addWorksheet(isKruti ? 'Social Audit 2026-27' : 'सोशल ऑडिट 2026-27', {
    views: [{ showGridLines: true }]
  });

  sheet.columns = [
    { key: 'sno', width: 8 },
    { key: 'gp', width: 24 },
    { key: 'start', width: 16 },
    { key: 'meeting', width: 16 },
    { key: 'supervisor', width: 34 },
    { key: 'brp', width: 28 },
    { key: 'team', width: 44 },
    { key: 'venue', width: 18 },
    { key: 'time', width: 14 },
    { key: 'scheme', width: 30 },
    { key: 'status', width: 24 }
  ];

  const titleText = isKruti
    ? 'lks\'ky vkfMV dys.Mj foRrh; o"kZ 2026&27 tuin ckxir'
    : 'सोशल ऑडिट कैलेंडर वित्तीय वर्ष 2026-27 जनपद बागपत';

  const titleRow = sheet.addRow([titleText]);
  sheet.mergeCells('A1:K1');
  titleRow.height = 36;
  titleRow.font = { name: fontName, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };

  const headers = isKruti
    ? [
        'Ø0 la0',
        'xzke iapk;r dk uke',
        'lks\'ky vkfMV çkjEHk fnukad',
        'lks\'ky vkfMV cSBd fnukad',
        'tuin Lrjh; i;Zos{kd vf/kdkjh',
        'ch0vkj0ih0 dk uke eks0 u0 lfgr',
        'lks\'ky vkfMV Vhe lnL;ks dk uke',
        'cSBd dk LFkku',
        'cSBd dk le;',
        ';kstuk dk uke',
        'fLFkfr @ la\'kks/ku'
      ]
    : [
        'क्र० सं०',
        'ग्राम पंचायत का नाम',
        'प्रारम्भ होने का दिनांक',
        'बैठक का दिनांक',
        'पर्यवेक्षक अधिकारी',
        'बी०आर०पी० (मो० नं० सहित)',
        'सोशल ऑडिट टीम सदस्य',
        'बैठक का स्थान',
        'बैठक का समय',
        'योजना का नाम',
        'स्थिति / संशोधन विवरण'
      ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 28;
  headerRow.font = { name: fontName, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  };

  const filteredRecords = blockFilter === 'all' 
    ? records 
    : records.filter((r) => r.block === blockFilter);

  let lastBlock = '';

  filteredRecords.forEach((r) => {
    if (r.block !== lastBlock) {
      lastBlock = r.block;
      const blockTitle = isKruti ? r.blockKrutiDev : r.blockHindi;
      const bRow = sheet.addRow([blockTitle]);
      sheet.mergeCells(`A${bRow.number}:K${bRow.number}`);
      bRow.height = 26;
      bRow.font = { name: fontName, size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
      bRow.alignment = { vertical: 'middle', horizontal: 'left' };
      bRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' }
      };
    }

    const gp = isKruti ? r.gpNameKrutiDev : r.gpNameUnicode;
    const supervisor = isKruti ? r.supervisorOfficerKrutiDev : r.supervisorOfficerUnicode;
    const brp = isKruti ? r.brpKrutiDev : r.brpUnicode;
    const team = isKruti ? r.teamMembersKrutiDev : r.teamMembersUnicode;
    const venue = isKruti ? r.venueKrutiDev : r.venueUnicode;
    const time = isKruti ? r.timeKrutiDev : r.timeUnicode;
    const scheme = isKruti ? r.schemeKrutiDev : r.schemeUnicode;

    let statusText = '';
    if (r.isAmended) {
      statusText = isKruti
        ? `la'kksf/kr ¼ewy fnukad% ${r.originalMeetingDate || ''}½`
        : `संशोधित (मूल दिनांक: ${r.originalMeetingDate || ''})`;
    } else if (r.status === 'completed') {
      statusText = isKruti ? 'lEiUu' : 'सम्पन्न';
    } else {
      statusText = isKruti ? 'çLrkfor' : 'प्रस्तावित';
    }

    const row = sheet.addRow([
      r.sno,
      gp,
      r.startDate,
      r.meetingDate,
      supervisor,
      brp,
      team,
      venue,
      time,
      scheme,
      statusText
    ]);

    row.height = 24;
    row.font = { name: fontName, size: 10 };
    row.alignment = { vertical: 'middle', wrapText: true };

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

    if (r.isAmended) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' }
      };
      row.getCell(4).font = { name: fontName, size: 10, bold: true, color: { argb: 'FFB45309' } };
      row.getCell(11).font = { name: fontName, size: 9, bold: true, color: { argb: 'FFB45309' } };
    }

    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = thinBorder;
    }
  });

  sheet.addRow([]);
  sheet.addRow([]);
  const sigRow = sheet.addRow([
    '',
    isKruti ? 'ftyk fodkl vf/kdkjh' : 'जिला विकास अधिकारी',
    '',
    '',
    '',
    '',
    '',
    '',
    isKruti ? 'eq[; fodkl vf/kdkjh' : 'मुख्य विकास अधिकारी',
    '',
    ''
  ]);
  sigRow.font = { name: fontName, size: 11, bold: true };
  sheet.mergeCells(`B${sigRow.number}:D${sigRow.number}`);
  sheet.mergeCells(`I${sigRow.number}:K${sigRow.number}`);

  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `Social_Audit_Calendar_Baghpat_${fontMode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

export async function exportNSAPReportExcel(
  summary: NSAPReportSummary,
  fontMode: 'krutidev' | 'unicode' = 'krutidev'
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Social Audit Baghpat Portal';
  wb.created = new Date();

  const isKruti = fontMode === 'krutidev';
  const fontName = isKruti ? 'Kruti Dev 010' : 'Arial';

  // --------------------------------------------------------------------------
  // SHEET 1: Summary Table matching official government template
  // --------------------------------------------------------------------------
  const sheet = wb.addWorksheet(isKruti ? 'NSAP Summary' : 'NSAP प्रगति सारांश', {
    views: [{ showGridLines: true }]
  });

  sheet.columns = [
    { key: 'col1', width: 6 },
    { key: 'col2', width: 12 },
    { key: 'col3', width: 22 },
    { key: 'col4', width: 22 },
    { key: 'col5', width: 28 },
    { key: 'col6', width: 28 },
    { key: 'col7', width: 28 },
    { key: 'col8', width: 28 }
  ];

  sheet.addRow([]);

  const title = isKruti
    ? 'jk"Vªh; lkekftd lgk;rk dk;ZØe ¼NSAP½ ds vUrxZr o`)koLFkk isa\'ku@ikfjokfjd ykHk ;kstuk ls lacaf/kr lks\'ky vkfMV fjiksVZ'
    : 'राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) के अन्तर्गत वृद्धावस्था पेंशन/पारिवारिक लाभ योजना से संबंधित सोशल ऑडिट रिपोर्ट';
  const r2 = sheet.addRow(['', title]);
  sheet.mergeCells('B2:H2');
  r2.height = 32;
  r2.font = { name: fontName, size: 14, bold: true };
  r2.alignment = { vertical: 'middle', horizontal: 'center' };

  const subtitle = isKruti
    ? `¼fnukad ${summary.asOfDateFormatted} rd çLrkfor@lEiUu lks\'ky vkfMV ds lkis{k½`
    : `(दिनांक ${summary.asOfDateFormatted} तक प्रस्तावित/सम्पन्न सोशल ऑडिट के सापेक्ष)`;
  const r3 = sheet.addRow(['', subtitle]);
  sheet.mergeCells('B3:H3');
  r3.height = 24;
  r3.font = { name: fontName, size: 11, italic: true };
  r3.alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.addRow([]);

  const headers = isKruti
    ? [
        '',
        'Øe\nla[;k',
        'tuin dk uke',
        'fodkl [kaM dk uke',
        'foRrh; o"kZ 2026&27 esa çLrkfor dqy\nxzke iapk;rks@lks\'ky vkfMV dh la[;k',
        `fnukad ${summary.asOfDateFormatted} rd çLrkfor dqy\nxzke iapk;rks@lks\'ky vkfMV dh la[;k`,
        `fnukad ${summary.asOfDateFormatted} rd lEiUu dqy\nxzke iapk;rks@lks\'ky vkfMV dh la[;k`,
        'la\'kksf/kr ;k fujLr xzke iapk;rks@\nlks\'ky vkfMV dh la[;k'
      ]
    : [
        '',
        'क्रम\nसंख्या',
        'जनपद का नाम',
        'विकास खंड का नाम',
        'वित्तीय वर्ष 2026-27 में प्रस्तावित कुल\nग्राम पंचायतों/सोशल ऑडिट की संख्या',
        `दिनांक ${summary.asOfDateFormatted} तक प्रस्तावित कुल\nग्राम पंचायतों/सोशल ऑडिट की संख्या`,
        `दिनांक ${summary.asOfDateFormatted} तक सम्पन्न कुल\nग्राम पंचायतों/सोशल ऑडिट की संख्या`,
        'संशोधित या निरस्त ग्राम पंचायतों/\nसोशल ऑडिट की संख्या'
      ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 54;
  headerRow.font = { name: fontName, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };

  const borderAll: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  summary.rows.forEach((row, i) => {
    const dist = isKruti ? row.districtKrutiDev : row.districtHindi;
    const block = isKruti ? row.blockKrutiDev : row.blockHindi;
    const r = sheet.addRow([
      '',
      i + 1,
      dist,
      block,
      row.totalProposedFY,
      row.proposedUpToDate,
      row.completedUpToDate,
      row.amendedOrCancelled
    ]);
    r.height = 26;
    r.font = { name: fontName, size: 10 };
    r.alignment = { vertical: 'middle', horizontal: 'center' };
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    r.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

    for (let c = 2; c <= 8; c++) {
      r.getCell(c).border = borderAll;
    }
  });

  const totalRowText = isKruti ? 'dqy ;ksx' : 'कुल योग';
  const totRow = sheet.addRow([
    '',
    totalRowText,
    totalRowText,
    totalRowText,
    summary.totals.totalProposedFY,
    summary.totals.proposedUpToDate,
    summary.totals.completedUpToDate,
    summary.totals.amendedOrCancelled
  ]);
  sheet.mergeCells(`B${totRow.number}:D${totRow.number}`);
  totRow.height = 28;
  totRow.font = { name: fontName, size: 10, bold: true };
  totRow.alignment = { vertical: 'middle', horizontal: 'center' };
  totRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }
  };
  for (let c = 2; c <= 8; c++) {
    totRow.getCell(c).border = borderAll;
  }

  // Footer notes & signatures
  sheet.addRow([]);
  sheet.addRow([]);
  const sig = sheet.addRow([
    '',
    '',
    isKruti ? 'uksMy vf/kdkjh@ch0vkj0ih0' : 'नोडल अधिकारी / बी०आर०पी०',
    '',
    '',
    '',
    isKruti ? 'ftyk fodkl vf/kdkjh' : 'जिला विकास अधिकारी',
    isKruti ? 'eq[; fodkl vf/kdkjh' : 'मुख्य विकास अधिकारी'
  ]);
  sig.font = { name: fontName, size: 10, bold: true };

  // --------------------------------------------------------------------------
  // SHEET 2: Dedicated Separate List of Amended Gram Panchayats (as requested!)
  // --------------------------------------------------------------------------
  const amendedSheet = wb.addWorksheet(isKruti ? 'Amended NSAP List' : 'संशोधित NSAP सूची', {
    views: [{ showGridLines: true }]
  });

  amendedSheet.columns = [
    { key: 'sno', width: 8 },
    { key: 'block', width: 16 },
    { key: 'gp', width: 24 },
    { key: 'origDate', width: 18 },
    { key: 'modDate', width: 18 },
    { key: 'oldBRP', width: 24 },
    { key: 'newBRP', width: 28 },
    { key: 'supervisor', width: 34 },
    { key: 'reason', width: 36 },
    { key: 'status', width: 20 }
  ];

  const amTitleText = isKruti
    ? 'la\'kksf/kr ;k fujLr xzke iapk;rks dk i`Fkd fooj.k ¼NSAP o`)koLFkk isa\'ku ;kstuk½'
    : 'संशोधित या निरस्त ग्राम पंचायतों का पृथक विवरण (NSAP वृद्धावस्था पेंशन योजना)';
  const amTitleRow = amendedSheet.addRow([amTitleText]);
  amendedSheet.mergeCells('A1:J1');
  amTitleRow.height = 32;
  amTitleRow.font = { name: fontName, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  amTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  amTitleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB45309' } // Deep amber
  };

  const amHeaders = isKruti
    ? [
        'Ø0 la0',
        'Cykd',
        'xzke iapk;r',
        'ewy cSBd fnukad',
        'la\'kksf/kr fnukad',
        'iwoZ ch0vkj0ih0',
        'uohu ch0vkj0ih0',
        'i;Zos{kd vf/kdkjh',
        'la\'kks/ku dk dkj.k',
        'orZeku fLFkfr'
      ]
    : [
        'क्र० सं०',
        'विकास खंड',
        'ग्राम पंचायत का नाम',
        'मूल बैठक दिनांक',
        'संशोधित बैठक दिनांक',
        'पूर्व बी०आर०पी०',
        'नवीन बी०आर०पी० (मो० नं०)',
        'पर्यवेक्षक अधिकारी',
        'संशोधन का कारण',
        'वर्तमान स्थिति'
      ];

  const amHeaderRow = amendedSheet.addRow(amHeaders);
  amHeaderRow.height = 28;
  amHeaderRow.font = { name: fontName, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  amHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  amHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD97706' }
  };

  const nsapAmendedRecords = summary.allAmendedNSAP || [];
  nsapAmendedRecords.forEach((gp, idx) => {
    const isCompleted = gp.meetingDate <= summary.asOfDate;
    const oldDate = gp.amendmentDetails?.originalDate || gp.originalMeetingDate || '';
    const newDate = gp.meetingDate;
    const oldBRP = isKruti ? 'gfjfd\'ku ¼8859660315½' : 'हरिकिशन (8859660315) - कार्यमुक्त';
    const newBRP = isKruti ? gp.brpKrutiDev : gp.brpUnicode;
    const reason = isKruti
      ? 'ch0vkj0ih0 dk;ZeqDr gksus ij la\'kksf/kr jksLVj'
      : 'बी०आर०पी० कार्यमुक्त होने पर नवीन रोस्टर';

    const amRow = amendedSheet.addRow([
      idx + 1,
      isKruti ? gp.blockKrutiDev : gp.blockHindi,
      isKruti ? gp.gpNameKrutiDev : gp.gpNameUnicode,
      oldDate,
      newDate,
      oldBRP,
      newBRP,
      isKruti ? gp.supervisorOfficerKrutiDev : gp.supervisorOfficerUnicode,
      reason,
      isCompleted
        ? (isKruti ? 'lEiUu' : 'सम्पन्न')
        : (isKruti ? `çLrkfor ¼${newDate}½` : `प्रस्तावित (${newDate})`)
    ]);

    amRow.height = 24;
    amRow.font = { name: fontName, size: 9 };
    amRow.alignment = { vertical: 'middle', wrapText: true };
    amRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    amRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    amRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    amRow.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };

    amRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFBEB' }
    };

    for (let c = 1; c <= 10; c++) {
      amRow.getCell(c).border = borderAll;
    }
  });

  // --------------------------------------------------------------------------
  // SHEET 3: Complete NSAP Gram Panchayat Schedule
  // --------------------------------------------------------------------------
  const detailSheet = wb.addWorksheet(isKruti ? 'All NSAP List' : 'समस्त NSAP ग्राम पंचायतें', {
    views: [{ showGridLines: true }]
  });

  detailSheet.columns = [
    { key: 'sno', width: 8 },
    { key: 'block', width: 16 },
    { key: 'gp', width: 24 },
    { key: 'date', width: 16 },
    { key: 'brp', width: 26 },
    { key: 'supervisor', width: 32 },
    { key: 'amended', width: 16 },
    { key: 'status', width: 18 }
  ];

  const detailHeader = detailSheet.addRow(
    isKruti
      ? ['Ø0 la0', 'Cykd', 'xzke iapk;r', 'cSBd fnukad', 'ch0vkj0ih0', 'i;Zos{kd vf/kdkjh', 'la\'kksf/kr\?', 'fLFkfr']
      : ['क्र० सं०', 'विकास खंड', 'ग्राम पंचायत', 'बैठक दिनांक', 'बी०आर०पी०', 'पर्यवेक्षक अधिकारी', 'संशोधित?', 'स्थिति']
  );
  detailHeader.height = 28;
  detailHeader.font = { name: fontName, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  detailHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };

  let counter = 1;
  summary.rows.forEach((blockRow) => {
    blockRow.gramPanchayatsList.forEach((gp) => {
      const isCompl = gp.meetingDate <= summary.asOfDate;
      const dRow = detailSheet.addRow([
        counter++,
        isKruti ? gp.blockKrutiDev : gp.blockHindi,
        isKruti ? gp.gpNameKrutiDev : gp.gpNameUnicode,
        gp.meetingDate,
        isKruti ? gp.brpKrutiDev : gp.brpUnicode,
        isKruti ? gp.supervisorOfficerKrutiDev : gp.supervisorOfficerUnicode,
        gp.isAmended ? (isKruti ? 'gk¡' : 'हाँ (संशोधित)') : (isKruti ? 'ugha' : 'नहीं'),
        isCompl ? (isKruti ? 'lEiUu' : 'सम्पन्न') : (isKruti ? 'çLrkfor' : 'प्रस्तावित')
      ]);
      dRow.height = 20;
      dRow.font = { name: fontName, size: 9 };
      for (let c = 1; c <= 8; c++) {
        dRow.getCell(c).border = borderAll;
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `NSAP_Social_Audit_Report_Baghpat_${summary.asOfDate}_${fontMode}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}
