'use client';

import React, { useState, useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  History, Search, Filter, Calendar, User, ShieldCheck, 
  Building2, Smartphone, FileSpreadsheet, Users, ChevronRight,
  ArrowUpDown, RefreshCw, AlertCircle, Clock, Download
} from 'lucide-react';
import { ActivityModule, ActivityActionType } from '@/types/socialAudit';
import { saveAs } from 'file-saver';

export default function ActivityLogTab() {
  const { activityLogs, records, openGPProfile } = useSocialAuditStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<'all' | ActivityModule>('all');
  const [selectedAction, setSelectedAction] = useState<'all' | ActivityActionType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (selectedModule !== 'all' && log.module !== selectedModule) return false;
      if (selectedAction !== 'all' && log.actionType !== selectedAction) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchGP = (log.gpName || '').toLowerCase().includes(q);
        const matchUser = (log.userName || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchLabel = (log.actionLabel || '').toLowerCase().includes(q);
        if (!matchGP && !matchUser && !matchDetails && !matchLabel) return false;
      }

      return true;
    });
  }, [activityLogs, selectedModule, selectedAction, searchQuery]);

  // Paginated logs
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['लॉग आईडी', 'मॉड्यूल', 'ग्राम पंचायत', 'विकास खंड', 'कार्यवाही प्रकार', 'कार्यवाही विवरण', 'उपयोगकर्ता', 'दिनांक एवं समय', 'विस्तृत विवरण'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.module,
      `"${l.gpName || ''}"`,
      l.block || 'जनपद बागपत',
      l.actionType,
      `"${l.actionLabel || ''}"`,
      `"${l.userName || ''}"`,
      new Date(l.timestamp).toLocaleString('hi-IN'),
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Social_Audit_Activity_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                <History className="w-5 h-5 text-blue-700" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                गतिविधि लॉग एवं ऑडिट ट्रेल (Activity Log)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {activityLogs.length} कुल घटनाएं
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              पोर्टल में हुए समस्त परिवर्तनों, रोस्टर संशोधनों, निर्णय अपलोड एवं MIS फीडिंग की समय-वार डिजिटल पंजिका।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>CSV निर्यात</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Module Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">मॉड्यूल</label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">समस्त मॉड्यूल (All)</option>
              <option value="gp">ग्राम पंचायत (GP)</option>
              <option value="meeting">बैठक / रोस्टर (Meeting)</option>
              <option value="nirnay">पंचायत निर्णय (Nirnay)</option>
              <option value="mis">MIS फीडिंग (MIS)</option>
              <option value="nsap">NSAP पेंशन (NSAP)</option>
              <option value="system">सिस्टम / रोस्टर सृजन</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">कार्यवाही प्रकार</label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="all">समस्त कार्यवाहियां</option>
              <option value="create">नवीन सृजन (Create)</option>
              <option value="update">अद्यतन (Update)</option>
              <option value="status_change">स्थिति बदलाव (Status Change)</option>
              <option value="sync">पोर्टल सिंक (Sync)</option>
              <option value="delete">विलोपन (Delete)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">खोजें (GP, विवरण या अधिकारी)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="खोजें..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
          <span className="font-bold text-slate-700">
            प्रदर्शित घटनाएं: <strong>{filteredLogs.length}</strong>
          </span>
          <span className="text-slate-500">
            पृष्ठ <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </span>
        </div>

        {paginatedLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            कोई गतिविधि लॉग नहीं मिला।
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedLogs.map((log) => {
              const matchedGP = records.find(r => r.id === log.recordId || (r.gpNameUnicode && log.gpName?.includes(r.gpNameUnicode)));
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                        log.module === 'gp' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        log.module === 'meeting' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        log.module === 'nirnay' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                        log.module === 'mis' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        log.module === 'nsap' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {log.module}
                      </span>
                      <span className="font-black text-slate-900 text-xs">
                        {log.actionLabel}
                      </span>
                      {log.gpName && (
                        <span className="font-bold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded border border-blue-200/70">
                          {log.gpName}
                        </span>
                      )}
                    </div>

                    <span className="text-slate-500 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleString('hi-IN')}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-medium">
                    {log.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center gap-3">
                      <span>उपयोगकर्ता: <strong className="text-slate-700">{log.userName}</strong></span>
                      {log.block && <span>ब्लॉक: <strong className="text-slate-700">{log.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}</strong></span>}
                    </div>

                    {matchedGP && (
                      <button
                        onClick={() => openGPProfile(matchedGP)}
                        className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>GP प्रोफाइल देखें</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            ← पिछला
          </button>
          <span className="text-slate-500 font-medium">
            पृष्ठ {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            अगला →
          </button>
        </div>

      </div>

    </div>
  );
}

