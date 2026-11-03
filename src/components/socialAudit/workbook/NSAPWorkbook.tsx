'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Workbook, WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { 
  FileSpreadsheet, Download, Upload, Printer, Save, 
  Search, ChevronLeft, ChevronRight, Filter, Lock, Unlock,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Eye, 
  Type, Check, ArrowRight, X, Building2
} from 'lucide-react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { AuditBlock, NSAPGramPanchayatData } from '@/types/socialAudit';
import { 
  buildNSAPWorkbookData, 
  extractNSAPDataFromWorkbook,
  getCellValue 
} from './nsapWorkbookService';
import { 
  exportNSAPWorkbookToExcel, 
  importNSAPWorkbookFromExcel, 
  printNSAPActiveSheet 
} from './nsapWorkbookExport';
import SocialAuditPortal from '../SocialAuditPortal';

export default function NSAPWorkbook() {
  const { 
    records, 
    nsapRecords, 
    isEditMode, 
    setNsapRecords,
    currentUser 
  } = useSocialAuditStore();

  const sheetRef = useRef<WorkbookInstance>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mounted guard for client-side rendering
  const [mounted, setMounted] = useState(false);

  // Font mode: 'krutidev' | 'unicode'
  const [fontMode, setFontMode] = useState<'krutidev' | 'unicode'>('krutidev');

  // Block filter: 'all' | 'Baghpat' | 'Baraut'
  const [selectedBlock, setSelectedBlock] = useState<'all' | AuditBlock>('all');

  // Search input for quick GP jump
  const [searchQuery, setSearchQuery] = useState('');

  // Active Sheet Index (0 is summary, 1..88 are GPs)
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Cloud save status: 'saved' | 'saving' | 'unsaved'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Import preview modal state
  const [importPreview, setImportPreview] = useState<{
    isOpen: boolean;
    records: NSAPGramPanchayatData[];
    sheetCount: number;
    message: string;
  }>({
    isOpen: false,
    records: [],
    sheetCount: 0,
    message: ''
  });

  // Export loading state
  const [isExporting, setIsExporting] = useState(false);

  // Exact 47 Gram Panchayats where NSAP is held
  const nsapGps = useMemo(() => {
    return records.filter((r) => r.hasNSAP);
  }, [records]);

  const baghpatCount = useMemo(() => nsapGps.filter((r) => r.block === 'Baghpat').length, [nsapGps]);
  const barautCount = useMemo(() => nsapGps.filter((r) => r.block === 'Baraut').length, [nsapGps]);

  // Initialize initial workbook data
  const initialData = useMemo(() => {
    return buildNSAPWorkbookData({
      records,
      nsapRecords,
      fontMode
    });
  }, [records, nsapRecords, fontMode]);

  useEffect(() => {
    setMounted(true);
    // Force canvas resize to ensure grid displays immediately with full height
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [fontMode]);

  // Filtered GP list for quick dropdown navigation (filtered from the 47 NSAP GPs)
  const filteredGps = useMemo(() => {
    return nsapGps.filter((r) => {
      const blockMatches = selectedBlock === 'all' || r.block === selectedBlock;
      const queryMatches = !searchQuery.trim() || 
        r.gpNameUnicode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.gpNameKrutiDev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sno.toString() === searchQuery.trim();
      return blockMatches && queryMatches;
    });
  }, [nsapGps, selectedBlock, searchQuery]);

  // Jump to specific sheet
  const handleJumpToSheet = (sheetIndex: number) => {
    if (!sheetRef.current) return;
    try {
      sheetRef.current.activateSheet({ index: sheetIndex });
      setActiveSheetIndex(sheetIndex);
    } catch (err) {
      console.error('Failed to activate sheet:', err);
    }
  };

  // Jump to next / previous sheet
  const handleNextSheet = () => {
    const totalSheets = nsapGps.length + 1;
    const nextIndex = (activeSheetIndex + 1) % totalSheets;
    handleJumpToSheet(nextIndex);
  };

  const handlePrevSheet = () => {
    const totalSheets = nsapGps.length + 1;
    const prevIndex = (activeSheetIndex - 1 + totalSheets) % totalSheets;
    handleJumpToSheet(prevIndex);
  };

  // Recalculate summary sheet whenever any GP sheet is modified
  const handleRecalculateSummary = useCallback(() => {
    if (!sheetRef.current) return;
    try {
      const allSheets = sheetRef.current.getAllSheets();
      if (!allSheets || allSheets.length < 2) return;

      const summarySheet = allSheets[0];
      if (!summarySheet) return;

      let grandTotalBeneficiaries = 0;
      let grandVerifiedDirect = 0;
      let grandVerifiedFamily = 0;
      let grandVerifiedTotal = 0;
      let grandUnverified = 0;
      let grandNotReceived = 0;
      let grandIneligible = 0;
      let grandDeceased = 0;

      // Scan GP sheets
      for (let s = 1; s < allSheets.length; s++) {
        const gpSheet = allSheets[s];
        if (!gpSheet) continue;

        const totalBens = parseInt(getCellValue(gpSheet, 5, 2), 10) || 0;
        const verDirect = parseInt(getCellValue(gpSheet, 5, 3), 10) || 0;
        const verFamily = parseInt(getCellValue(gpSheet, 5, 4), 10) || 0;
        const verTotal = parseInt(getCellValue(gpSheet, 5, 5), 10) || (verDirect + verFamily);

        // Count beneficiaries in this sheet
        let inelCount = 0;
        let decCount = 0;
        let unverCount = 0;
        let notRecvCount = 0;

        for (let r = 5; r <= 50; r++) {
          if (getCellValue(gpSheet, r, 9)) unverCount++;
          if (getCellValue(gpSheet, r, 12)) notRecvCount++;
          if (getCellValue(gpSheet, r, 15)) inelCount++;
          if (getCellValue(gpSheet, r, 19)) decCount++;
        }

        grandTotalBeneficiaries += totalBens;
        grandVerifiedDirect += verDirect;
        grandVerifiedFamily += verFamily;
        grandVerifiedTotal += verTotal;
        grandUnverified += unverCount;
        grandNotReceived += notRecvCount;
        grandIneligible += inelCount;
        grandDeceased += decCount;

        // Update corresponding row in summary sheet
        const summaryRow = 5 + (s - 1);
        sheetRef.current.setCellValue(summaryRow, 2, totalBens || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 3, verDirect || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 4, verFamily || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 5, verTotal || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 7, unverCount || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 10, notRecvCount || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 13, inelCount || '', { id: 'sheet-summary' });
        sheetRef.current.setCellValue(summaryRow, 17, decCount || '', { id: 'sheet-summary' });
      }

      // Update grand total row in summary sheet
      const totalRow = 5 + nsapGps.length;
      sheetRef.current.setCellValue(totalRow, 2, grandTotalBeneficiaries, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 3, grandVerifiedDirect, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 4, grandVerifiedFamily, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 5, grandVerifiedTotal, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 7, grandUnverified, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 10, grandNotReceived, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 13, grandIneligible, { id: 'sheet-summary' });
      sheetRef.current.setCellValue(totalRow, 17, grandDeceased, { id: 'sheet-summary' });
    } catch (e) {
      console.error('Error recalculating summary sheet:', e);
    }
  }, [nsapGps.length]);

  // Hook triggered when a cell is edited
  const afterUpdateCell = useCallback((row: number, column: number, oldValue: any, newValue: any) => {
    if (!sheetRef.current) return;

    if (!isEditMode) {
      showToast('यह वर्कबुक केवल पठन हेतु है। संपादन के लिए कृपया Edit Mode ON करें।', 'warning');
      return;
    }

    setSaveStatus('unsaved');

    // If edit occurred in GP sheets, recalculate summary
    if (activeSheetIndex > 0) {
      handleRecalculateSummary();
    }

    // Debounced sync with Zustand store
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (sheetRef.current && isEditMode) {
        setSaveStatus('saving');
        const allSheets = sheetRef.current.getAllSheets();
        const updated = extractNSAPDataFromWorkbook(allSheets, nsapRecords, records);
        setNsapRecords(updated);
        setSaveStatus('saved');
        showToast('परिवर्तन क्लाउड पर सुरक्षित किए गए', 'success');
      }
    }, 2500);
  }, [isEditMode, activeSheetIndex, handleRecalculateSummary, nsapRecords, records, setNsapRecords]);

  // Manual Save to Cloud
  const handleSaveToCloud = () => {
    if (!sheetRef.current) return;
    if (!isEditMode) {
      showToast('त्रुटि: डेटा सुरक्षित करने के लिए कृपया पहले Header से Edit Mode ON करें।', 'warning');
      return;
    }

    try {
      setSaveStatus('saving');
      const allSheets = sheetRef.current.getAllSheets();
      const updated = extractNSAPDataFromWorkbook(allSheets, nsapRecords, records);
      setNsapRecords(updated);
      setSaveStatus('saved');
      showToast(`सफलतापूर्वक ${updated.length} ग्राम पंचायतों का NSAP डेटा क्लाउड पर सुरक्षित हुआ!`, 'success');
    } catch (err: any) {
      setSaveStatus('unsaved');
      showToast(`सुरक्षित करने में त्रुटि: ${err?.message || 'अज्ञात त्रुटि'}`, 'error');
    }
  };

  // Handle Excel Export (.xlsx)
  const handleExportExcel = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      const allSheets = sheetRef.current.getAllSheets();
      const fileName = `NSAP_Baghpat_Social_Audit_2026_27_${fontMode}`;
      await exportNSAPWorkbookToExcel(allSheets, fileName, fontMode);
      showToast('NSAP एक्सेल वर्कबुक सफलतापूर्वक डाउनलोड हुई!', 'success');
    } catch (err: any) {
      showToast(`डाउनलोड विफल: ${err?.message || 'अज्ञात त्रुटि'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Excel Import (.xlsx)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isEditMode) {
      showToast('त्रुटि: Excel आयात करने हेतु कृपया पहले Header से Edit Mode ON करें।', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const res = await importNSAPWorkbookFromExcel(file, records, nsapRecords);
      if (res.success) {
        setImportPreview({
          isOpen: true,
          records: res.updatedRecords,
          sheetCount: res.sheetsCount,
          message: res.message
        });
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`फ़ाइल पढ़ने में त्रुटि: ${err?.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm Apply Imported Records
  const handleConfirmImport = () => {
    if (!importPreview.records.length) return;
    setNsapRecords(importPreview.records);
    setImportPreview(prev => ({ ...prev, isOpen: false }));
    showToast(`${importPreview.sheetCount} ग्राम पंचायतों का डेटा सफलतापूर्वक लागू हुआ!`, 'success');
  };

  // Print Active Sheet
  const handlePrintActive = () => {
    if (!sheetRef.current) return;
    try {
      const allSheets = sheetRef.current.getAllSheets();
      const currentSheet = allSheets[activeSheetIndex] || allSheets[0];
      const sheetName = currentSheet.name || 'NSAP Sheet';
      printNSAPActiveSheet(currentSheet, sheetName, fontMode);
    } catch (err: any) {
      showToast(`प्रिंट करने में त्रुटि: ${err?.message}`, 'error');
    }
  };

  // Active sheet title
  const activeSheetName = useMemo(() => {
    if (activeSheetIndex === 0) return '0. सारांश (समस्त 47 NSAP ग्राम पंचायत)';
    const rec = nsapGps[activeSheetIndex - 1];
    return rec ? `${activeSheetIndex}. ${rec.gpNameUnicode} (${rec.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'})` : `Sheet ${activeSheetIndex}`;
  }, [activeSheetIndex, nsapGps]);

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          NSAP आधिकारिक एक्सेल वर्कबुक लोड हो रही है...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden min-h-0">
      {/* ── Top Header Bar ── */}
      <header className="border-b border-gray-200 bg-white px-4 py-2.5 shrink-0 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Title and Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  राष्ट्रीय वृद्धावस्था पेंशन (NSAP) आधिकारिक एक्सेल वर्कबुक
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  24 स्तम्भ प्रारूप
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  47 GP + 1 सारांश
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                जनपद बागपत (2026-27) • 47 NSAP ग्राम पंचायतें • फॉर्च्यून शीट व एक्सेल जेएस इंजन • कृतिदेव 010 / मंगल यूनिकोड
              </p>
            </div>
          </div>

          {/* Action Tools & Save Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cloud Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200">
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>सिंक हो रहा है...</span>
                </>
              ) : saveStatus === 'unsaved' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-800">असुरक्षित परिवर्तन</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">क्लाउड सिंक सक्रिय</span>
                </>
              )}
            </div>

            {/* Central Edit Mode Indicator */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${
              isEditMode 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {isEditMode ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
              <span>{isEditMode ? 'Edit Mode ON' : 'Read Only'}</span>
            </div>

            {/* Save to Cloud Button */}
            {isEditMode && (
              <button
                onClick={handleSaveToCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                title="क्लाउड पर तुरंत सुरक्षित करें"
              >
                <Save className="w-3.5 h-3.5" />
                <span>सुरक्षित करें</span>
              </button>
            )}

            {/* Print Active Sheet */}
            <button
              onClick={handlePrintActive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors shadow-xs"
              title="सक्रिय शीट प्रिंट / PDF"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>प्रिंट / PDF</span>
            </button>

            {/* Import Excel */}
            {isEditMode && (
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Excel आयात</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="सम्पूर्ण 48-शीट NSAP एक्सेल वर्कबुक डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'डाउनलोड हो रहा...' : 'Excel डाउनलोड (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* ── Secondary Navigation Toolbar: Block, Search, Jump, Font ── */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Block Filter Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Block Tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-medium">
              <button
                onClick={() => setSelectedBlock('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'all'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                सभी NSAP (47 GP)
              </button>
              <button
                onClick={() => setSelectedBlock('Baghpat')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'Baghpat'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                बागपत ({baghpatCount} GP)
              </button>
              <button
                onClick={() => setSelectedBlock('Baraut')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'Baraut'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                बड़ौत ({barautCount} GP)
              </button>
            </div>

            {/* Search GP Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="NSAP ग्राम पंचायत खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Sheet Dropdown Selector */}
            <select
              value={activeSheetIndex}
              onChange={(e) => handleJumpToSheet(parseInt(e.target.value, 10))}
              className="py-1 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
            >
              <option value={0}>0. सारांश (समस्त 47 NSAP ग्राम पंचायत)</option>
              <optgroup label="47 NSAP ग्राम पंचायतें (Worksheets)">
                {filteredGps.map((gp) => {
                  const sheetIndex = nsapGps.findIndex((n) => n.id === gp.id) + 1;
                  return (
                    <option key={gp.id} value={sheetIndex}>
                      {sheetIndex}. {gp.gpNameUnicode} ({gp.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'})
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* Right: Sheet Indicator, Prev/Next buttons & Font Switcher */}
          <div className="flex items-center gap-3">
            {/* Sheet Switcher Controls */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={handlePrevSheet}
                className="p-1 hover:bg-white rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="पिछली शीट (Previous Sheet)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-gray-800 px-2 max-w-[220px] truncate" title={activeSheetName}>
                {activeSheetName}
              </span>
              <button
                onClick={handleNextSheet}
                className="p-1 hover:bg-white rounded text-gray-600 hover:text-gray-900 transition-colors"
                title="अगली शीट (Next Sheet)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Mode Switcher */}
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50 text-xs font-medium">
              <span className="text-[11px] text-gray-500 px-1 font-normal flex items-center gap-1">
                <Type className="w-3 h-3 text-gray-400" />
                फॉन्ट:
              </span>
              <button
                onClick={() => setFontMode('krutidev')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  fontMode === 'krutidev'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="कृतिदेव 010 (शासकीय मानक)"
              >
                कृतिदेव 010
              </button>
              <button
                onClick={() => setFontMode('unicode')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  fontMode === 'unicode'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="मंगल / यूनिकोड (देवनागरी)"
              >
                मंगल / यूनिकोड
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Toast Notification Layer ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[250] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 bg-gray-900 text-white border-gray-800">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── FortuneSheet Main Spreadsheet Container ── */}
      <div 
        className="flex-1 w-full relative overflow-hidden min-h-0 bg-white"
        style={{ 
          height: 'calc(100vh - 165px)', 
          minHeight: '520px', 
          width: '100%' 
        }}
      >
        <Workbook
          ref={sheetRef}
          data={initialData}
          lang="en"
          defaultFontSize={10}
          toolbarItems={[
            "undo", "redo", "format-painter", "clear-format", "|",
            "currency-format", "percentage-format", "number-decrease", "number-increase", "format", "|",
            "font-size", "|", "bold", "italic", "strike-through", "underline", "|",
            "font-color", "background", "border", "merge-cell", "|",
            "horizontal-align", "vertical-align", "text-wrap", "text-rotation", "|",
            "freeze", "conditionFormat", "filter", "link", "image", "quick-formula",
            "screenshot", "search"
          ]}
          hooks={{
            afterUpdateCell
          }}
        />
      </div>

      {/* ── Import Preview & Confirmation Dialog (SocialAuditPortal) ── */}
      {importPreview.isOpen && (
        <SocialAuditPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
              <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">NSAP Excel डेटा आयात पुष्टि</h3>
                    <p className="text-xs text-gray-500">24-स्तम्भ आधिकारिक डेटा सिंक</p>
                  </div>
                </div>
                <button
                  onClick={() => setImportPreview(prev => ({ ...prev, isOpen: false }))}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-emerald-100/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{importPreview.message}</p>
                    <p className="mt-1 text-gray-600">
                      कुल {importPreview.records.length} ग्राम पंचायतों का NSAP डेटा व लाभार्थी रिकॉर्ड्स अद्यतन होंगे।
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
                  <p>• सभी 24 स्तम्भों के आंकड़े व लाभार्थी पंजीकरण संख्या सुरक्षित की जाएंगी।</p>
                  <p>• पंजीकरण संख्या को टेक्स्ट प्रारूप (String) में सुरक्षित रखा जाएगा।</p>
                  <p>• यह डेटा सीधे क्लाउड पर भी सुरक्षित किया जाएगा।</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setImportPreview(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100"
                >
                  रद्द करें
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  डेटा लागू करें व सेव करें
                </button>
              </div>
            </div>
          </div>
        </SocialAuditPortal>
      )}
    </div>
  );
}
