import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { VRPMember } from '@/types/socialAudit';

export async function exportVRPRosterExcel(
  members: VRPMember[],
  filterTitle: string = 'समस्त VRP रोस्टर'
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Social Audit Baghpat Portal';
  wb.created = new Date();

  const sheet = wb.addWorksheet('VRP Roster Baghpat', {
    views: [{ showGridLines: true }]
  });

  sheet.columns = [
    { key: 'sno', width: 8 },
    { key: 'empCode', width: 18 },
    { key: 'nameHindi', width: 22 },
    { key: 'name', width: 24 },
    { key: 'mobileNo', width: 16 },
    { key: 'gender', width: 12 },
    { key: 'qualification', width: 26 },
    { key: 'assignedBlock', width: 18 },
    { key: 'assignedRole', width: 20 },
    { key: 'aadharStatus', width: 18 },
    { key: 'employeeStatus', width: 16 },
  ];

  // Header Title Row
  const titleText = `सामाजिक सम्परीक्षा संस्थान (SAU) - जनपद बागपत VRP एवं फील्ड टीम रोस्टर (${filterTitle})`;
  const titleRow = sheet.addRow([titleText]);
  sheet.mergeCells('A1:K1');
  titleRow.height = 36;
  titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // slate-800
  };

  // Subtitle info row
  const activeBaghpatCount = members.filter((m) => m.assignedBlock === 'Baghpat').length;
  const activeBarautCount = members.filter((m) => m.assignedBlock === 'Baraut').length;
  const infoRow = sheet.addRow([
    `कुल कार्मिक: ${members.length} | बागपत सक्रिय: ${activeBaghpatCount} | बड़ौत सक्रिय: ${activeBarautCount} | रिपोर्ट दिनांक: ${new Date().toLocaleDateString('hi-IN')}`
  ]);
  sheet.mergeCells('A2:K2');
  infoRow.height = 24;
  infoRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  infoRow.alignment = { vertical: 'middle', horizontal: 'center' };
  infoRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' } // slate-100
  };

  // Table Headers
  const headers = [
    'क्र०',
    'कार्मिक कोड',
    'नाम (हिन्दी)',
    'नाम (अंग्रेज़ी)',
    'मोबाइल नं०',
    'लिंग',
    'योग्यता',
    'आवंटित ब्लॉक',
    'पद / दायित्व',
    'आधार स्थिति',
    'कार्य स्थिति'
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 28;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' } // teal-700
  };

  // Border helper
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  headerRow.eachCell((cell) => {
    cell.border = thinBorder;
  });

  // Data rows
  members.forEach((m, idx) => {
    const subTeamLabel = m.assignedSubTeam ? ` - ${m.assignedSubTeam}` : '';
    const blockText = m.assignedBlock === 'Baghpat' 
      ? `बागपत (${m.assignedSubTeam || 'सक्रिय टीम'})` 
      : m.assignedBlock === 'Baraut' 
      ? `बड़ौत (${m.assignedSubTeam || 'सक्रिय टीम'})` 
      : 'रिज़र्व पूल';
    const genderText = m.gender === 'Female' ? 'महिला' : 'पुरुष';
    const aadharText = m.aadharStatus === 'Verified' ? 'सत्यापित' : 'लंबित';
    const statusText = m.employeeStatus === 'Working' ? 'कार्यरत' : 'कार्यमुक्त';

    const row = sheet.addRow([
      idx + 1,
      m.empCode,
      m.nameHindi || m.name,
      m.name,
      m.mobileNo,
      genderText,
      m.qualification,
      blockText,
      m.assignedRole || (m.assignedBlock ? `सक्रिय VRP${subTeamLabel}` : 'रिज़र्व'),
      aadharText,
      statusText
    ]);

    row.height = 22;
    row.font = { name: 'Arial', size: 10 };
    row.alignment = { vertical: 'middle' };

    // Column specific alignments
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };

    // Zebra striping
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
    }

    // Highlight active team members
    if (m.assignedBlock === 'Baghpat') {
      row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } }; // emerald-700
    } else if (m.assignedBlock === 'Baraut') {
      row.getCell(8).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF4338CA' } }; // indigo-700
    }

    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `VRP_Roster_Baghpat_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

