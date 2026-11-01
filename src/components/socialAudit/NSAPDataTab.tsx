'use client';

import React, { useMemo, useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  NSAPGramPanchayatData, 
  NSAPBeneficiaryRecord, 
  NSAPBeneficiaryCategory,
  AuditBlock
} from '@/types/socialAudit';
import { matchesBRP } from '@/lib/brpHelper';
import { filterRecordsByGlobalFilters } from '@/lib/globalFilterHelper';
import { 
  FileSpreadsheet, Users, CheckCircle2, AlertTriangle, Clock, 
  Search, Filter, Plus, Printer, Download, Sparkles, Building2, 
  ShieldCheck, ArrowRight, UserX, Skull, Home, Phone, Calendar,
  ChevronDown, ChevronUp, X, Check, Eye, Edit3, ClipboardPaste,
  FileText, Trash2, HelpCircle, Lock, Unlock
} from 'lucide-react';

export default function NSAPDataTab() {
  const { 
    records, 
    selectedBRP,
    selectedBlock,
    dateRange,
    nsapRecords, 
    asOfDate, 
    fontViewMode,
    isEditMode,
    addNsapRecord,
    updateNsapRecord,
    deleteNsapRecord,
    addNsapBeneficiary,
    addNsapBeneficiariesBatch,
    deleteNsapBeneficiary
  } = useSocialAuditStore();

  // Active section view mode: 'completed' | 'pending' | 'report' | 'beneficiaries' | 'upcoming'
  const [activeSection, setActiveSection] = useState<'completed' | 'pending' | 'report' | 'beneficiaries' | 'upcoming'>('completed');
  const [recordedViewMode, setRecordedViewMode] = useState<'cards' | 'table'>('cards');

  // Pending Box filter states
  const [pendingScope, setPendingScope] = useState<'due' | 'all'>('due');
  const [pendingBlockFilter, setPendingBlockFilter] = useState<'all' | AuditBlock>('all');

  // Recorded GPs filter states
  const [gpBlockFilter, setGpBlockFilter] = useState<'all' | AuditBlock>('all');
  const [gpSearchQuery, setGpSearchQuery] = useState('');
  const [deceasedFilter, setDeceasedFilter] = useState<'all' | 'zero' | 'has'>('all');
  const [expandedGpId, setExpandedGpId] = useState<string | null>(null);

  // Beneficiary table filter states
  const [benCategoryFilter, setBenCategoryFilter] = useState<'all' | NSAPBeneficiaryCategory>('all');
  const [benGpFilter, setBenGpFilter] = useState<string>('all');
  const [benSearchQuery, setBenSearchQuery] = useState('');

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Add GP Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGpForAdd, setSelectedGpForAdd] = useState<string>('');
  const [modalTotalBens, setModalTotalBens] = useState<number>(0);
  const [modalVerDirect, setModalVerDirect] = useState<number>(0);
  const [modalVerFamily, setModalVerFamily] = useState<number>(0);
  const [modalUnverCount, setModalUnverCount] = useState<number>(0);
  const [modalUnverReason, setModalUnverReason] = useState<string>('');
  
  // 2. Edit GP Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGpId, setEditingGpId] = useState<string>('');
  const [editingGpName, setEditingGpName] = useState<string>('');
  const [editingBlock, setEditingBlock] = useState<AuditBlock>('Baghpat');
  const [editMeetingDate, setEditMeetingDate] = useState<string>('');
  const [editTotalBens, setEditTotalBens] = useState<number>(0);
  const [editVerDirect, setEditVerDirect] = useState<number>(0);
  const [editVerFamily, setEditVerFamily] = useState<number>(0);
  const [editUnverCount, setEditUnverCount] = useState<number>(0);
  const [editUnverReason, setEditUnverReason] = useState<string>('');
  const [editFinIrreg, setEditFinIrreg] = useState<number>(0);
  const [editIrregNotes, setEditIrregNotes] = useState<string>('');
  const [editRespPersons, setEditRespPersons] = useState<string>('');

  // 3. Single Beneficiary quick add modal state
  const [isBenModalOpen, setIsBenModalOpen] = useState(false);
  const [targetGpIdForBen, setTargetGpIdForBen] = useState<string>('');
  const [newBenName, setNewBenName] = useState('');
  const [newBenRegId, setNewBenRegId] = useState('');
  const [newBenCategory, setNewBenCategory] = useState<NSAPBeneficiaryCategory>('ineligible');
  const [newBenReason, setNewBenReason] = useState('लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
  const [newBenDeathDate, setNewBenDeathDate] = useState('');

  // 4. Batch Excel Paste Modal states
  const [isExcelPasteModalOpen, setIsExcelPasteModalOpen] = useState(false);
  const [excelTargetGpId, setExcelTargetGpId] = useState<string>('');
  const [excelCategoryMode, setExcelCategoryMode] = useState<'auto' | 'deceased' | 'ineligible' | 'unverified'>('auto');
  const [excelDefaultReason, setExcelDefaultReason] = useState<string>('सत्यापित में मृतक');
  const [excelRawText, setExcelRawText] = useState<string>('');
  const [parsedBeneficiaries, setParsedBeneficiaries] = useState<Array<{
    nameUnicode: string;
    registrationId: string;
    category: NSAPBeneficiaryCategory;
    categoryHindi: string;
    reason?: string;
    deathDate?: string;
  }>>([]);

  // Helper date formatter DD/MM/YYYY
  const formatDateHi = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Helper font renderer
  const renderText = (unicodeText: string, krutiText?: string) => {
    if (fontViewMode === 'krutidev' && krutiText) {
      return <span style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>{krutiText}</span>;
    }
    if (fontViewMode === 'dual' && krutiText) {
      return (
        <span className="flex flex-col">
          <span className="text-slate-900 font-semibold">{unicodeText}</span>
          <span className="text-[11px] text-emerald-700 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
            {krutiText}
          </span>
        </span>
      );
    }
    return <span>{unicodeText}</span>;
  };

  // Baseline recorded Roster IDs (19 Gram Panchayats from Excel data)
  const baselineRecordedRosterIds = useMemo(() => new Set([
    'baghpat-1',  // अ0 शाहपुर पदडा (अहमदपुर शाहपुर पदडा)
    'baghpat-4',  // बाधू / बाघू
    'baghpat-5',  // बली
    'baghpat-8',  // बुढेड़ा / बुढेरा
    'baghpat-11', // धनाैंरा सिल्वर नगर / धनौरा सिल्वरनगर
    'baghpat-16', // फै. निनाना / फैजुल्लापुर निनाना
    'baghpat-17', // गाध़ी / गांधी
    'baghpat-19', // गौरीपुरजवाहरनगर
    'baghpat-20', // ग्वालीखेड़ा / ग्वालीखेड़ा
    'baghpat-25', // खेड़की
    'baghpat-28', // नैथला
    'baghpat-30', // निरोजपुर गूर्जर
    'baraut-7',   // बावली
    'baraut-9',   // बड़का देवीगढ़ / बड़का
    'baraut-11',  // भूड़पुर / बुढपुर
    'baraut-12',  // बिजरोल / बिजरौल
    'baraut-13',  // बिराल
    'baraut-15',  // चौबाली / चौबली
    'baraut-16'   // ढिकाना
  ]), []);

  // Global filtering (BRP + Block + Date Range) for NSAP Data
  const effectiveRecords = useMemo(() => {
    return filterRecordsByGlobalFilters(records, selectedBRP, selectedBlock, dateRange);
  }, [records, selectedBRP, selectedBlock, dateRange]);

  const assignedGpRecordIds = useMemo(() => new Set(effectiveRecords.map((r) => r.id)), [effectiveRecords]);
  const assignedGpNames = useMemo(() => new Set(effectiveRecords.map((r) => r.gpNameUnicode?.trim())), [effectiveRecords]);

  // Combined set of all recorded roster IDs (baseline + dynamically added records)
  const recordedRosterIdSet = useMemo(() => {
    const s = new Set(baselineRecordedRosterIds);
    nsapRecords.forEach(nr => {
      if (nr.rosterRecordId) {
        s.add(nr.rosterRecordId);
      }
    });
    return s;
  }, [baselineRecordedRosterIds, nsapRecords]);

  // Effective NSAP records belonging to selected BRP's assigned Gram Panchayats
  const effectiveNsapRecords = useMemo(() => {
    if (!selectedBRP || selectedBRP === 'all') return nsapRecords;
    return nsapRecords.filter((nr) => 
      (nr.rosterRecordId && assignedGpRecordIds.has(nr.rosterRecordId)) ||
      assignedGpRecordIds.has(nr.id) ||
      (nr.gpNameUnicode && assignedGpNames.has(nr.gpNameUnicode.trim()))
    );
  }, [nsapRecords, selectedBRP, assignedGpRecordIds, assignedGpNames]);

  // All NSAP Gram Panchayats from main roster assigned to selected BRP
  const allNsapRosterRecords = useMemo(() => {
    return effectiveRecords.filter(r => r.hasNSAP);
  }, [effectiveRecords]);

  // Helper to check if a roster record is recorded / completed
  const isRecordCompleted = (rosterRec: (typeof records)[0]) => {
    if (recordedRosterIdSet.has(rosterRec.id)) return true;
    return effectiveNsapRecords.some(nr => 
      nr.rosterRecordId === rosterRec.id ||
      nr.gpNameUnicode.trim() === rosterRec.gpNameUnicode.trim()
    );
  };

  // 1. Completed / Recorded NSAP GPs (filtered by BRP)
  const completedNsapRosterGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => isRecordCompleted(r));
  }, [allNsapRosterRecords, recordedRosterIdSet, effectiveNsapRecords]);

  // 2. Due Pending NSAP GPs: meetingDate <= asOfDate AND not yet recorded
  const duePendingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r) && r.meetingDate <= asOfDate;
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, asOfDate, effectiveNsapRecords]);

  // 3. Upcoming NSAP GPs: meetingDate > asOfDate AND not yet recorded
  const upcomingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r) && r.meetingDate > asOfDate;
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, asOfDate, effectiveNsapRecords]);

  // 4. All Pending NSAP GPs: not yet recorded
  const allPendingNsapGps = useMemo(() => {
    return allNsapRosterRecords.filter(r => {
      return !isRecordCompleted(r);
    }).sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  }, [allNsapRosterRecords, recordedRosterIdSet, effectiveNsapRecords]);

  // Filtered Pending GPs for the Action Box
  const filteredPendingBoxGps = useMemo(() => {
    const list = pendingScope === 'due' ? duePendingNsapGps : allPendingNsapGps;
    if (pendingBlockFilter === 'all') return list;
    return list.filter(r => r.block === pendingBlockFilter);
  }, [pendingScope, duePendingNsapGps, allPendingNsapGps, pendingBlockFilter]);

  // Filtered Upcoming GPs
  const filteredUpcomingGps = useMemo(() => {
    if (pendingBlockFilter === 'all') return upcomingNsapGps;
    return upcomingNsapGps.filter(r => r.block === pendingBlockFilter);
  }, [upcomingNsapGps, pendingBlockFilter]);

  // Aggregated Monthly Report Statistics (Points 1 to 9 from uploaded image)
  const monthlyReportStats = useMemo(() => {
    const point1_totalProposed = allNsapRosterRecords.length;
    const baghpatProposed = allNsapRosterRecords.filter(r => r.block === 'Baghpat').length;
    const barautProposed = allNsapRosterRecords.filter(r => r.block === 'Baraut').length;

    const point2_proposedUpToDate = allNsapRosterRecords.filter(r => r.meetingDate <= asOfDate).length;
    const baghpatProposedUpToDate = allNsapRosterRecords.filter(r => r.block === 'Baghpat' && r.meetingDate <= asOfDate).length;
    const barautProposedUpToDate = allNsapRosterRecords.filter(r => r.block === 'Baraut' && r.meetingDate <= asOfDate).length;

    const point3_recordedCount = effectiveNsapRecords.length;
    const baghpatRecorded = effectiveNsapRecords.filter(r => r.block === 'Baghpat').length;
    const barautRecorded = effectiveNsapRecords.filter(r => r.block === 'Baraut').length;

    let point4_totalBeneficiaries = 0;
    let point5_verifiedDirect = 0;
    let point6_verifiedFamily = 0;
    let totalVerified = 0;
    let point7_ineligible = 0;
    let point8_deceased = 0;
    let totalUnverified = 0;
    let point9_financialIrregularity = 0;

    effectiveNsapRecords.forEach(gp => {
      point4_totalBeneficiaries += (gp.totalBeneficiaries || 0);
      point5_verifiedDirect += (gp.verifiedDirect || 0);
      point6_verifiedFamily += (gp.verifiedFamily || 0);
      totalVerified += (gp.verifiedTotal || ((gp.verifiedDirect || 0) + (gp.verifiedFamily || 0)));
      point9_financialIrregularity += (gp.financialIrregularityAmount || 0);

      if (gp.beneficiaries && Array.isArray(gp.beneficiaries)) {
        point7_ineligible += gp.beneficiaries.filter(b => b.category === 'ineligible').length;
        point8_deceased += gp.beneficiaries.filter(b => b.category === 'deceased').length;
        totalUnverified += gp.beneficiaries.filter(b => b.category === 'unverified').length;
      }
    });

    return {
      point1_totalProposed,
      baghpatProposed,
      barautProposed,
      point2_proposedUpToDate,
      baghpatProposedUpToDate,
      barautProposedUpToDate,
      point3_recordedCount,
      baghpatRecorded,
      barautRecorded,
      point4_totalBeneficiaries,
      point5_verifiedDirect,
      point6_verifiedFamily,
      totalVerified,
      point7_ineligible,
      point8_deceased,
      totalUnverified,
      point9_financialIrregularity,
    };
  }, [allNsapRosterRecords, effectiveNsapRecords, asOfDate]);

  // All individual beneficiaries flat list (filtered by selected BRP's assigned GPs)
  const allBeneficiaries = useMemo(() => {
    const list: (NSAPBeneficiaryRecord & { gpNameUnicode: string; block: AuditBlock; gpId: string })[] = [];
    effectiveNsapRecords.forEach(gp => {
      if (gp.beneficiaries && Array.isArray(gp.beneficiaries)) {
        gp.beneficiaries.forEach(b => {
          list.push({
            ...b,
            gpNameUnicode: gp.gpNameUnicode,
            block: gp.block,
            gpId: gp.id
          });
        });
      }
    });
    return list;
  }, [effectiveNsapRecords]);

  // Filtered Beneficiaries List
  const filteredBeneficiaries = useMemo(() => {
    return allBeneficiaries.filter(b => {
      if (benCategoryFilter !== 'all' && b.category !== benCategoryFilter) return false;
      if (benGpFilter !== 'all' && b.gpNameUnicode !== benGpFilter) return false;
      if (benSearchQuery.trim()) {
        const q = benSearchQuery.toLowerCase();
        const nameU = (b.nameUnicode || '').toLowerCase();
        const nameK = (b.nameKrutiDev || '').toLowerCase();
        const reg = (b.registrationId || '').toLowerCase();
        const reason = (b.reason || '').toLowerCase();
        const gp = (b.gpNameUnicode || '').toLowerCase();
        if (!nameU.includes(q) && !nameK.includes(q) && !reg.includes(q) && !reason.includes(q) && !gp.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allBeneficiaries, benCategoryFilter, benGpFilter, benSearchQuery]);

  // Filtered Recorded GPs (with Deceased Zero Filter support & BRP filtering)
  const filteredRecordedGps = useMemo(() => {
    return effectiveNsapRecords.filter(gp => {
      if (gpBlockFilter !== 'all' && gp.block !== gpBlockFilter) return false;
      
      const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;
      if (deceasedFilter === 'zero' && decCount > 0) return false;
      if (deceasedFilter === 'has' && decCount === 0) return false;

      if (gpSearchQuery.trim()) {
        const q = gpSearchQuery.toLowerCase();
        const nameU = (gp.gpNameUnicode || '').toLowerCase();
        const nameK = (gp.gpNameKrutiDev || '').toLowerCase();
        if (!nameU.includes(q) && !nameK.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.sno - b.sno);
  }, [effectiveNsapRecords, gpBlockFilter, deceasedFilter, gpSearchQuery]);

  // Count of GPs with zero deceased
  const zeroDeceasedGpsCount = useMemo(() => {
    return effectiveNsapRecords.filter(gp => {
      const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;
      return decCount === 0;
    }).length;
  }, [nsapRecords]);

  // Handle open Add Record Modal for a pending GP
  const handleOpenAddForGp = (gpUnicodeName: string) => {
    setSelectedGpForAdd(gpUnicodeName);
    setModalTotalBens(100);
    setModalVerDirect(85);
    setModalVerFamily(10);
    setModalUnverCount(5);
    setModalUnverReason('घर पर ताला बंद मिला');
    setIsAddModalOpen(true);
  };

  // Submit Add GP Record
  const handleSaveGpRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      alert('त्रुटि: NSAP डेटा जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }
    if (!selectedGpForAdd) return;

    const rosterItem = allNsapRosterRecords.find(r => r.gpNameUnicode === selectedGpForAdd);
    const newRecord: NSAPGramPanchayatData = {
      id: `nsap-gp-${Date.now()}`,
      sno: nsapRecords.length + 1,
      rosterRecordId: rosterItem?.id,
      gpNameUnicode: selectedGpForAdd,
      gpNameKrutiDev: rosterItem?.gpNameKrutiDev || selectedGpForAdd,
      block: rosterItem?.block || 'Baghpat',
      meetingDate: rosterItem?.meetingDate || asOfDate,
      totalBeneficiaries: modalTotalBens,
      verifiedDirect: modalVerDirect,
      verifiedFamily: modalVerFamily,
      verifiedTotal: modalVerDirect + modalVerFamily,
      unverifiedCount: modalUnverCount,
      unverifiedReason: modalUnverReason,
      financialIrregularityAmount: 0,
      beneficiaries: [],
      recordedDate: asOfDate
    };

    addNsapRecord(newRecord);
    setIsAddModalOpen(false);
    setSelectedGpForAdd('');
    showToast(`ग्राम पंचायत ${selectedGpForAdd} का नया डेटा सफलतापूर्वक जोड़ा गया!`);
  };

  // Handle open Edit GP Modal
  const handleOpenEditForGp = (gp: NSAPGramPanchayatData) => {
    setEditingGpId(gp.id);
    setEditingGpName(gp.gpNameUnicode);
    setEditingBlock(gp.block);
    setEditMeetingDate(gp.meetingDate || asOfDate);
    setEditTotalBens(gp.totalBeneficiaries || 0);
    setEditVerDirect(gp.verifiedDirect || 0);
    setEditVerFamily(gp.verifiedFamily || 0);
    setEditUnverCount(gp.unverifiedCount || 0);
    setEditUnverReason(gp.unverifiedReason || '');
    setEditFinIrreg(gp.financialIrregularityAmount || 0);
    setEditIrregNotes(gp.irregularityNotes || '');
    setEditRespPersons(gp.responsiblePersons || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit GP Record
  const handleSaveEditGp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      alert('त्रुटि: NSAP डेटा संपादित करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }
    if (!editingGpId) return;

    const updatedTotalVer = editVerDirect + editVerFamily;

    updateNsapRecord(editingGpId, {
      meetingDate: editMeetingDate,
      totalBeneficiaries: editTotalBens,
      verifiedDirect: editVerDirect,
      verifiedFamily: editVerFamily,
      verifiedTotal: updatedTotalVer,
      unverifiedCount: editUnverCount,
      unverifiedReason: editUnverReason,
      financialIrregularityAmount: editFinIrreg,
      irregularityNotes: editIrregNotes,
      responsiblePersons: editRespPersons,
    });

    setIsEditModalOpen(false);
    showToast(`ग्राम पंचायत ${editingGpName} का डेटा सफलतापूर्वक अपडेट हो गया!`);
  };

  // Submit Add Single Beneficiary
  const handleSaveSingleBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      alert('त्रुटि: नया लाभार्थी जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }
    if (!targetGpIdForBen || !newBenName || !newBenRegId) return;

    addNsapBeneficiary(targetGpIdForBen, {
      category: newBenCategory,
      categoryHindi: newBenCategory === 'ineligible' ? 'अपात्र लाभार्थी' : newBenCategory === 'deceased' ? 'सत्यापित में मृतक' : 'सत्यापन नहीं हो सका',
      nameUnicode: newBenName,
      registrationId: newBenRegId,
      reason: newBenReason,
      deathDate: newBenDeathDate
    });

    setIsBenModalOpen(false);
    setNewBenName('');
    setNewBenRegId('');
    setNewBenReason('लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
    setNewBenDeathDate('');
    showToast(`लाभार्थी ${newBenName} सफलतापूर्वक जोड़ा गया!`);
  };

  // Open Excel Paste Modal
  const handleOpenExcelPaste = (gpId?: string) => {
    if (gpId) {
      setExcelTargetGpId(gpId);
    } else if (nsapRecords.length > 0) {
      setExcelTargetGpId(nsapRecords[0].id);
    }
    setExcelCategoryMode('auto');
    setExcelDefaultReason('सत्यापित में मृतक');
    setExcelRawText('');
    setParsedBeneficiaries([]);
    setIsExcelPasteModalOpen(true);
  };

  // Smart Parser for Excel raw clipboard paste
  const handleRawTextChange = (text: string) => {
    setExcelRawText(text);
    if (!text.trim()) {
      setParsedBeneficiaries([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const list: typeof parsedBeneficiaries = [];

    lines.forEach(line => {
      // Split by tab (Excel standard) or comma (CSV)
      let cells = line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cells.length === 1 && line.includes(',')) {
        cells = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      }

      // Skip common header rows
      const combined = cells.join(' ').toLowerCase();
      if (
        combined.includes('नाम') && combined.includes('पंजीकरण') ||
        combined.includes('beneficiary') || combined.includes('registration') ||
        (cells[0]?.toLowerCase() === 'sr' || cells[0]?.toLowerCase() === 's.no' || cells[0] === 'क्र०सं०') && cells.length > 2
      ) {
        return;
      }

      // Filter out pure serial numbers if first column is just 1, 2, 3...
      if (cells.length > 2 && /^\d{1,3}$/.test(cells[0])) {
        cells = cells.slice(1);
      }

      if (cells.length === 0) return;

      // Identify Name, Registration ID, Category, Reason
      let name = '';
      let regId = '';
      let category: NSAPBeneficiaryCategory = 'deceased';
      let categoryHindi = 'सत्यापित में मृतक';
      let reason = '';
      let deathDate = '';

      // Pattern detectors
      cells.forEach(cell => {
        if (!cell) return;

        // Check if cell looks like Registration ID (e.g., contains 6+ digits or starts with UP/SA)
        const digitsOnly = cell.replace(/\D/g, '');
        if ((digitsOnly.length >= 6 || /^UP/i.test(cell)) && !regId) {
          regId = cell;
          return;
        }

        // Check if cell is Category indicator
        const lower = cell.toLowerCase();
        if (lower.includes('मृतक') || lower.includes('मृत') || lower.includes('death') || lower.includes('deceased')) {
          category = 'deceased';
          categoryHindi = 'सत्यापित में मृतक';
          return;
        }
        if (lower.includes('अपात्र') || lower.includes('ineligible') || lower.includes('काट') || lower.includes('अपत्र')) {
          category = 'ineligible';
          categoryHindi = 'अपात्र लाभार्थी';
          return;
        }
        if (lower.includes('असत्यापित') || lower.includes('unverified') || lower.includes('ताला')) {
          category = 'unverified';
          categoryHindi = 'सत्यापन नहीं हो सका';
          return;
        }

        // Check if cell looks like a date (DD/MM/YYYY or YYYY-MM-DD)
        if (/^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}$/.test(cell) && !deathDate) {
          deathDate = cell;
          return;
        }

        // Check if cell looks like Name (letters, no large numbers)
        if (!name && /[a-zA-Z\u0900-\u097F]/.test(cell) && digitsOnly.length < 4) {
          name = cell;
          return;
        }

        // Otherwise treat as reason/notes
        if (!reason) {
          reason = cell;
        } else {
          reason += ' ' + cell;
        }
      });

      // Fallback if regId or name still empty
      if (!name && cells[0]) name = cells[0];
      if (!regId && cells[1]) regId = cells[1];

      // Apply forced category if mode is not 'auto'
      if (excelCategoryMode !== 'auto') {
        category = excelCategoryMode;
        categoryHindi = excelCategoryMode === 'deceased' 
          ? 'सत्यापित में मृतक' 
          : excelCategoryMode === 'ineligible' 
          ? 'अपात्र लाभार्थी' 
          : 'सत्यापन नहीं हो सका';
      }

      // Default reason fallback
      if (!reason) {
        reason = category === 'deceased' 
          ? 'सत्यापित में मृतक' 
          : category === 'ineligible' 
          ? 'लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं' 
          : (excelDefaultReason || 'सत्यापन नहीं हो सका');
      }

      if (name && (regId || name.length > 2)) {
        list.push({
          nameUnicode: name,
          registrationId: regId || `ID-${Date.now()}-${list.length + 1}`,
          category,
          categoryHindi,
          reason,
          deathDate: deathDate || undefined
        });
      }
    });

    setParsedBeneficiaries(list);
  };

  // Submit Batch Excel Beneficiaries Import
  const handleSaveExcelBatch = () => {
    if (!isEditMode) {
      alert('त्रुटि: बैच लाभार्थी आयात करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }
    if (!excelTargetGpId || parsedBeneficiaries.length === 0) return;

    addNsapBeneficiariesBatch(excelTargetGpId, parsedBeneficiaries);
    
    const targetGp = nsapRecords.find(r => r.id === excelTargetGpId);
    const gpName = targetGp?.gpNameUnicode || 'ग्राम पंचायत';
    
    setIsExcelPasteModalOpen(false);
    setExcelRawText('');
    setParsedBeneficiaries([]);
    showToast(`सफलतापूर्वक ${parsedBeneficiaries.length} लाभार्थी (${gpName}) में आयात किए गए!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['क्र०सं०', 'ब्लॉक', 'ग्राम पंचायत', 'लाभार्थी का नाम', 'पंजीकरण संख्या', 'श्रेणी', 'कारण / मृत्यु तिथि'];
    const rows = filteredBeneficiaries.map((b, idx) => [
      idx + 1,
      b.block === 'Baghpat' ? 'बागपत' : 'बड़ौत',
      `"${b.gpNameUnicode}"`,
      `"${b.nameUnicode}"`,
      `"${b.registrationId}"`,
      `"${b.categoryHindi}"`,
      `"${b.reason || b.deathDate || ''}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NSAP_Beneficiaries_Baghpat_${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OFFICIAL BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                वृद्धावस्था पेंशन योजना • वित्तीय वर्ष 2026-2027
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                जनपद: बागपत (बागपत एवं बड़ौत)
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              राष्ट्रीय वृद्धावस्था पेंशन सोशल ऑडिट डेटा एवं मासिक प्रगति रिपोर्ट
            </h1>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              निदेशालय द्वारा निर्धारित मासिक प्रगति प्रारूप के अनुसार लाभार्थियों का सत्यापन, अपात्रों एवं मृतकों का पंजीकरण-वार डेटा, एवं दिनांक (<strong className="text-slate-900">{formatDateHi(asOfDate)}</strong>) तक अवशेष/लंबित ग्राम पंचायतों की मॉनिटरिंग।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Excel Paste Button (Visible only in Edit Mode) */}
            {isEditMode && (
              <button
                onClick={() => handleOpenExcelPaste()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all bg-teal-600 hover:bg-teal-700 text-white transform active:scale-95 cursor-pointer"
                title="एक्सेल से सीधे कॉपी-पेस्ट करें"
              >
                <ClipboardPaste className="w-4 h-4 stroke-[2.5]" />
                <span>📋 एक्सेल से पेस्ट करें</span>
              </button>
            )}

            {/* Add Record Button (Visible only in Edit Mode) */}
            {isEditMode && (
              <button
                onClick={() => {
                  setSelectedGpForAdd('');
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95 cursor-pointer"
                title="नया NSAP डेटा जोड़ें"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>नया NSAP डेटा जोड़ें</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>प्रिंट प्रारूप</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>एक्सपोर्ट CSV</span>
            </button>
          </div>
        </div>

        {/* Top 4 Interactive KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200">
          <div 
            onClick={() => setActiveSection('completed')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-sm group select-none ${
              activeSection === 'completed' 
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/40 text-slate-900' 
                : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span>सम्पन्न (डेटा रिकॉर्डेड)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {nsapRecords.length} <span className="text-xs font-normal text-slate-500">/ 47</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              बागपत: {monthlyReportStats.baghpatRecorded} • बड़ौत: {monthlyReportStats.barautRecorded}
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('pending')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-sm group select-none ${
              activeSection === 'pending' 
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/40 text-slate-900' 
                : 'bg-white border-slate-200 hover:border-amber-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
              <span>आज तक लंबित (Due)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {duePendingNsapGps.length} <span className="text-xs font-normal text-slate-500">पंचायतें</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              दिनांक {formatDateHi(asOfDate)} तक बैठक सम्पन्न
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('upcoming')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-sm group select-none ${
              activeSection === 'upcoming' 
                ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/40 text-slate-900' 
                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
              <span>आगामी प्रस्तावित</span>
              <Clock className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {upcomingNsapGps.length} <span className="text-xs font-normal text-slate-500">पंचायतें</span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              नवम्बर एवं दिसम्बर 2026 में बैठक
            </div>
          </div>

          <div 
            onClick={() => setActiveSection('report')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 shadow-sm group select-none ${
              activeSection === 'report' 
                ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-500/40 text-slate-900' 
                : 'bg-white border-slate-200 hover:border-purple-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
              <span>कुल NSAP योजना</span>
              <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              47 <span className="text-xs font-normal text-slate-500">पंचायतें</span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium">
              बागपत: 24 • बड़ौत: 23
            </div>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
          {/* Tab 1: सम्पन्न ग्राम पंचायतें */}
          <button
            onClick={() => setActiveSection('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1. सम्पन्न ग्राम पंचायतें ({nsapRecords.length})</span>
          </button>

          {/* Tab 2: आज तक लंबित */}
          <button
            onClick={() => setActiveSection('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'pending'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>2. आज तक लंबित ({duePendingNsapGps.length})</span>
          </button>

          {/* Tab 3: मासिक प्रगति रिपोर्ट प्रारूप */}
          <button
            onClick={() => setActiveSection('report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'report'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <span>3. मासिक प्रगति रिपोर्ट (प्रारूप 1 से 9)</span>
          </button>

          {/* Tab 4: लाभार्थी सूची */}
          <button
            onClick={() => setActiveSection('beneficiaries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'beneficiaries'
                ? 'bg-purple-600 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500" />
            <span>4. अपात्र / मृतक लाभार्थी ({allBeneficiaries.length})</span>
          </button>

          {/* Tab 5: आगामी ग्राम पंचायतें */}
          <button
            onClick={() => setActiveSection('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'upcoming'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-500" />
            <span>5. आगामी ग्राम पंचायतें ({upcomingNsapGps.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: RECORDED / COMPLETED GRAM PANCHAYATS (16 GPs) */}
      {/* ========================================================================= */}
      {(activeSection === 'completed') && (
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  सम्पन्न (डेटा रिकॉर्डेड)
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  सम्पन्न ग्राम पंचायतें • पेंशन ऑडिट डेटा रिकॉर्डेड ({filteredRecordedGps.length})
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                प्रत्येक ग्राम पंचायत का डेटा एडिट करने का विकल्प, एक्सेल से सीधे मृतक/अपात्र कॉपी-पेस्ट आयात, एवं बिना मृतक वाली पंचायतों का कलर हाइलाइट उपलब्ध है।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Deceased Status Alert Quick Filter */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setDeceasedFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    deceasedFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  सभी ({nsapRecords.length})
                </button>
                <button
                  onClick={() => setDeceasedFilter('zero')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    deceasedFilter === 'zero' 
                      ? 'bg-amber-500 text-white font-black shadow-sm' 
                      : zeroDeceasedGpsCount > 0 
                      ? 'text-amber-800 bg-amber-100 border border-amber-300 font-bold' 
                      : 'text-slate-400'
                  }`}
                  title="जिन पंचायतों में कोई मृतक लाभार्थी दर्ज नहीं है"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>मृतक शून्य ({zeroDeceasedGpsCount})</span>
                </button>
                <button
                  onClick={() => setDeceasedFilter('has')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    deceasedFilter === 'has' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  मृतक दर्ज ({nsapRecords.length - zeroDeceasedGpsCount})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setRecordedViewMode('cards')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    recordedViewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  कार्ड दृश्य (Cards)
                </button>
                <button
                  onClick={() => setRecordedViewMode('table')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    recordedViewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  तालिका दृश्य (Table)
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gpSearchQuery}
                  onChange={(e) => setGpSearchQuery(e.target.value)}
                  placeholder="पंचायत सर्च करें..."
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Block Filter */}
              <select
                value={gpBlockFilter}
                onChange={(e) => setGpBlockFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">सभी ब्लॉक ({nsapRecords.length})</option>
                <option value="Baghpat">विकास खण्ड बागपत ({nsapRecords.filter(r => r.block === 'Baghpat').length})</option>
                <option value="Baraut">विकास खण्ड बड़ौत ({nsapRecords.filter(r => r.block === 'Baraut').length})</option>
              </select>
            </div>
          </div>

          {/* Cards Grid View */}
          {recordedViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredRecordedGps.map((gp, idx) => {
                const inelCount = gp.beneficiaries.filter(b => b.category === 'ineligible').length;
                const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;
                const hasDeceased = decCount > 0;

                return (
                  <div
                    key={gp.id}
                    className={`p-4 rounded-2xl transition-all space-y-3 shadow-sm group relative ${
                      !hasDeceased
                        ? 'bg-amber-50/70 border-2 border-amber-400 shadow-sm'
                        : 'bg-white border border-slate-200/90 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            SR# {idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            gp.block === 'Baghpat' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>

                          {/* Zero Deceased Alert Pill on the Card */}
                          {!hasDeceased && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              0 मृतक (अलर्ट)
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black text-slate-900 pt-1">
                          {renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit Button (Visible only in Edit Mode) */}
                        {isEditMode && (
                          <button
                            onClick={() => handleOpenEditForGp(gp)}
                            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs transition-all cursor-pointer"
                            title="इस पंचायत का डेटा एडिट करें"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        )}

                        <span className="text-[10px] font-black px-2.5 py-1 rounded-xl border text-emerald-800 bg-emerald-50 border-emerald-200 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>सम्पन्न</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>बैठक संपन्न तिथि:</span>
                      <strong className="text-slate-800 font-mono">{formatDateHi(gp.meetingDate)}</strong>
                    </div>

                    {/* 4 Stat Boxes (With Warning Amber Highlight if Deceased === 0) */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">कुल पेंशनर</div>
                        <div className="text-sm font-black text-slate-900 font-mono">{gp.totalBeneficiaries}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                        <div className="text-[10px] text-teal-700 font-medium">सत्यापित</div>
                        <div className="text-sm font-black text-teal-800 font-mono">{gp.verifiedTotal}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="text-[10px] text-amber-700 font-medium">अपात्र</div>
                        <div className="text-sm font-black text-amber-800 font-mono">{inelCount}</div>
                      </div>

                      {/* Deceased Stat Box: Glowing Warning if 0, Rose if > 0 */}
                      <div className={`p-2 rounded-xl transition-all ${
                        !hasDeceased
                          ? 'bg-amber-100 border-2 border-amber-400 text-amber-900 ring-2 ring-amber-300 animate-pulse'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        <div className={`text-[10px] font-bold flex items-center justify-center gap-0.5 ${
                          !hasDeceased ? 'text-amber-900' : 'text-rose-800'
                        }`}>
                          {!hasDeceased && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
                          <span>मृतक</span>
                        </div>
                        <div className={`text-sm font-black font-mono ${
                          !hasDeceased ? 'text-amber-900' : 'text-rose-800'
                        }`}>
                          {decCount} {!hasDeceased && '⚠️'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {/* View Beneficiaries */}
                      <button
                        onClick={() => {
                          setBenGpFilter(gp.gpNameUnicode);
                          setActiveSection('beneficiaries');
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-200 transition-all"
                        title="लाभार्थी विवरण देखें"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>विवरण ({gp.beneficiaries.length})</span>
                      </button>

                      {/* Edit Mode Action Buttons (Visible only in Edit Mode) */}
                      {isEditMode && (
                        <>
                          <button
                            onClick={() => handleOpenExcelPaste(gp.id)}
                            className="py-1.5 px-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="एक्सेल से सीधे कॉपी-पेस्ट करें"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5 text-cyan-600" />
                            <span>एक्सेल पेस्ट</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditForGp(gp)}
                            className="py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                            title="संख्या व बैठक डेटा एडिट करें"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>एडिट</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Master GP Table View (Desktop, Tablet & Mobile) */}
          {recordedViewMode === 'table' && (
            <div className="w-full space-y-2">
              <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between font-medium">
                <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
                <span className="font-mono text-slate-500">कुल {filteredRecordedGps.length} ग्राम पंचायतें</span>
              </div>
              <div className="overflow-x-auto max-h-[650px] scrollbar-thin rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center">क्र०सं०</th>
                    <th className="py-3 px-3">ब्लॉक</th>
                    <th className="py-3 px-4">ग्राम पंचायत</th>
                    <th className="py-3 px-3 text-center">बैठक तिथि</th>
                    <th className="py-3 px-3 text-center">कुल लाभार्थी</th>
                    <th className="py-3 px-3 text-center">प्रत्यक्ष सत्यापित</th>
                    <th className="py-3 px-3 text-center">परिवार से</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-700">कुल सत्यापित</th>
                    <th className="py-3 px-3 text-center font-bold text-amber-700">अपात्र</th>
                    <th className="py-3 px-3 text-center font-bold text-rose-700">मृतक</th>
                    <th className="py-3 px-3 text-center">असत्यापित</th>
                    <th className="py-3 px-4 text-center">एक्शन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecordedGps.map((gp, idx) => {
                    const inelCount = gp.beneficiaries.filter(b => b.category === 'ineligible').length;
                    const decCount = gp.beneficiaries.filter(b => b.category === 'deceased').length;
                    const unverCount = gp.beneficiaries.filter(b => b.category === 'unverified').length;
                    const hasDeceased = decCount > 0;
                    const isExpanded = expandedGpId === gp.id;

                    return (
                      <React.Fragment key={gp.id}>
                        <tr className={`hover:bg-slate-50 transition-colors ${
                          !hasDeceased ? 'bg-amber-50/60 border-l-4 border-l-amber-500' : ''
                        }`}>
                          <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              gp.block === 'Baghpat' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{renderText(gp.gpNameUnicode, gp.gpNameKrutiDev)}</span>
                              {!hasDeceased && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                  0 मृतक
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">{formatDateHi(gp.meetingDate)}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{gp.totalBeneficiaries}</td>
                          <td className="py-3 px-3 text-center font-mono text-teal-700 font-semibold">{gp.verifiedDirect || '—'}</td>
                          <td className="py-3 px-3 text-center font-mono text-indigo-700 font-semibold">{gp.verifiedFamily || '—'}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{gp.verifiedTotal}</td>
                          <td className="py-3 px-3 text-center">
                            {inelCount > 0 ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                {inelCount}
                              </span>
                            ) : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {hasDeceased ? (
                              <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                                {decCount}
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-black text-[11px] inline-flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                0 मृतक शेष
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-500">{unverCount || gp.unverifiedCount || 0}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Edit GP Button (Visible only in Edit Mode) */}
                              {isEditMode && (
                                <button
                                  onClick={() => handleOpenEditForGp(gp)}
                                  className="p-1.5 rounded-lg border bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 transition-all cursor-pointer"
                                  title="डेटा एडिट करें"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Excel Paste Button */}
                              {isEditMode && (
                                <button
                                  onClick={() => handleOpenExcelPaste(gp.id)}
                                  className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer"
                                  title="एक्सेल से सीधे कॉपी-पेस्ट करें"
                                >
                                  <ClipboardPaste className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Expand / View Beneficiaries */}
                              <button
                                onClick={() => setExpandedGpId(isExpanded ? null : gp.id)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
                                title="लाभार्थी विवरण देखें"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isExpanded ? 'छुपाएं' : `सूची (${gp.beneficiaries.length})`}</span>
                              </button>

                              {/* Add Single Beneficiary (Edit Mode ON only) */}
                              {isEditMode && (
                                <button
                                  onClick={() => {
                                    setTargetGpIdForBen(gp.id);
                                    setIsBenModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                  title="इस पंचायत में लाभार्थी जोड़ें"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Beneficiaries Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={12} className="p-4 bg-slate-50/90 border-y border-emerald-200">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                                    <span>{gp.gpNameUnicode} • कुल {gp.beneficiaries.length} दर्ज लाभार्थी (अपात्र, मृतक एवं असत्यापित)</span>
                                  </h4>
                                  {isEditMode && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleOpenExcelPaste(gp.id)}
                                        className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                                      >
                                        <ClipboardPaste className="w-3.5 h-3.5" />
                                        <span>एक्सेल से पेस्ट करें</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setTargetGpIdForBen(gp.id);
                                          setIsBenModalOpen(true);
                                        }}
                                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>लाभार्थी जोड़ें</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {gp.beneficiaries.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {gp.beneficiaries.map(b => (
                                      <div
                                        key={b.id}
                                        className={`p-3 rounded-xl border text-xs space-y-1.5 relative group/ben shadow-sm ${
                                          b.category === 'ineligible' 
                                            ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                                            : b.category === 'deceased'
                                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                            : 'bg-white border-slate-200 text-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-slate-900 text-sm">
                                            {renderText(b.nameUnicode, b.nameKrutiDev)}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              b.category === 'ineligible' ? 'bg-amber-100 text-amber-800' : b.category === 'deceased' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                              {b.categoryHindi}
                                            </span>
                                            {isEditMode && (
                                              <button
                                                onClick={() => deleteNsapBeneficiary(gp.id, b.id)}
                                                className="opacity-0 group-hover/ben:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                                                title="हटाएं"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="font-mono text-[11px] text-slate-500">
                                          पंजीकरण: <strong className="text-slate-800">{b.registrationId}</strong>
                                        </div>
                                        {b.reason && (
                                          <div className="text-[11px] text-amber-800 italic">
                                            कारण: {b.reason}
                                          </div>
                                        )}
                                        {b.deathDate && (
                                          <div className="text-[11px] text-rose-700 font-mono">
                                            मृत्यु तिथि: {formatDateHi(b.deathDate)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                                    <span>⚠️ इस ग्राम पंचायत में अभी कोई अपात्र या मृतक लाभार्थी दर्ज नहीं है। आप सीधे एक्सेल से कॉपी-पेस्ट करके जोड़ सकते हैं।</span>
                                    <button
                                      onClick={() => handleOpenExcelPaste(gp.id)}
                                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm"
                                    >
                                      एक्सेल पेस्ट करें
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DEDICATED "आज तक लंबित पुष्टि बॉक्स" (PENDING ACTION BOX) */}
      {/* ========================================================================= */}
      {activeSection === 'pending' && (
        <div className="rounded-3xl bg-white/95 border-2 border-amber-300 p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-slate-900">
                    आज तक लंबित NSAP ग्राम पंचायतें (Pending Action Box)
                  </h3>
                  <span className="text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    {filteredPendingBoxGps.length} लंबित
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {pendingScope === 'due'
                    ? `दिनांक (${formatDateHi(asOfDate)}) तक जिन ${duePendingNsapGps.length} NSAP ग्राम पंचायतों की बैठक संपन्न हो चुकी है परंतु डेटा अभी एक्सेल/पोर्टल से दर्ज होना शेष है।`
                    : 'समस्त ग्राम पंचायतें जिनका NSAP सोशल ऑडिट डेटा अभी दर्ज नहीं हुआ है।'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Scope toggle */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPendingScope('due')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    pendingScope === 'due' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  आज तक लंबित ({duePendingNsapGps.length})
                </button>
                <button
                  onClick={() => setPendingScope('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    pendingScope === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  समस्त लंबित ({allPendingNsapGps.length})
                </button>
              </div>

              {/* Block filter */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setPendingBlockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  सभी ({pendingScope === 'due' ? duePendingNsapGps.length : allPendingNsapGps.length})
                </button>
                <button
                  onClick={() => setPendingBlockFilter('Baghpat')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baghpat' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  बागपत ({pendingScope === 'due' ? duePendingNsapGps.filter(r => r.block === 'Baghpat').length : allPendingNsapGps.filter(r => r.block === 'Baghpat').length})
                </button>
                <button
                  onClick={() => setPendingBlockFilter('Baraut')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baraut' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  बड़ौत ({pendingScope === 'due' ? duePendingNsapGps.filter(r => r.block === 'Baraut').length : allPendingNsapGps.filter(r => r.block === 'Baraut').length})
                </button>
              </div>
            </div>
          </div>

          {/* Cards of Pending GPs */}
          {filteredPendingBoxGps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPendingBoxGps.map((r, idx) => {
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white border border-amber-300 hover:border-amber-400 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            SR# {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                            NSAP पेंशन
                          </span>
                        </div>
                        <div className="text-base font-black text-slate-900 pt-1">
                          {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2 py-1 rounded-xl border text-amber-800 bg-amber-50 border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>लंबित</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>बैठक संपन्न तिथि:</span>
                        <strong className="text-slate-800 font-mono">{formatDateHi(r.meetingDate)}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>BRP:</span>
                        <span className="text-slate-700">{r.brpName} ({r.brpPhone})</span>
                      </div>
                    </div>

                    {/* Action Button (Visible only in Edit Mode) */}
                    {isEditMode && (
                      <button
                        onClick={() => handleOpenAddForGp(r.gpNameUnicode)}
                        className="w-full py-2 px-3 rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95 cursor-pointer"
                        title="डेटा दर्ज करें (Record NSAP Data)"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>डेटा दर्ज करें (Record NSAP Data)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">
                शाबाश! इस फ़िल्टर में कोई भी NSAP ग्राम पंचायत लंबित नहीं है।
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                सभी लक्षित पंचायतों का डेटा सिस्टम में सुरक्षित रूप से दर्ज है।
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: OFFICIAL MONTHLY PROGRESS REPORT (IMAGE FORMAT - BINDU 1 TO 9) */}
      {/* ========================================================================= */}
      {activeSection === 'report' && (
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  प्रारूप - क
                </span>
                <h2 className="text-lg md:text-xl font-black text-slate-900">
                  राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत माह अक्टूबर तक सोशल ऑडिट की मासिक प्रगति रिपोर्ट हेतु प्रारूप
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                आधिकारिक निदेशालय प्रारूप के अनुरूप बिंदुवार सारांश (दिनांक: {formatDateHi(asOfDate)})
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 border border-slate-200 shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>रिपोर्ट प्रिंट करें</span>
            </button>
          </div>

          {/* Official 9 Points Directorate Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">क्र०</th>
                  <th className="py-3 px-6">विवरण (सूचक)</th>
                  <th className="py-3 px-4 text-center">विकास खण्ड बागपत</th>
                  <th className="py-3 px-4 text-center">विकास खण्ड बड़ौत</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-800 bg-emerald-50">जनपद बागपत (योग)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* 1. क */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(क)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    वित्तीय वर्ष 2026-27 में राष्ट्रीय वृद्धावस्था पेंशन योजनान्तर्गत कुल प्रस्तावित ग्राम पंचायतों की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{monthlyReportStats.baghpatProposed}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{monthlyReportStats.barautProposed}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-50 text-sm">
                    {monthlyReportStats.point1_totalProposed}
                  </td>
                </tr>

                {/* 2. ख */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(ख)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    माह अक्टूबर तक कुल प्रस्तावित ग्राम पंचायतों की संख्या (दिनांक {formatDateHi(asOfDate)} तक)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{monthlyReportStats.baghpatProposedUpToDate}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{monthlyReportStats.barautProposedUpToDate}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-50 text-sm">
                    {monthlyReportStats.point2_proposedUpToDate}
                  </td>
                </tr>

                {/* 3. ग */}
                <tr className="hover:bg-slate-50 bg-emerald-50/50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(ग)</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-800">
                    माह तक सम्पन्न सोशल ऑडिट ग्राम पंचायतों की संख्या (डेटा रिकॉर्डेड)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">{monthlyReportStats.baghpatRecorded}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">{monthlyReportStats.barautRecorded}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-800 bg-emerald-100 text-base">
                    {monthlyReportStats.point3_recordedCount}
                  </td>
                </tr>

                {/* 4. घ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(घ)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    ग्राम पंचायत में पेंशन लाभार्थियों की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">1,207</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">1,027</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 bg-emerald-50 text-sm">
                    {monthlyReportStats.point4_totalBeneficiaries.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 5. ङ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(ङ)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    सत्यापित पेंशन लाभार्थियों की संख्या जिनसे मुलाकात हुई (प्रत्यक्ष रूप से)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">816</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">674</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-teal-700 bg-emerald-50 text-sm">
                    {monthlyReportStats.point5_verifiedDirect.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 6. च */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(च)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    पेंशन लाभार्थी के उपलब्ध न होने पर पारिवारिक सदस्यों के माध्यम से सत्यापन की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">256</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">76</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-700 bg-emerald-50 text-sm">
                    {monthlyReportStats.point6_verifiedFamily.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 7. छ */}
                <tr className="hover:bg-slate-50 bg-amber-50/50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(छ)</td>
                  <td className="py-3.5 px-6 font-bold text-amber-800">
                    अपात्र लाभार्थियों की संख्या (विस्तृत विवरण संलग्न)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-700">50</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-700">4</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-amber-800 bg-amber-100 text-base">
                    {monthlyReportStats.point7_ineligible}
                  </td>
                </tr>

                {/* 8. ज */}
                <tr className="hover:bg-slate-50 bg-rose-50/50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(ज)</td>
                  <td className="py-3.5 px-6 font-bold text-rose-800">
                    सत्यापित लाभार्थियों में मृतक की संख्या
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700">104</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700">90</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-rose-800 bg-rose-100 text-base">
                    {monthlyReportStats.point8_deceased}
                  </td>
                </tr>

                {/* 9. झ */}
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500">(झ)</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    वित्तीय अनियमितता की धनराशि (₹)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">₹ 0.00</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">₹ 0.00</td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-50 text-sm">
                    ₹ 0.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: INELIGIBLE & DECEASED BENEFICIARIES MASTER DIRECTORY */}
      {/* ========================================================================= */}
      {activeSection === 'beneficiaries' && (
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  विस्तृत सूची
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  अपात्र एवं मृतक पेंशन लाभार्थी मास्टर सूची ({filteredBeneficiaries.length})
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                एक्सेल एवं सोशल ऑडिट निष्कर्षों के आधार पर दर्ज सभी अपात्र ({allBeneficiaries.filter(b => b.category === 'ineligible').length}) एवं मृतक ({allBeneficiaries.filter(b => b.category === 'deceased').length}) लाभार्थियों का विवरण।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Paste from Excel */}
              <button
                onClick={() => handleOpenExcelPaste()}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>एक्सेल से पेस्ट करें</span>
              </button>

              {/* Category Filter */}
              <select
                value={benCategoryFilter}
                onChange={(e) => setBenCategoryFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="all">सभी श्रेणियाँ ({allBeneficiaries.length})</option>
                <option value="ineligible">अपात्र लाभार्थी ({monthlyReportStats.point7_ineligible})</option>
                <option value="deceased">सत्यापित में मृतक ({monthlyReportStats.point8_deceased})</option>
                <option value="unverified">असत्यापित ({monthlyReportStats.totalUnverified})</option>
              </select>

              {/* GP Filter */}
              <select
                value={benGpFilter}
                onChange={(e) => setBenGpFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="all">सभी ग्राम पंचायतें</option>
                {nsapRecords.map(gp => (
                  <option key={gp.id} value={gp.gpNameUnicode}>
                    {gp.gpNameUnicode} ({gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'})
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={benSearchQuery}
                  onChange={(e) => setBenSearchQuery(e.target.value)}
                  placeholder="नाम / पंजीकरण सर्च..."
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Master Table of Beneficiaries (Desktop, Tablet & Mobile) */}
          <div className="w-full space-y-2">
            <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between font-medium">
              <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
              <span className="font-mono text-slate-500">कुल {filteredBeneficiaries.length} लाभार्थी</span>
            </div>
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">क्र०</th>
                  <th className="py-3 px-3">ब्लॉक</th>
                  <th className="py-3 px-4">ग्राम पंचायत</th>
                  <th className="py-3 px-4">लाभार्थी का नाम</th>
                  <th className="py-3 px-3 font-mono">पंजीकरण संख्या (ID)</th>
                  <th className="py-3 px-3 text-center">श्रेणी</th>
                  <th className="py-3 px-4">कारण / मृत्यु तिथि</th>
                  {isEditMode && <th className="py-3 px-3 text-center">एक्शन</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBeneficiaries.slice(0, 150).map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.block === 'Baghpat' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {b.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{b.gpNameUnicode}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 text-sm">
                      {renderText(b.nameUnicode, b.nameKrutiDev)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 font-semibold">{b.registrationId}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.category === 'ineligible' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : b.category === 'deceased'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {b.categoryHindi}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {b.reason ? (
                        <span className="italic">{b.reason}</span>
                      ) : b.deathDate ? (
                        <span className="font-mono text-rose-700">मृत्यु: {formatDateHi(b.deathDate)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    {isEditMode && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => deleteNsapBeneficiary(b.gpId, b.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {filteredBeneficiaries.length > 150 && (
            <p className="text-center text-xs text-slate-500 italic">
              नोट: प्रथम 150 रिकॉर्ड प्रदर्शित हैं। संपूर्ण सूची देखने के लिए ऊपर दिए गए "CSV" बटन से एक्सपोर्ट करें।
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: UPCOMING GRAM PANCHAYATS (24 GPs) */}
      {/* ========================================================================= */}
      {activeSection === 'upcoming' && (
        <div className="rounded-3xl bg-white/95 border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  आगामी योजना
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  आगामी प्रस्तावित NSAP सोशल ऑडिट ग्राम पंचायतें ({filteredUpcomingGps.length})
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                माह नवम्बर एवं दिसम्बर 2026 में सोशल ऑडिट रोस्टर अनुसार निर्धारित ग्राम पंचायतें।
              </p>
            </div>

            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPendingBlockFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold ${pendingBlockFilter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                सभी ({upcomingNsapGps.length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baghpat')}
                className={`px-3 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baghpat' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                बागपत ({upcomingNsapGps.filter(r => r.block === 'Baghpat').length})
              </button>
              <button
                onClick={() => setPendingBlockFilter('Baraut')}
                className={`px-3 py-1 rounded-lg font-bold ${pendingBlockFilter === 'Baraut' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                बड़ौत ({upcomingNsapGps.filter(r => r.block === 'Baraut').length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUpcomingGps.map((r, idx) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        SR# {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                      </span>
                    </div>
                    <div className="text-base font-black text-slate-900 pt-1">
                      {renderText(r.gpNameUnicode, r.gpNameKrutiDev)}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    आगामी
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>प्रस्तावित बैठक:</span>
                    <strong className="text-teal-700 font-mono">{formatDateHi(r.meetingDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BRP:</span>
                    <span className="text-slate-700">{r.brpName} ({r.brpPhone})</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddForGp(r.gpNameUnicode)}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>अग्रिम डेटा दर्ज करें</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ADD RECORD FOR PENDING GP */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>नया NSAP सोशल ऑडिट डेटा दर्ज करें</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {!isEditMode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 font-medium text-xs">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>केवल पठन मोड (Read Only):</strong> संपादन मोड बंद है। नया डेटा जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।
                </span>
              </div>
            )}

            <form onSubmit={handleSaveGpRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ग्राम पंचायत चुनें (47 NSAP में से):</label>
                <select
                  value={selectedGpForAdd}
                  onChange={(e) => setSelectedGpForAdd(e.target.value)}
                  disabled={!isEditMode}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">-- ग्राम पंचायत चुनें --</option>
                  {allNsapRosterRecords.map(r => (
                    <option key={r.id} value={r.gpNameUnicode}>
                      {r.gpNameUnicode} ({r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} - {formatDateHi(r.meetingDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">कुल पेंशन लाभार्थी:</label>
                  <input
                    type="number"
                    value={modalTotalBens}
                    onChange={(e) => setModalTotalBens(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रत्यक्ष सत्यापित:</label>
                  <input
                    type="number"
                    value={modalVerDirect}
                    onChange={(e) => setModalVerDirect(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">परिवार के माध्यम से:</label>
                  <input
                    type="number"
                    value={modalVerFamily}
                    onChange={(e) => setModalVerFamily(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">असत्यापित संख्या:</label>
                  <input
                    type="number"
                    value={modalUnverCount}
                    onChange={(e) => setModalUnverCount(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">असत्यापित का कारण:</label>
                  <input
                    type="text"
                    value={modalUnverReason}
                    onChange={(e) => setModalUnverReason(e.target.value)}
                    placeholder="उदा० घर पर ताला बंद मिला"
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isEditMode ? 'रद्द करें' : 'बंद करें'}
                </button>
                {isEditMode && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    डेटा सुरक्षित करें
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: EDIT GP DATA (FEATURE REQUEST 1) */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-base">
                {isEditMode ? (
                  <Edit3 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-500" />
                )}
                <span>
                  {isEditMode ? 'ग्राम पंचायत सोशल ऑडिट डेटा एडिट करें: ' : 'ग्राम पंचायत सोशल ऑडिट विवरण (केवल पठन): '}
                  {editingGpName}
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {!isEditMode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 font-medium text-xs">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>केवल पठन मोड (Read Only):</strong> संपादन मोड बंद है। बैठक तिथि या पेंशन डेटा में बदलाव करने के लिए कृपया पहले Header से Edit Mode ON करें।
                </span>
              </div>
            )}

            <form onSubmit={handleSaveEditGp} className="space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                  ब्लॉक: {editingBlock === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                  पंचायत: {editingGpName}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">बैठक सम्पन्न तिथि:</label>
                <input
                  type="date"
                  value={editMeetingDate}
                  onChange={(e) => setEditMeetingDate(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className={`w-full border rounded-xl p-2 text-xs font-mono ${
                    !isEditMode
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">कुल पेंशनर:</label>
                  <input
                    type="number"
                    value={editTotalBens}
                    onChange={(e) => setEditTotalBens(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs font-mono ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-teal-800 mb-1">प्रत्यक्ष सत्यापित:</label>
                  <input
                    type="number"
                    value={editVerDirect}
                    onChange={(e) => setEditVerDirect(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs font-mono ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-800 mb-1">परिवार से सत्यापित:</label>
                  <input
                    type="number"
                    value={editVerFamily}
                    onChange={(e) => setEditVerFamily(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs font-mono ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Auto calculated total verified display */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">कुल सत्यापित (प्रत्यक्ष + परिवार):</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {editVerDirect + editVerFamily}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">असत्यापित संख्या:</label>
                  <input
                    type="number"
                    value={editUnverCount}
                    onChange={(e) => setEditUnverCount(parseInt(e.target.value) || 0)}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs font-mono ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">असत्यापित का कारण:</label>
                  <input
                    type="text"
                    value={editUnverReason}
                    onChange={(e) => setEditUnverReason(e.target.value)}
                    placeholder="उदा० घर पर ताला बंद मिला"
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">वित्तीय अनियमितता धनराशि (₹):</label>
                  <input
                    type="number"
                    value={editFinIrreg}
                    onChange={(e) => setEditFinIrreg(parseFloat(e.target.value) || 0)}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs font-mono ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">उत्तरदायी व्यक्ति:</label>
                  <input
                    type="text"
                    value={editRespPersons}
                    onChange={(e) => setEditRespPersons(e.target.value)}
                    placeholder="उदा० ग्राम प्रधान / सचिव"
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className={`w-full border rounded-xl p-2 text-xs ${
                      !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">अनियमितता / ऑडिट टिप्पणी:</label>
                <textarea
                  value={editIrregNotes}
                  onChange={(e) => setEditIrregNotes(e.target.value)}
                  placeholder="अतिरिक्त विवरण या बैठक की विशेष टिप्पणी..."
                  rows={2}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className={`w-full border rounded-xl p-2 text-xs ${
                    !isEditMode ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isEditMode ? 'रद्द करें' : 'बंद करें'}
                </button>
                {isEditMode && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    डेटा अपडेट करें
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: BATCH EXCEL COPY-PASTE BENEFICIARIES (FEATURE REQUEST 2) */}
      {/* ========================================================================= */}
      {isExcelPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5 text-teal-800 font-bold text-base">
                <ClipboardPaste className="w-5 h-5 text-teal-600" />
                <span>एक्सेल से सीधे कॉपी-पेस्ट आयात करें (Batch Import)</span>
              </div>
              <button
                onClick={() => setIsExcelPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Target GP selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. किस ग्राम पंचायत में लाभार्थी जोड़ने हैं?
                </label>
                <select
                  value={excelTargetGpId}
                  onChange={(e) => setExcelTargetGpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                  required
                >
                  {nsapRecords.map(gp => (
                    <option key={gp.id} value={gp.id}>
                      {gp.gpNameUnicode} ({gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} - {gp.beneficiaries.length} लाभार्थी वर्तमान में दर्ज)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. आयात श्रेणी (Import Category):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExcelCategoryMode('auto');
                      handleRawTextChange(excelRawText);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      excelCategoryMode === 'auto'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ⚡ ऑटो-डिटेक्ट
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExcelCategoryMode('deceased');
                      handleRawTextChange(excelRawText);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      excelCategoryMode === 'deceased'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    💀 सभी को 'मृतक' बनाएं
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExcelCategoryMode('ineligible');
                      handleRawTextChange(excelRawText);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      excelCategoryMode === 'ineligible'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ⚠️ सभी को 'अपात्र' बनाएं
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExcelCategoryMode('unverified');
                      handleRawTextChange(excelRawText);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      excelCategoryMode === 'unverified'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    🔒 सभी को 'असत्यापित'
                  </button>
                </div>
              </div>

              {/* Default Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  डिफ़ॉल्ट कारण (यदि एक्सेल पंक्ति में कारण न हो):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={excelDefaultReason}
                    onChange={(e) => {
                      setExcelDefaultReason(e.target.value);
                      handleRawTextChange(excelRawText);
                    }}
                    placeholder="उदा० सत्यापित में मृतक / एक से अधिक पेंशन प्राप्त कर रहे हैं"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExcelDefaultReason('सत्यापित में मृतक');
                      handleRawTextChange(excelRawText);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-rose-700 border border-slate-200 shrink-0 font-bold"
                  >
                    मृतक कारण
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExcelDefaultReason('लाभार्थी एक से अधिक पेंशन प्राप्त कर रहे हैं');
                      handleRawTextChange(excelRawText);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-amber-700 border border-slate-200 shrink-0 font-bold"
                  >
                    अपात्र कारण
                  </button>
                </div>
              </div>

              {/* Paste Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    3. एक्सेल से कॉपी किया गया डेटा यहाँ पेस्ट करें (Ctrl + V):
                  </label>
                  <span className="text-[11px] text-teal-700 font-mono font-bold">
                    {parsedBeneficiaries.length} पंक्तियाँ डिटेक्ट हुईं
                  </span>
                </div>
                <textarea
                  value={excelRawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="यहाँ एक्सेल से सेलेक्ट करके कॉपी (Ctrl+C) करें और पेस्ट (Ctrl+V) करें...&#10;उदा०:&#10;राम सिंह	316510001	सत्यापित में मृतक&#10;सुनीता देवी	316510002	अन्य पेंशन पा रहे हैं"
                  rows={6}
                  className="w-full bg-slate-50 border-2 border-teal-300 rounded-2xl p-3 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 एक्सेल में नाम, पंजीकरण संख्या, कारण या मृत्यु तिथि वाले स्तम्भों को एक साथ सेलेक्ट करके कॉपी करें।
                </p>
              </div>

              {/* Live Preview Table */}
              {parsedBeneficiaries.length > 0 && (
                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>डेटा पूर्वावलोकन (Preview: कुल {parsedBeneficiaries.length} लाभार्थी)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelRawText('');
                        setParsedBeneficiaries([]);
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      साफ़ करें (Clear)
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-2 text-center w-8">#</th>
                          <th className="py-2 px-3">लाभार्थी का नाम</th>
                          <th className="py-2 px-3 font-mono">पंजीकरण संख्या</th>
                          <th className="py-2 px-2 text-center">श्रेणी</th>
                          <th className="py-2 px-3">कारण / तिथि</th>
                          <th className="py-2 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                        {parsedBeneficiaries.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{b.nameUnicode}</td>
                            <td className="py-1.5 px-3 font-mono text-teal-700">{b.registrationId}</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                b.category === 'deceased'
                                  ? 'bg-rose-100 text-rose-800'
                                  : b.category === 'ineligible'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {b.categoryHindi}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-600 text-[10px]">
                              {b.reason || b.deathDate || '—'}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setParsedBeneficiaries(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-slate-400 hover:text-rose-600"
                                title="हटाएं"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExcelPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isEditMode ? 'रद्द करें' : 'बंद करें'}
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    disabled={parsedBeneficiaries.length === 0}
                    onClick={handleSaveExcelBatch}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>सुरक्षित करें (कुल {parsedBeneficiaries.length} लाभार्थी आयात करें)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD BENEFICIARY TO GP */}
      {/* ========================================================================= */}
      {isBenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>लाभार्थी जोड़ें (कारण सहित)</span>
              </div>
              <button
                onClick={() => setIsBenModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleBeneficiary} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">लाभार्थी का नाम:</label>
                <input
                  type="text"
                  value={newBenName}
                  onChange={(e) => setNewBenName(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  placeholder="उदा० अनीता शर्मा"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">पंजीकरण संख्या (Registration ID):</label>
                <input
                  type="text"
                  value={newBenRegId}
                  onChange={(e) => setNewBenRegId(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  placeholder="उदा० 316510599211"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">श्रेणी:</label>
                  <select
                    value={newBenCategory}
                    onChange={(e) => setNewBenCategory(e.target.value as any)}
                    disabled={!isEditMode}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="ineligible">अपात्र लाभार्थी</option>
                    <option value="deceased">सत्यापित में मृतक</option>
                    <option value="unverified">असत्यापित / ताला बंद</option>
                  </select>
                </div>

                {newBenCategory === 'deceased' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">मृत्यु तिथि (यदि ज्ञात हो):</label>
                    <input
                      type="date"
                      value={newBenDeathDate}
                      onChange={(e) => setNewBenDeathDate(e.target.value)}
                      disabled={!isEditMode}
                      readOnly={!isEditMode}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">कारण (Reason):</label>
                <input
                  type="text"
                  value={newBenReason}
                  onChange={(e) => setNewBenReason(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  placeholder="उदा० एक से अधिक पेंशन प्राप्त कर रहे हैं / गाँव से बाहर"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isEditMode ? 'रद्द करें' : 'बंद करें'}
                </button>
                {isEditMode && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    लाभार्थी जोड़ें
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
