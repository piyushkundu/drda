'use client';

import React, { useState, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord } from '@/types/socialAudit';
import { renderAuditText } from '@/lib/renderAuditText';
import { 
  X, Calendar, Clock, AlertTriangle, MapPin, 
  User, Users, Sparkles, Loader2, ArrowRight, RotateCcw
} from 'lucide-react';

interface RescheduleMeetingModalProps {
  record: SocialAuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RescheduleMeetingModal({
  record,
  isOpen,
  onClose,
  onSuccess
}: RescheduleMeetingModalProps) {
  const { 
    rescheduleMeeting, 
    isEditMode, 
    fontViewMode, 
    asOfDate 
  } = useSocialAuditStore();

  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('1:00');
  const [reason, setReason] = useState<string>('पुनर्निर्धारित रोस्टर');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize with a default date (asOfDate or tomorrow)
  useEffect(() => {
    if (record) {
      setNewDate('');
      setNewTime(record.timeUnicode?.replace(' बजे', '') || '1:00');
      setReason('पुनर्निर्धारित रोस्टर');
      setErrorMessage(null);
    }
  }, [record, isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !record) return null;

  // Format date helper: DD/MM/YYYY
  const formatDateHi = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  const handleConfirmReschedule = async () => {
    setErrorMessage(null);

    if (!isEditMode) {
      setErrorMessage('त्रुटि: बैठक पुनर्निर्धारित करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }

    if (!newDate) {
      setErrorMessage('कृपया नई बैठक तिथि अवश्य चुनें।');
      return;
    }

    // Must be valid YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setErrorMessage('अमान्य दिनांक प्रारूप। कृपया कैलेंडर से वैध तिथि चुनें।');
      return;
    }

    setLoading(true);
    try {
      const success = await rescheduleMeeting(record.id, newDate, newTime, reason);
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage('बैठक पुनर्निर्धारित करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      console.error('Reschedule meeting error:', err);
      setErrorMessage('त्रुटि: ' + (err.message || 'अज्ञात त्रुटि'));
    } finally {
      setLoading(false);
    }
  };

  const lastCancellation = record.cancellationDetails || 
    (record.cancellationHistory && record.cancellationHistory.length > 0 
      ? record.cancellationHistory[record.cancellationHistory.length - 1] 
      : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-blue-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-900/60 text-blue-100 border border-white/20 mb-1">
                <span>सोशल ऑडिट बैठक पुनर्निर्धारण</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                नई बैठक तिथि निर्धारित करें
              </h3>
              <p className="text-xs text-blue-100 mt-0.5 font-medium">
                ग्राम पंचायत {record.gpNameUnicode} ({record.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors z-10 disabled:opacity-50"
            title="बंद करें (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-sans">
          {/* Previous Cancellation Info */}
          {lastCancellation && (
            <div className="bg-rose-50/70 rounded-2xl p-3.5 border border-rose-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  निरस्तीकरण का पूर्व विवरण
                </span>
                <span className="text-[11px] font-mono text-rose-700 font-bold">
                  निरस्त तिथि: {formatDateHi(lastCancellation.cancelledDate)}
                </span>
              </div>
              <div className="text-xs text-slate-800">
                <span className="font-semibold text-slate-500">कारण:</span> <strong className="text-rose-900">{lastCancellation.reason}</strong>
                {lastCancellation.remarks && (
                  <span className="text-slate-600 italic block mt-0.5">"{lastCancellation.remarks}"</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-rose-200/60">
                पूर्व निर्धारित बैठक तिथि: <strong className="text-slate-700 line-through">{formatDateHi(lastCancellation.previousMeetingDate)}</strong>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* New Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                नई बैठक तिथि (New Meeting Date) <span className="text-blue-600">* (अनिवार्य)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={loading}
                  min={asOfDate || new Date().toISOString().slice(0, 10)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                सुझाव: प्रभावी रोस्टर एवं कैलेंडर के अनुसार आगामी कार्य दिवस की तिथि चुनें।
              </p>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                बैठक का समय (Meeting Time)
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                disabled={loading}
                placeholder="उदा. 1:00 या 11:00"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                पुनर्निर्धारण का कारण / विवरण
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                placeholder="उदा. पुनर्निर्धारित रोस्टर / प्रशासनिक आदेश..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Lifecycle Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">सिस्टम सुरक्षा:</strong> नई बैठक तिथि सुरक्षित करने पर यह बैठक 
              पुनर्निर्धारण लंबित से हटकर पुनः <strong>'आगामी सभाएं (Upcoming Meetings)'</strong> एवं 
              <strong> कैलेंडर</strong> में नई तिथि पर सम्मिलित हो जाएगी। पुरानी निरस्त तिथि इतिहास में सुरक्षित रहेगी।
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white transition-colors disabled:opacity-50"
          >
            रद्द करें
          </button>
          <button
            type="button"
            onClick={handleConfirmReschedule}
            disabled={loading || !newDate}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>सुरक्षित किया जा रहा है...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-white" />
                <span>नई बैठक तिथि सुरक्षित करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

