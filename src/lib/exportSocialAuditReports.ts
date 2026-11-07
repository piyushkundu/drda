import JSZip from 'jszip';
import { unicodeToKrutiDev } from './fontConversion/unicodeToKrutiDev';
import type { MonthlyReportData, ReportCell, ReportDocument } from './socialAuditReports';
import { displayReportDate, MONTHLY_SECTION_TITLES, monthlyFieldSource } from './socialAuditReports';
import type { MonthlyReportSection } from '@/types/socialAudit';

export const REPORT_HINDI_FONT = 'Kruti Dev 010';
const xmlEscape = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Convert Hindi only; keep English, dates, phone numbers and registration IDs intact. */
export function reportTextRuns(value: ReportCell): { text: string; font: string }[] {
  const text = String(value ?? '');
  return text.split(/([\u0900-\u097f\u200c\u200d]+(?:[ \t]+[\u0900-\u097f\u200c\u200d]+)*)/g).filter(Boolean).map(part => /[\u0900-\u097f]/.test(part) ? { text: unicodeToKrutiDev(part), font: REPORT_HINDI_FONT } : { text: part, font: 'Arial' });
}

export async function createMonthlyMprDocx(template: ArrayBuffer | Uint8Array, monthly: MonthlyReportData): Promise<Uint8Array> {
  const archive = await JSZip.loadAsync(template);
  const part = archive.file('word/document.xml');
  if (!part) throw new Error('मासिक रिपोर्ट का मूल प्रारूप उपलब्ध नहीं है।');
  const values: Record<string, string> = {};
  Object.values(monthly.fields).flat().forEach(field => { values[field.key] = field.value === null ? '' : String(field.value); });
  values.PERIOD_EN = `${monthly.period.partial ? monthly.period.cutoff.slice(8) + ' ' : ''}${monthly.period.englishMonth} ${monthly.period.year}`;
  values.MONTH_HI = unicodeToKrutiDev(`${monthly.period.monthName}${monthly.period.partial ? ` (दिनांक ${displayReportDate(monthly.period.cutoff)})` : ''}`);
  let document = (await part.async('string')).replace(/\{\{([A-Za-z_]+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`रिपोर्ट का खाना नहीं मिला: ${key}`);
    return xmlEscape(values[key]);
  });
  if (/\{\{/.test(document)) throw new Error('रिपोर्ट में अधूरे खाने हैं।');
  const paragraph = (text: string, heading = false, pageBreak = false, compact = false) => `<w:p><w:pPr>${pageBreak ? '<w:pageBreakBefore/>' : ''}${heading ? '<w:keepNext/>' : ''}<w:spacing w:after="${compact ? 20 : 100}"${compact ? ' w:line="200" w:lineRule="auto"' : ''}/></w:pPr>${reportTextRuns(text).map(run => `<w:r><w:rPr><w:rFonts w:ascii="${run.font}" w:hAnsi="${run.font}" w:cs="${run.font}"/>${heading ? '<w:b/>' : ''}<w:color w:val="000000"/><w:sz w:val="${heading ? 28 : compact ? 20 : 24}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(run.text)}</w:t></w:r>`).join('')}</w:p>`;
  let tableIndex = 0;
  const primarySections: MonthlyReportSection[] = ['pmay', 'mgnrega', 'nsap'];
  document = document.replace(/<w:tbl(?=[\s>])/g, marker => {
    const section = primarySections[tableIndex++];
    if (!section) return marker;
    const fields = section === 'nsap' ? [...monthly.fields.nsap, ...monthly.fields.nfbs] : monthly.fields[section];
    const sourceLabels: string[] = [];
    for (const origin of ['website', 'word', 'manual'] as const) {
      const selected = fields.filter(field => field.origin === origin);
      if (!selected.length) continue;
      const date = selected.map(field => field.dataThrough).filter((date): date is string => Boolean(date)).sort().at(-1);
      sourceLabels.push(`${({ website: 'वेबसाइट', word: 'पुराना Word डेटा', manual: 'मैनुअल संशोधन' })[origin]}${date && origin !== 'manual' ? ` ${displayReportDate(date)}` : ''}`);
    }
    if (section === 'nsap') sourceLabels.push(`${monthly.coverage.recorded}/${monthly.coverage.completed} पंचायत विवरण`);
    return paragraph(`${sourceLabels.join('; ') || 'स्रोत जानकारी अनुपलब्ध'}। स्रोत परिशिष्ट देखें।`, false, false, true) + marker;
  });
  let appendix = paragraph('आँकड़ों के स्रोत और डेटा पूर्णता', true, true) + paragraph(`रिपोर्ट की संदर्भ तिथि ${displayReportDate(monthly.period.cutoff)}`);
  for (const [section, fields] of Object.entries(monthly.fields) as [MonthlyReportSection, MonthlyReportData['fields']['pmay']][]) {
    appendix += paragraph(`${MONTHLY_SECTION_TITLES[section]}${monthly.sectionCompleteThrough?.[section] ? ` - डेटा पूर्णता ${displayReportDate(monthly.sectionCompleteThrough[section]!)}` : ''}`, true);
    const grouped = new Map<string, string[]>();
    for (const field of fields) {
      const source = monthlyFieldSource(field);
      grouped.set(source, [...(grouped.get(source) || []), `${field.label}: ${field.value ?? 'खाली'}`]);
    }
    for (const [source, labels] of grouped) appendix += paragraph(`${source} - ${labels.join('; ')}`);
  }
  monthly.notes.forEach(note => { appendix += paragraph(note); });
  document = document.replace(/(?=<w:sectPr[\s>])/, appendix);
  archive.file('word/document.xml', document);
  return archive.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function createReportDocx(report: ReportDocument): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, PageOrientation, AlignmentType, TableLayoutType, Footer, PageNumber } = await import('docx');
  const wide = report.tables.some(table => table.headers.length > 7);
  const runs = (value: ReportCell, bold = false, size = wide ? 24 : 26, color = '000000') => reportTextRuns(value).map(run => new TextRun({ text: run.text, font: run.font, size, bold, color }));
  const paragraph = (value: ReportCell, bold = false) => new Paragraph({ children: runs(value, bold), keepNext: bold, spacing: { after: 120 } });
  const borders = Object.fromEntries(['top', 'bottom', 'left', 'right'].map(edge => [edge, { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9' }]));
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [new Paragraph({ children: runs('कार्यालय जिला विकास अधिकारी बागपत', true, 24, '334155'), spacing: { after: 160 } }), new Paragraph({ children: runs(report.title, true, 36), spacing: { after: 140 } }), paragraph(`संदर्भ तिथि ${displayReportDate(report.cutoff)}`), paragraph(report.scope)];
  if (report.summary?.length) {
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: report.summary.map(item => new TableCell({ borders, shading: { fill: 'EFF6FF' }, margins: { top: 140, bottom: 140, left: 140, right: 140 }, children: [new Paragraph({ children: runs(item.label, false, 22, '475569') }), new Paragraph({ children: runs(item.value, true, 36, '0F172A') })] })) })] }));
    children.push(paragraph(''));
  }
  for (const table of report.tables) {
    if (report.id !== 'vrp_detail') children.push(paragraph(table.title, true));
    const weights = table.headers.map(header => header === 'क्र०' ? 0.7 : /मोबाइल/.test(header) ? 2.8 : /नाम|पंचायत|बीआरपी|कारण|टिप्पणी|विषय/.test(header) ? 2 : 1.5);
    const sum = weights.reduce((total, weight) => total + weight, 0);
    const widths = weights.map(weight => Math.floor((wide ? 15398 : 10466) * weight / sum));
    const cellOptions = (index: number) => ({ borders, width: { size: widths[index], type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 80, right: 80 } });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [
      ...(report.id === 'vrp_detail' ? [new TableRow({ tableHeader: true, children: [new TableCell({ borders, columnSpan: table.headers.length, shading: { fill: 'DBEAFE' }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: runs(table.title, true, 26, '1E3A5F'), keepNext: true })] })] })] : []),
      new TableRow({ tableHeader: true, children: table.headers.map((header, index) => new TableCell({ ...cellOptions(index), shading: { fill: '1E3A5F' }, children: [new Paragraph({ children: runs(header, true, 24, 'FFFFFF'), spacing: { after: 100 } })] })) }),
      ...(table.rows.length ? table.rows : [table.headers.map(() => null)]).map((row, rowIndex) => new TableRow({ cantSplit: report.id.startsWith('vrp'), children: row.map((value, index) => new TableCell({ ...cellOptions(index), shading: { fill: rowIndex % 2 ? 'F5F8FC' : 'FFFFFF' }, children: [paragraph(value)] })) })),
    ] }));
    children.push(paragraph(''));
  }
  report.notes.forEach(note => children.push(paragraph(note)));
  children.push(new Paragraph({ children: runs('जिला विकास अधिकारी बागपत'), alignment: AlignmentType.RIGHT, spacing: { before: 360 } }));
  const footer = report.id.startsWith('vrp') ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [...runs('सोशल ऑडिट बागपत | पृष्ठ ', false, 20, '475569'), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 20 }), ...runs(' / ', false, 20), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 20 })] })] }) } : undefined;
  const document = new Document({ creator: 'Social Audit Baghpat', title: report.title, styles: { default: { document: { run: { font: REPORT_HINDI_FONT, size: 24 } } } }, sections: [{ properties: { page: { size: { orientation: wide ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, footers: footer, children }] });
  return new Uint8Array(await Packer.toArrayBuffer(document));
}

export async function createReportExcel(report: ReportDocument): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Social Audit Baghpat';
  for (const [index, table] of report.tables.entries()) {
    const sheet = workbook.addWorksheet(`${index + 1}. ${table.title.replace(/[\\/?*:[\]]/g, '').slice(0, 26)}`);
    sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: 'frozen', ySplit: 5 }];
    const add = (values: ReportCell[], bold = false) => {
      const row = sheet.addRow([]);
      values.forEach((value, column) => {
        const cell = row.getCell(column + 1);
        if (typeof value === 'number') cell.value = value;
        else if (value !== null) {
          const runs = reportTextRuns(value);
          cell.value = runs.length === 1 && runs[0].font === 'Arial' ? String(value) : { richText: runs.map(run => ({ text: run.text, font: { name: run.font, size: 12, bold } })) };
          cell.numFmt = '@';
        }
        cell.font = { name: 'Arial', size: 11, bold };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin', color: { argb: 'FFD9D9D9' } }, bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } }, left: { style: 'thin', color: { argb: 'FFD9D9D9' } }, right: { style: 'thin', color: { argb: 'FFD9D9D9' } } };
      });
      row.height = Math.max(26, ...values.map((value, column) => Math.ceil(String(value ?? '').length / (column === 0 ? 10 : 20)) * 18));
      return row;
    };
    add(['कार्यालय जिला विकास अधिकारी बागपत'], true);
    add([report.title], true);
    add([`संदर्भ तिथि ${displayReportDate(report.cutoff)} | ${report.scope}`]);
    sheet.addRow([]);
    const header = add(table.headers, true);
    header.height = 44;
    header.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }; });
    for (const values of table.rows) add(values);
    for (const note of report.notes) {
      const row = add([note]);
      sheet.mergeCells(row.number, 1, row.number, table.headers.length);
      row.height = Math.max(32, Math.ceil(note.length / 110) * 18);
    }
    for (let row = 1; row <= 3; row++) {
      sheet.mergeCells(row, 1, row, table.headers.length);
      sheet.getRow(row).height = row === 3 ? 38 : 28;
    }
    sheet.columns.forEach((column, columnIndex) => { column.width = columnIndex === 0 ? 12 : table.headers.length > 8 ? 22 : 28; });
    sheet.pageSetup.printTitlesRow = '1:5';
    if (table.rows.length) sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + table.rows.length, column: table.headers.length } };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export function reportPrintHtml(report: ReportDocument, fontDataUrl: string): string {
  const text = (value: ReportCell) => reportTextRuns(value).map(run => `<span style="font-family:'${run.font}'">${xmlEscape(run.text)}</span>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${xmlEscape(report.title)}</title><style>@font-face{font-family:'Kruti Dev 010';src:url('${fontDataUrl}')}@page{size:A4 landscape;margin:12mm}body{font:12pt Arial;color:#000}h1,h2{font-size:16pt}table{border-collapse:collapse;width:100%;margin:12px 0 20px}th,td{border:1px solid #888;padding:5px;vertical-align:top;overflow-wrap:anywhere}th{background:#eee}thead{display:table-header-group}tr{break-inside:avoid}p{margin:6px 0}</style></head><body><h1>${text(report.title)}</h1><p>${text(`जनपद बागपत | संदर्भ तिथि ${displayReportDate(report.cutoff)}`)}</p><p>${text(report.scope)}</p>${report.tables.map(table => `<h2>${text(table.title)}</h2><table><thead><tr>${table.headers.map(header => `<th>${text(header)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map(value => `<td>${text(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('')}${report.notes.map(note => `<p>${text(note)}</p>`).join('')}<script>document.fonts.ready.then(()=>window.print())</script></body></html>`;
}

export async function printSocialAuditReport(report: ReportDocument) {
  // Open during the click gesture so browsers do not block the print window.
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('प्रिंट के लिए पॉपअप की अनुमति दें।');
  try {
    const response = await fetch('/fonts/KrutiDev010.ttf');
    if (!response.ok) throw new Error('हिंदी प्रिंट फ़ॉन्ट नहीं मिला।');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    printWindow.document.write(reportPrintHtml(report, `data:font/ttf;base64,${btoa(binary)}`));
    printWindow.document.close();
  } catch (error) {
    printWindow.close();
    throw error;
  }
}
