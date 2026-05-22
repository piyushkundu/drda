'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { motion } from 'framer-motion';
import { Workbook, WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Save, Download, FileSpreadsheet, Printer, Sparkles, Loader2, Type } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { inscriptMap } from '@/lib/keyboardLayouts';
import { convertFont } from '@/lib/fontConversion';

export default function SpreadsheetEditor() {
  const { currentDocument, updateTitle, isAutoSaving, isDirty } = useDocumentStore();
  const [title, setTitle] = useState(currentDocument?.title || '');
  const sheetRef = useRef<WorkbookInstance>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  
  const fonts = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Kruti Dev 010', value: 'Kruti Dev 010' },
    { label: 'Mangal', value: 'Mangal' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' }
  ];
  // Update local title when document changes externally
  useEffect(() => {
    if (currentDocument?.title) {
      setTitle(currentDocument.title);
    }
  }, [currentDocument?.title]);

  // Handle typing inside the spreadsheet cell input box
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Fortune sheet uses a contenteditable div for editing cells
      const activeEl = document.activeElement as HTMLElement;
      if (!activeEl) return;
      
      const isSheetEditor = activeEl.id === 'luckysheet-rich-text-editor' || 
                            activeEl.classList.contains('luckysheet-rich-text-editor') ||
                            activeEl.id === 'luckysheet-input-box';
                            
      if (!isSheetEditor) return;

      // Apply the selected font visually to the editing box
      if (selectedFont) {
        activeEl.style.fontFamily = selectedFont.includes('Kruti Dev') ? "'Kruti Dev 010', sans-serif" : selectedFont;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return;

      if (selectedFont === 'Mangal') {
        // For Mangal, map QWERTY keys to Hindi Unicode characters
        // If they are already typing Hindi characters (e.g. using Windows Hindi IME), just pass it through
        if (/[\u0900-\u097F]/.test(e.key)) return;

        const mappedChar = inscriptMap[e.key];
        if (mappedChar) {
          e.preventDefault();
          document.execCommand('insertText', false, mappedChar);
        }
      }
      // For Kruti Dev, we let English characters insert natively because the font handles the display!
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [selectedFont]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateTitle(e.target.value);
    }, 1000);
  };

  const downloadExcel = async () => {
    if (!sheetRef.current || !currentDocument) return;
    
    try {
      const data = sheetRef.current.getAllSheets();
      const workbook = new ExcelJS.Workbook();
      
      data.forEach((sheetData) => {
        const worksheet = workbook.addWorksheet(sheetData.name);
        
        // This is a basic conversion. For a production app, we would parse styles, merged cells etc.
        if (sheetData.data) {
          sheetData.data.forEach((rowArr: any[], rIndex: number) => {
            if (rowArr) {
              rowArr.forEach((cell: any, cIndex: number) => {
                if (cell && (cell.m !== undefined || cell.v !== undefined)) {
                  worksheet.getCell(rIndex + 1, cIndex + 1).value = cell.m || cell.v;
                }
              });
            }
          });
        } else if (sheetData.celldata) {
          sheetData.celldata.forEach((cell: any) => {
            const row = cell.r + 1;
            const col = cell.c + 1;
            const value = cell.v?.m || cell.v?.v || '';
            worksheet.getCell(row, col).value = value;
          });
        }
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${title || 'Spreadsheet'}.xlsx`);
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('Excel फाइल डाउनलोड करने में त्रुटि आई। (Error downloading Excel file.)');
    }
  };

  const applyFont = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontName = e.target.value;
    setSelectedFont(fontName);
    if (!sheetRef.current) return;
    
    const selection = sheetRef.current.getSelection();
    if (!selection || selection.length === 0) return;
    
    selection.forEach(range => {
      sheetRef.current?.setCellFormatByRange('ff', fontName, range);
    });
  };

  const convertSpreadsheetFont = (direction: 'krutidev-to-mangal' | 'mangal-to-krutidev') => {
    if (!sheetRef.current) return;
    
    const allSheets = sheetRef.current.getAllSheets();
    const activeSheet = allSheets.find(s => s.status === 1) || allSheets[0];
    
    if (activeSheet && activeSheet.data) {
      let maxR = 0;
      let maxC = 0;
      
      // Iterate through the entire active sheet
      activeSheet.data.forEach((rowArr: any[], r: number) => {
        if (rowArr) {
          maxR = Math.max(maxR, r);
          rowArr.forEach((cell: any, c: number) => {
            if (cell) {
              maxC = Math.max(maxC, c);
              const text = cell.v || cell.m || (typeof cell === 'string' ? cell : '');
              if (text && typeof text === 'string' && text.trim().length > 0) {
                try {
                  const convertedText = convertFont(text, direction);
                  sheetRef.current?.setCellValue(r, c, convertedText);
                } catch (e) {
                  console.error(e);
                }
              }
            }
          });
        }
      });
      
      // Switch font dropdown
      const newFont = direction === 'krutidev-to-mangal' ? 'Mangal' : 'Kruti Dev 010';
      setSelectedFont(newFont);
      
      // Apply the font format to the entire initialized sheet safely
      const maxSheetRow = activeSheet.data.length > 0 ? activeSheet.data.length - 1 : 0;
      const maxSheetCol = activeSheet.data[0]?.length > 0 ? activeSheet.data[0].length - 1 : 0;
      
      const formatRange = { 
        row: [0, maxSheetRow], 
        column: [0, maxSheetCol] 
      };
      
      if (maxSheetRow >= 0 && maxSheetCol >= 0) {
        sheetRef.current.setCellFormatByRange('ff', newFont, formatRange);
      }
    }
  };

  const applyAICorrection = async () => {
    if (!sheetRef.current) return;
    const selection = sheetRef.current.getSelection();
    if (!selection || selection.length === 0) {
      alert('कृपया सुधार के लिए कुछ सेल चुनें। (Please select cells to correct)');
      return;
    }

    setIsProcessingAI(true);
    try {
      const range = selection[0];
      const startRow = range.row[0];
      const endRow = range.row[1];
      const startCol = range.column[0];
      const endCol = range.column[1];

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cellVal = sheetRef.current.getCellValue(r, c);
          const text = cellVal?.v || cellVal?.m || (typeof cellVal === 'string' ? cellVal : '');
          
          if (text && typeof text === 'string' && text.trim().length > 0) {
            const res = await fetch('/api/ai/spreadsheet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: text,
                command: 'Fix spelling and grammar errors in this text. If it is Hindi, fix Hindi grammar. Only return the corrected text without any quotes or markdown.'
              })
            });
            const data = await res.json();
            if (data.result) {
              sheetRef.current.setCellValue(r, c, data.result);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('AI सुधार में त्रुटि आई। (Error in AI correction)');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const printArea = () => {
    if (!sheetRef.current) return;
    const selection = sheetRef.current.getSelection();
    if (!selection || selection.length === 0) {
      alert('कृपया प्रिंट करने के लिए एरिया चुनें। (Please select an area to print)');
      return;
    }

    const html = sheetRef.current.getHtmlByRange([selection[0]]);
    if (!html) {
      alert('खाली एरिया! (Empty area)');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Area</title>
            <style>
              @font-face {
                font-family: 'Kruti Dev 010';
                src: url('/fonts/KrutiDev010.ttf') format('truetype');
              }
              body { font-family: sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #333; padding: 4px; min-width: 50px; height: 20px; }
            </style>
          </head>
          <body>
            ${html}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = () => window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // We need to pass the data safely
  let initialData = [{ name: 'Sheet1', celldata: [] }];
  try {
    if (currentDocument?.content) {
      initialData = JSON.parse(currentDocument.content);
    }
  } catch (e) {
    console.error('Failed to parse spreadsheet data', e);
  }

  const onChange = (data: any) => {
    // Only save after initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Throttle save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (sheetRef.current) {
        const allData = sheetRef.current.getAllSheets();
        useDocumentStore.getState().updateContent(JSON.stringify(allData));
      }
    }, 2000);
  };

  if (!currentDocument) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Spreadsheet Toolbar */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-[#27ae6020] text-[#27ae60] flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="स्प्रेडशीट का नाम..."
            className="bg-transparent border-none focus:outline-none focus:ring-0 font-medium text-lg w-64 placeholder-gray-400"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Custom Toolbar Controls */}
          <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-700 pr-3 mr-1">
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 px-2 py-1">
              <Type className="w-3.5 h-3.5 text-gray-500" />
              <select 
                value={selectedFont}
                onChange={applyFont}
                className="bg-transparent border-none text-sm focus:outline-none w-28 text-gray-700 dark:text-gray-200"
              >
                {fonts.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {selectedFont.includes('Kruti Dev') ? (
              <button
                onClick={() => convertSpreadsheetFont('krutidev-to-mangal')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors text-sm font-medium"
                title="Convert KrutiDev text to Mangal (Unicode)">
                <Type className="w-4 h-4" />
                KrutiDev → Mangal
              </button>
            ) : (
              <button
                onClick={() => convertSpreadsheetFont('mangal-to-krutidev')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-colors text-sm font-medium"
                title="Convert Mangal (Unicode) text to KrutiDev">
                <Type className="w-4 h-4" />
                Mangal → KrutiDev
              </button>
            )}

            <button
              onClick={applyAICorrection}
              disabled={isProcessingAI}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors text-sm font-medium disabled:opacity-50"
              title="AI से सेल का डेटा सुधारें"
            >
              {isProcessingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>AI Correct</span>
            </button>

            <button
              onClick={printArea}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
              title="चुने हुए हिस्से को प्रिंट करें"
            >
              <Printer className="w-4 h-4" />
              <span>Print Area</span>
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mr-2">
            {isAutoSaving ? (
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" /> Saving...</span>
            ) : isDirty ? (
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> Unsaved</span>
            ) : (
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Saved to Cloud</span>
            )}
          </div>
          
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#27ae60] text-white hover:bg-[#219a52] transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>
      
      {/* FortuneSheet Container */}
      <div className="flex-1 w-full relative">
        <Workbook 
          ref={sheetRef} 
          data={initialData} 
          onChange={onChange}
          lang="en"
          toolbarItems={[
            "undo", "redo", "format-painter", "clear-format", "|", 
            "currency-format", "percentage-format", "number-decrease", "number-increase", "format", "|", 
            "font-size", "|", "bold", "italic", "strike-through", "underline", "|", 
            "font-color", "background", "border", "merge-cell", "|", 
            "horizontal-align", "vertical-align", "text-wrap", "text-rotation", "|", 
            "freeze", "conditionFormat", "filter", "link", "image", "comment", "quick-formula", 
            "dataVerification", "splitColumn", "locationCondition", "screenshot", "search"
          ]}
        />
      </div>
    </div>
  );
}
