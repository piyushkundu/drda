import { jsPDF } from 'jspdf';
import fs from 'fs';
import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { getEffectiveMeetingDate, isMeetingAmended, getOriginalMeetingDate, formatDisplayDate } from '../src/lib/dateResolution';

console.log('Testing PDF Engine with records count:', INITIAL_SOCIAL_AUDIT_RECORDS.length);

const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
});

const fontBase64 = fs.readFileSync('public/fonts/KrutiDev010.ttf').toString('base64');
doc.addFileToVFS('KrutiDev010.ttf', fontBase64);
doc.addFont('KrutiDev010.ttf', 'KrutiDev010', 'normal');

// Title in Kruti Dev
doc.setFont('KrutiDev010', 'normal');
doc.setFontSize(14);
doc.text("lks'ky vkfMV dys.Mj foRrh; o\"kZ 2026-27 tuin ckxir", 148, 14, { align: 'center' });

doc.setFontSize(9);
doc.text("fodkl [k.M% lHkh (ckxir ,oa cM+kSr)  |  dqy xzke iapk;rs% 88  |  çfrjks/k fnukad% 04/11/2026", 148, 20, { align: 'center' });

// Table Header Columns (Total 277mm)
const cols = [
  { header: 'Ø0 la0', width: 12 },
  { header: 'xzke iapk;r dk uke', width: 32 },
  { header: 'fodkl [k.M', width: 20 },
  { header: 'çkjEHk fnukad', width: 22 },
  { header: 'cSBd fnukad', width: 24 },
  { header: 'ch0vkj0ih0 dk uke', width: 34 },
  { header: 'Vhe lnL;ks dk uke', width: 50 },
  { header: 'i;Zos{kd vf/kdkjh', width: 35 },
  { header: ';kstuk dk uke', width: 26 },
  { header: 'fLFkfr', width: 22 }
];

let startX = 10;
let startY = 24;
const pageHeight = 210;
const bottomMargin = 16;
const lineHeight = 3.6;

function drawHeader(y: number) {
  doc.setFillColor(30, 41, 59);
  doc.rect(startX, y, 277, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('KrutiDev010', 'normal');

  let curX = startX;
  cols.forEach(c => {
    doc.text(c.header, curX + c.width / 2, y + 5.2, { align: 'center' });
    curX += c.width;
  });
  return y + 8;
}

let curY = drawHeader(startY);

// Draw records
INITIAL_SOCIAL_AUDIT_RECORDS.slice(0, 25).forEach((r, idx) => {
  const effDate = getEffectiveMeetingDate(r);
  const amended = isMeetingAmended(r);
  const origDate = getOriginalMeetingDate(r);

  const blockText = r.block === 'Baghpat' ? 'ckxir' : 'cM+kSr';
  const meetingDateText = amended && origDate
    ? `${formatDisplayDate(effDate)}\n(${formatDisplayDate(origDate)})`
    : formatDisplayDate(effDate);

  const statusText = amended ? "la'kksf/kr" : (r.status === 'completed' ? 'lEiUu' : 'çLrkfor');

  const cellValues = [
    String(idx + 1),
    r.gpNameKrutiDev || '',
    blockText,
    formatDisplayDate(r.startDate),
    meetingDateText,
    r.brpKrutiDev || '',
    r.teamMembersKrutiDev || '',
    r.supervisorOfficerKrutiDev || '',
    r.schemeKrutiDev || '',
    statusText
  ];

  // Split lines for each column
  doc.setFontSize(8.5);
  doc.setFont('KrutiDev010', 'normal');
  const colLines = cellValues.map((val, i) => doc.splitTextToSize(val, cols[i].width - 2));
  const maxLines = Math.max(...colLines.map(l => l.length), 1);
  const rowHeight = Math.max(maxLines * lineHeight + 3, 6.5);

  if (curY + rowHeight > pageHeight - bottomMargin) {
    doc.addPage();
    curY = drawHeader(12);
  }

  // Row background fill for amended rows or zebra striping
  if (amended) {
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.rect(startX, curY, 277, rowHeight, 'F');
  } else if (idx % 2 === 1) {
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(startX, curY, 277, rowHeight, 'F');
  }

  // Draw borders
  doc.setDrawColor(226, 232, 240);
  doc.rect(startX, curY, 277, rowHeight, 'S');

  let curX = startX;
  doc.setTextColor(15, 23, 42);

  cols.forEach((col, i) => {
    doc.rect(curX, curY, col.width, rowHeight, 'S');
    const lines = colLines[i];
    const textY = curY + 4;
    
    // If numeric / date column (S.No, Start Date, Meeting Date), use Helvetica for clean numbers and slashes
    if (i === 0 || i === 3 || i === 4) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
    } else {
      doc.setFont('KrutiDev010', 'normal');
      doc.setFontSize(8.5);
    }

    if ([0, 2, 3, 4, 9].includes(i)) {
      lines.forEach((line: string, lineIdx: number) => {
        doc.text(line, curX + col.width / 2, textY + lineIdx * lineHeight, { align: 'center' });
      });
    } else {
      lines.forEach((line: string, lineIdx: number) => {
        doc.text(line, curX + 1.2, textY + lineIdx * lineHeight);
      });
    }
    curX += col.width;
  });

  curY += rowHeight;
});

const totalPages = doc.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('lks\'ky vkfMV tuin ckxir & vkf/kdkfjd çfr', startX, pageHeight - 6);
  doc.text("i`\"B " + p + " @ " + totalPages, 148, pageHeight - 6, { align: 'center' });
  doc.text('fnukad% 04/11/2026', startX + 277, pageHeight - 6, { align: 'right' });
}

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('test_calendar_engine.pdf', buffer);
console.log('✅ Generated test_calendar_engine.pdf, bytes:', buffer.length, 'pages:', totalPages);
