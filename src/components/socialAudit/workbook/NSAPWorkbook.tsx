'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Workbook, WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { 
  FileSpreadsheet, Download, Upload, Printer, Save, 
  Search, ChevronLeft, ChevronRight, Filter, Lock, Unlock,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Eye, 
  Type, Check, ArrowRight, X, Building2, Maximize2, Minimize2, ArrowUp,
  Paintbrush
} from 'lucide-react';
import { isLikelyKrutiDev } from '@/lib/fontConversion/fontDetector';
import { normalizeKrutiDevText } from '@/lib/fontConversion/normalizeKrutiDev';
import { processSmartCellText } from '@/lib/fontConversion/smartTextPipeline';
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
  const workbookContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mounted guard for client-side rendering
  const [mounted, setMounted] = useState(false);

  // Fullscreen mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Format Painter state
  const [formatPainter, setFormatPainter] = useState<{
    active: boolean;
    format: {
      ff?: any;
      fs?: any;
      bl?: any;
      it?: any;
      bg?: any;
      fc?: any;
      ht?: any;
      vt?: any;
      tb?: any;
      ct?: any;
    } | null;
    sourceCoord: string;
  }>({
    active: false,
    format: null,
    sourceCoord: ''
  });
  const formatPainterRef = useRef(formatPainter);
  formatPainterRef.current = formatPainter;

  // Toggle / activate format painter from currently selected cell
  const handleToggleFormatPainter = useCallback(() => {
    if (formatPainter.active) {
      setFormatPainter({ active: false, format: null, sourceCoord: '' });
      showToast('फॉर्मेट पेंटर बंद किया गया', 'warning');
      return;
    }

    const selection = sheetRef.current?.getSelection();
    if (!selection || selection.length === 0) {
      showToast('कृपया पहले वह सेल चुनें जिसका फॉर्मेट कॉपी करना है', 'warning');
      return;
    }

    const sel = selection[0];
    const r = sel.row[0];
    const c = sel.column[0];

    let cellObj: any = null;
    try {
      const cells = sheetRef.current?.getCellsByRange(sel);
      cellObj = cells?.[0]?.[0];
    } catch (_) {}

    const extractedFormat = {
      ff: cellObj?.ff || (fontMode === 'krutidev' ? 'Kruti Dev 010' : 'Arial'),
      fs: cellObj?.fs || (fontMode === 'krutidev' ? 11 : 10),
      bl: cellObj?.bl ?? 0,
      it: cellObj?.it ?? 0,
      bg: cellObj?.bg,
      fc: cellObj?.fc,
      ht: cellObj?.ht ?? 1,
      vt: cellObj?.vt ?? 0,
      tb: cellObj?.tb ?? 2,
      ct: cellObj?.ct
    };

    const colLetter = String.fromCharCode(65 + (c % 26));
    const coord = `${colLetter}${r + 1}`;

    setFormatPainter({
      active: true,
      format: extractedFormat,
      sourceCoord: coord
    });

    showToast(`सेल ${coord} का फॉर्मेट कॉपी हुआ! अब लक्ष्य सेल/रेंज पर क्लिक करें`, 'success');
  }, [formatPainter.active, fontMode]);

  const handleCancelFormatPainter = useCallback(() => {
    setFormatPainter({ active: false, format: null, sourceCoord: '' });
    showToast('फॉर्मेट पेंटर रद्द किया गया', 'warning');
  }, []);

  // 1-Click apply Kruti Dev 010 to current selection
  const handleApplyKrutiDevToSelection = useCallback(() => {
    const selection = sheetRef.current?.getSelection();
    if (!selection || selection.length === 0) {
      showToast('कृपया पहले वे सेल चुनें जिन पर कृतिदेव फॉन्ट लगाना है', 'warning');
      return;
    }

    selection.forEach((sel) => {
      try {
        sheetRef.current?.setCellFormatByRange('ff', 'Kruti Dev 010', sel);
        sheetRef.current?.setCellFormatByRange('fs', 11, sel);
      } catch (_) {}
    });

    window.dispatchEvent(new Event('resize'));
    showToast('चयनित सेल पर कृतिदेव 010 फॉन्ट सफलतापूर्वक लागू हुआ!', 'success');
  }, []);

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
    // Preload Kruti Dev 010 and trigger canvas redraw once ready
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.load('12px "Kruti Dev 010"').then(() => {
        window.dispatchEvent(new Event('resize'));
      });
      document.fonts.load('12px "KrutiDev010"');
    }
    // Force canvas resize to ensure grid displays immediately with full height
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Escape key cancels active Format Painter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formatPainter.active) {
        handleCancelFormatPainter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formatPainter.active, handleCancelFormatPainter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [fontMode]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 60);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
      return next;
    });
  };

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 60);
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 250);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Jump smoothly to Row 1 (Top)
  const handleScrollToTop = () => {
    const container = workbookContainerRef.current;
    const scrollbarY = container?.querySelector<HTMLElement>('.luckysheet-scrollbar-y');
    if (scrollbarY) {
      scrollbarY.scrollTop = 0;
      scrollbarY.dispatchEvent(new Event('scroll'));
    }
    if (sheetRef.current?.scroll) {
      try {
        sheetRef.current.scroll({ scrollTop: 0, targetRow: 0 });
      } catch (_) {}
    }
    showToast('शीर्ष पंक्ति (Row 1) पर पहुंचे', 'success');
  };

  // Mouse wheel bidirectional smooth scrolling handler (fixes FortuneSheet scroll-up bug)
  useEffect(() => {
    const container = workbookContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept if wheeling over inputs, selects, or context menus
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'SELECT' ||
          target.tagName === 'INPUT' ||
          target.closest('.luckysheet-cols-menu') ||
          target.closest('.fortune-context-menu'))
      ) {
        return;
      }

      const scrollbarY = container.querySelector<HTMLElement>('.luckysheet-scrollbar-y');
      const scrollbarX = container.querySelector<HTMLElement>('.luckysheet-scrollbar-x');

      // Vertical wheel scrolling (supports smooth scrolling both UP and DOWN)
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && scrollbarY) {
        e.preventDefault();
        e.stopPropagation();

        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 32;
        else if (e.deltaMode === 2) delta *= 300;
        else {
          delta = Math.sign(delta) * Math.max(Math.abs(delta), 45);
        }

        const newTop = Math.max(0, scrollbarY.scrollTop + delta);
        scrollbarY.scrollTop = newTop;
        scrollbarY.dispatchEvent(new Event('scroll'));

        if (sheetRef.current?.scroll) {
          try {
            sheetRef.current.scroll({ scrollTop: newTop });
          } catch (_) {}
        }
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && scrollbarX) {
        // Horizontal wheel scrolling
        e.preventDefault();
        e.stopPropagation();

        let deltaX = e.deltaX;
        if (e.deltaMode === 1) deltaX *= 32;
        else if (e.deltaMode === 2) deltaX *= 300;
        else {
          deltaX = Math.sign(deltaX) * Math.max(Math.abs(deltaX), 45);
        }

        scrollbarX.scrollLeft = Math.max(0, scrollbarX.scrollLeft + deltaX);
        scrollbarX.dispatchEvent(new Event('scroll'));
      }
    };

    container.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [mounted]);

  // Synchronizes cell editor font and formula bar font with the active cell
  const syncEditorFont = useCallback(() => {
    const container = workbookContainerRef.current;
    if (!container) return;

    const cellInput = container.querySelector('#luckysheet-rich-text-editor') as HTMLElement | null;
    const fxInput = container.querySelector('#luckysheet-functionbox-cell') as HTMLElement | null;

    if (!cellInput && !fxInput) return;

    // Check currently focused column and row from selection
    let isHindiColumn = true;
    if (sheetRef.current) {
      try {
        const selection = sheetRef.current.getSelection();
        if (selection && selection.length > 0) {
          const col = selection[0].column?.[0];
          // Columns that should stay in English/Numeric font:
          // 0 (S.No), 2..5 (Counts), 7, 9, 10, 12, 13, 15, 17, 19 (Reg IDs), 20 (Date)
          const numericCols = [0, 2, 3, 4, 5, 7, 9, 10, 12, 13, 15, 17, 19, 20];
          if (col !== undefined && numericCols.includes(col)) {
            isHindiColumn = false;
          }
        }
      } catch (_) {}
    }

    if (isHindiColumn) {
      container.classList.remove('workbook-cell-numeric');
    } else {
      container.classList.add('workbook-cell-numeric');
    }

    const targetFont = fontMode === 'krutidev'
      ? (isHindiColumn ? "'Kruti Dev 010', 'KrutiDev010', 'Kruti Dev', sans-serif" : "Arial, sans-serif")
      : (isHindiColumn ? "'Mangal', 'Noto Sans Devanagari', sans-serif" : "Arial, sans-serif");

    const targetFontSize = fontMode === 'krutidev' && isHindiColumn ? "13.5px" : "12px";

    if (cellInput) {
      cellInput.style.setProperty('font-family', targetFont, 'important');
      cellInput.style.setProperty('font-size', targetFontSize, 'important');
      const spans = cellInput.querySelectorAll<HTMLElement>('span');
      spans.forEach(s => {
        s.style.setProperty('font-family', targetFont, 'important');
        s.style.setProperty('font-size', targetFontSize, 'important');
      });
    }

    if (fxInput) {
      fxInput.style.setProperty('font-family', targetFont, 'important');
      fxInput.style.setProperty('font-size', targetFontSize, 'important');
      const fxSpans = fxInput.querySelectorAll<HTMLElement>('span');
      fxSpans.forEach(s => {
        s.style.setProperty('font-family', targetFont, 'important');
        s.style.setProperty('font-size', targetFontSize, 'important');
      });
    }
  }, [fontMode]);

  // Attach event listeners and MutationObserver to apply Kruti Dev font during editing
  useEffect(() => {
    const container = workbookContainerRef.current;
    if (!container) return;

    const handleDblClick = () => {
      syncEditorFont();
      setTimeout(syncEditorFont, 10);
      setTimeout(syncEditorFont, 50);
      setTimeout(syncEditorFont, 150);
    };

    const handleKeyDown = () => {
      setTimeout(syncEditorFont, 0);
      setTimeout(syncEditorFont, 40);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.id === 'luckysheet-rich-text-editor' ||
          target.id === 'luckysheet-functionbox-cell' ||
          target.classList.contains('fortune-fx-input'))
      ) {
        syncEditorFont();
        setTimeout(syncEditorFont, 20);
      }
    };

    // Watch for DOM changes when FortuneSheet mounts or modifies #luckysheet-rich-text-editor
    const observer = new MutationObserver(() => {
      const cellInput = container.querySelector('#luckysheet-rich-text-editor');
      if (cellInput) {
        syncEditorFont();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    container.addEventListener('dblclick', handleDblClick, true);
    container.addEventListener('keydown', handleKeyDown, true);
    container.addEventListener('focusin', handleFocusIn, true);

    // Auto-detect and fix Kruti Dev encoding when pasting from external Excel
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardHtml = e.clipboardData?.getData('text/html') || '';
      const clipboardText = e.clipboardData?.getData('text/plain') || '';
      const isKrutiInHtml = clipboardHtml.toLowerCase().includes('kruti');

      setTimeout(() => {
        const selection = sheetRef.current?.getSelection();
        if (!selection || selection.length === 0) return;

        // Calculate paste area from clipboard text dimensions if multi-line/tab
        const lines = clipboardText.replace(/\r\n/g, '\n').split('\n').filter(l => l.length > 0);
        const numRows = lines.length;
        const numCols = lines.reduce((max, line) => Math.max(max, line.split('\t').length), 1);

        let fixedCount = 0;
        selection.forEach((sel) => {
          const startR = sel.row[0];
          const endR = Math.max(sel.row[1], startR + (numRows > 1 ? numRows - 1 : 0));
          const startC = sel.column[0];
          const endC = Math.max(sel.column[1], startC + (numCols > 1 ? numCols - 1 : 0));

          for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
              const val = sheetRef.current?.getCellValue(r, c);
              if (val !== undefined && val !== null && val !== '') {
                const strVal = String(val);
                const processed = processSmartCellText({
                  text: strVal,
                  targetFontMode: fontMode,
                  colIndex: c,
                  clipboardFont: isKrutiInHtml ? 'Kruti Dev 010' : undefined
                });

                try {
                  if (processed.value !== strVal) {
                    sheetRef.current?.setCellValue(r, c, processed.value);
                  }
                  sheetRef.current?.setCellFormat(r, c, 'ff', processed.fontName);
                  sheetRef.current?.setCellFormat(r, c, 'fs', processed.fontSize);
                  fixedCount++;
                } catch (_) {}
              }
            }
          }
        });

        if (fixedCount > 0) {
          window.dispatchEvent(new Event('resize'));
          showToast(`पेस्ट किए गए ${fixedCount} सेल पर स्मार्ट फॉन्ट व डेटा प्रारूप लागू किया गया`, 'success');
        }
      }, 120);
    };

    container.addEventListener('paste', handlePaste, true);

    return () => {
      observer.disconnect();
      container.removeEventListener('dblclick', handleDblClick, true);
      container.removeEventListener('keydown', handleKeyDown, true);
      container.removeEventListener('focusin', handleFocusIn, true);
      container.removeEventListener('paste', handlePaste, true);
    };
  }, [syncEditorFont, fontMode]);

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

    // Smart classification and font formatting for newly edited cell
    if (typeof newValue === 'string' && newValue.trim() !== '') {
      const processed = processSmartCellText({
        text: newValue,
        targetFontMode: fontMode,
        colIndex: column
      });

      setTimeout(() => {
        try {
          if (processed.value !== newValue) {
            sheetRef.current?.setCellValue(row, column, processed.value);
          }
          sheetRef.current?.setCellFormat(row, column, 'ff', processed.fontName);
          sheetRef.current?.setCellFormat(row, column, 'fs', processed.fontSize);
        } catch (_) {}
      }, 30);
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
  }, [isEditMode, activeSheetIndex, handleRecalculateSummary, nsapRecords, records, setNsapRecords, fontMode]);

  // Hook triggered when a cell/range selection changes (handles Format Painter apply)
  const afterSelectionChange = useCallback((sheetId: string, selection: any) => {
    if (formatPainterRef.current.active && formatPainterRef.current.format && selection) {
      const fmt = formatPainterRef.current.format;

      const attrs: Array<'ff' | 'fs' | 'bl' | 'it' | 'bg' | 'fc' | 'ht' | 'vt' | 'tb'> = [
        'ff', 'fs', 'bl', 'it', 'bg', 'fc', 'ht', 'vt', 'tb'
      ];

      attrs.forEach((attr) => {
        const val = fmt[attr];
        if (val !== undefined) {
          try {
            sheetRef.current?.setCellFormatByRange(attr, val, selection);
          } catch (_) {}
        }
      });

      showToast('फॉर्मेट सफलतापूर्वक लागू किया गया!', 'success');
      setFormatPainter({ active: false, format: null, sourceCoord: '' });
      formatPainterRef.current = { active: false, format: null, sourceCoord: '' };

      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }, []);

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
    <div 
      className={`w-full flex flex-col bg-white overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-0 z-[1000] w-screen h-screen' 
          : 'h-full min-h-0'
      }`}
    >
      {/* ── Top Header Bar (Spacious & Premium Enterprise Design) ── */}
      <header className="border-b border-slate-200/90 bg-white px-4 md:px-5 py-2.5 shrink-0 shadow-2xs">
        {/* Row 1: Title, Background Sync Indicator & Primary Action Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Left: Branding, Title, Badges & Background Sync */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight">
                  राष्ट्रीय वृद्धावस्था पेंशन (NSAP) आधिकारिक वर्कबुक
                </h1>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    24 स्तम्भ प्रारूप
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                    47 GP + 1 सारांश
                  </span>
                  {isFullscreen && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
                      ⛶ पूर्ण स्क्रीन
                    </span>
                  )}
                </div>

                {/* Background Cloud Sync Status (Quiet & subtle in background) */}
                <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400 pl-1">
                  {saveStatus === 'saving' ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium animate-pulse" title="क्लाउड डेटाबेस से सिंक हो रहा है">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span>सिंक हो रहा है...</span>
                    </span>
                  ) : saveStatus === 'unsaved' ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium" title="असुरक्षित परिवर्तन मौजूद हैं">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>असुरक्षित परिवर्तन</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors" title="सभी परिवर्तन क्लाउड पर सुरक्षित हैं">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>क्लाउड सिंक</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons Group (Clean, Compact, Spacious) */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* Edit / Read-Only Mode Badge */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              isEditMode 
                ? 'bg-amber-50 text-amber-800 border-amber-300/80' 
                : 'bg-slate-100/80 text-slate-600 border-slate-200/80'
            }`}>
              {isEditMode ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isEditMode ? 'Edit Mode' : 'Read Only'}</span>
            </div>

            {/* Save to Cloud Button (Visible only in Edit Mode) */}
            {isEditMode && (
              <button
                onClick={handleSaveToCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                title="क्लाउड पर तुरंत सुरक्षित करें"
              >
                <Save className="w-3.5 h-3.5" />
                <span>सुरक्षित करें</span>
              </button>
            )}

            {/* Import Excel (Visible only in Edit Mode) */}
            {isEditMode && (
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs" title="Excel (.xlsx) फ़ाइल आयात करें">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>आयात</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Scroll to Top (Row 1) - Compact Icon Button with Tooltip */}
            <button
              onClick={handleScrollToTop}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
              title="शीर्ष पंक्ति (Row 1) पर जाएं"
              aria-label="शीर्ष पंक्ति पर जाएं"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle - ONLY ICON with Tooltip (As requested by user) */}
            <button
              onClick={toggleFullscreen}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shadow-2xs ${
                isFullscreen
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-xs'
                  : 'border-slate-200 hover:bg-purple-50 text-purple-700 hover:border-purple-200'
              }`}
              title={isFullscreen ? 'सामान्य दृश्य पर लौटें (Esc)' : 'पूर्ण स्क्रीन में खोलें (Full Screen)'}
              aria-label="फुल स्क्रीन टॉगल"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Print Active Sheet - Compact Icon Button with Tooltip */}
            <button
              onClick={handlePrintActive}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
              title="सक्रिय शीट प्रिंट / PDF"
              aria-label="प्रिंट / PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Export Excel (.xlsx) - Primary CTA */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="सम्पूर्ण 48-शीट NSAP एक्सेल वर्कबुक डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'डाउनलोड...' : 'Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* ── Secondary Navigation Toolbar: Block, Search, Jump, Font ── */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Block Filter Tabs, Search & GP Select */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Block Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200/90 p-0.5 bg-slate-100/80 text-xs font-medium">
              <button
                onClick={() => setSelectedBlock('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'all'
                    ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सभी (47)
              </button>
              <button
                onClick={() => setSelectedBlock('Baghpat')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'Baghpat'
                    ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बागपत ({baghpatCount})
              </button>
              <button
                onClick={() => setSelectedBlock('Baraut')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedBlock === 'Baraut'
                    ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                बड़ौत ({barautCount})
              </button>
            </div>

            {/* Search GP Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="NSAP GP खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs w-40 md:w-44 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Sheet Dropdown Selector */}
            <select
              value={activeSheetIndex}
              onChange={(e) => handleJumpToSheet(parseInt(e.target.value, 10))}
              className="py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs max-w-[240px]"
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
          <div className="flex items-center gap-2">
            {/* Sheet Switcher Controls */}
            <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200/90 rounded-lg p-0.5">
              <button
                onClick={handlePrevSheet}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="पिछली शीट (Previous Sheet)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-800 px-2 max-w-[200px] truncate" title={activeSheetName}>
                {activeSheetName}
              </span>
              <button
                onClick={handleNextSheet}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="अगली शीट (Next Sheet)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Format Painter Tool */}
            <button
              onClick={handleToggleFormatPainter}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                formatPainter.active
                  ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300 animate-pulse'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
              title="फॉर्मेट कॉपी (Format Painter) - किसी सेल का फॉन्ट व फॉर्मेट कॉपी कर लक्ष्य सेल पर लगाएं"
            >
              <Paintbrush className={`w-3.5 h-3.5 ${formatPainter.active ? 'text-white' : 'text-amber-600'}`} />
              <span>{formatPainter.active ? 'पेंटर सक्रिय...' : 'फॉर्मेट कॉपी'}</span>
            </button>

            {/* 1-Click Apply Kruti Dev 010 Font to selection */}
            <button
              onClick={handleApplyKrutiDevToSelection}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="चयनित सभी सेलों पर 1-क्लिक में कृतिदेव 010 फॉन्ट लगाएं"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>कृतिदेव फॉन्ट लगाएं</span>
            </button>

            {/* Font Mode Switcher */}
            <div className="flex items-center gap-1 border border-slate-200/90 rounded-lg p-0.5 bg-slate-100/80 text-xs font-medium">
              <span className="text-[11px] text-slate-500 px-1 font-normal flex items-center gap-1">
                <Type className="w-3 h-3 text-slate-400" />
                फॉन्ट:
              </span>
              <button
                onClick={() => setFontMode('krutidev')}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  fontMode === 'krutidev'
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="कृतिदेव 010 (शासकीय मानक)"
              >
                कृतिदेव 010
              </button>
              <button
                onClick={() => setFontMode('unicode')}
                className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  fontMode === 'unicode'
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="मंगल / यूनिकोड (देवनागरी)"
              >
                मंगल / यूनिकोड
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Format Painter Active Banner ── */}
      {formatPainter.active && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>
              <strong>फॉर्मेट पेंटर सक्रिय है:</strong> सेल (
              <span className="font-bold underline text-amber-950">{formatPainter.sourceCoord || 'स्रोत'}</span>
              ) का फॉन्ट व स्टाइल कॉपी हो चुका है। अब जिस सेल या रेंज पर यह फॉर्मेट लगाना चाहते हैं, उस पर क्लिक या सेलेक्ट करें।
            </span>
          </div>
          <button
            onClick={handleCancelFormatPainter}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-semibold text-xs transition-colors cursor-pointer"
          >
            रद्द करें (Esc)
          </button>
        </div>
      )}

      {/* ── Toast Notification Layer ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[2500] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 bg-gray-900 text-white border-gray-800">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── FortuneSheet Main Spreadsheet Container ── */}
      <div 
        ref={workbookContainerRef}
        className={`flex-1 w-full relative overflow-hidden min-h-0 bg-white ${
          fontMode === 'krutidev' ? 'workbook-krutidev' : 'workbook-unicode'
        }`}
        style={{ 
          height: isFullscreen ? 'calc(100vh - 95px)' : 'calc(100vh - 150px)', 
          minHeight: isFullscreen ? 'calc(100vh - 95px)' : '520px', 
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
            afterUpdateCell,
            afterSelectionChange
          }}
        />
      </div>

      {/* ── Import Preview & Confirmation Dialog (SocialAuditPortal) ── */}
      {importPreview.isOpen && (
        <SocialAuditPortal>
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
