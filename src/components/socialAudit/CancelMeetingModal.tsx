'use client';

import React, { useState, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord } from '@/types/socialAudit';
import { renderAuditText } from '@/lib/renderAuditText';
import { 
  X, AlertTriangle, Calendar, MapPin, User, Users, 
  ShieldAlert, Clock, CheckCircle2, Loader2, Ban
} from 'lucide-react';

interface CancelMeetingModalProps {
  record: SocialAuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CANCELLATION_REASONS = [
  'अपरिहार्य कारण',
  'संबंधित अधिकारी की अनुपलब्धता',
  'ग्राम पंचायत स्तर पर समस्या',
  'प्रशासनिक कारण',
  'अन्य कारण'
];

export default function CancelMeetingModal({
  record,
  isOpen,
  onClose,
  onSuccess
}: CancelMeetingModalProps) {
  const { 
    cancelMeeting, 
    isEditMode, 
    fontViewMode, 
    currentUser 
  } = useSocialAuditStore();

  const [reason, setReason] = useState<string>('अपरिहार्य कारण');
  const [remarks, setRemarks] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when opened with a record
  useEffect(() => {
    if (record) {
      setReason('अपरिहार्य कारण');
      setRemarks('');
      setIsConfirmed(false);
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

  const handleConfirmCancel = async () => {
    setErrorMessage(null);

    if (!isEditMode) {
      setErrorMessage('त्रुटि: बैठक निरस्त करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('कृपया बैठक निरस्त करने का कारण अवश्य चुनें।');
      return;
    }

    if (!isConfirmed) {
      setErrorMessage('कृपया निरस्तीकरण की पुष्टि करने हेतु चेकबॉक्स पर टिक करें।');
      return;
    }

    setLoading(true);
    try {
      const success = await cancelMeeting(record.id, reason, remarks);
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage('बैठक निरस्त करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      console.error('Cancel meeting error:', err);
      setErrorMessage('बैठक निरस्त करने में त्रुटि आई: ' + (err.message || 'अज्ञात त्रुटि'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Red Theme for Cancellation) */}
        <div className="bg-gradient-to-r from-rose-700 via-red-700 to-rose-800 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Ban className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-900/60 text-rose-100 border border-white/20 mb-1">
                <span>सोशल ऑडिट बैठक निरस्तीकरण</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                बैठक निरस्त करें (Cancel Meeting)
              </h3>
              <p className="text-xs text-rose-100 mt-0.5 font-medium">
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
          {/* Meeting Summary Card */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/80 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">वर्तमान बैठक विवरण</span>
              <span className="text-xs font-mono font-bold text-rose-800">क्र० सं० {record.sno}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">ग्राम पंचायत:</span>
                <strong className="text-slate-900 font-bold text-sm">
                  {renderAuditText(fontViewMode, record.gpNameUnicode, record.gpNameKrutiDev)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">विकास खण्ड:</span>
                <strong className="text-slate-900 font-bold">
                  {record.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">वर्तमान बैठक तिथि:</span>
                <strong className="text-rose-800 font-bold font-mono text-sm">
                  {formatDateHi(record.meetingDate)} ({renderTextTime(record)})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">आवंटित बी०आर०पी०:</span>
                <strong className="text-slate-900 font-bold">
                  {record.brpName || record.brpUnicode} {record.brpPhone ? `(${record.brpPhone})` : ''}
                </strong>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/60 text-[11px]">
              <span className="text-slate-500 block text-[10px] font-semibold">टीम सदस्य (VRPs):</span>
              <span className="text-slate-800 font-medium line-clamp-2">
                {renderAuditText(fontViewMode, record.teamMembersUnicode, record.teamMembersKrutiDev)}
              </span>
            </div>
          </div>

          {/* Cancellation Reason Dropdown (Required) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              बैठक निरस्त करने का कारण <span className="text-rose-600">* (अनिवार्य)</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all disabled:opacity-50"
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Remarks Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={loading}
              placeholder="निरस्तीकरण से संबंधित कोई विशेष टिप्पणी अथवा सक्षम अधिकारी का आदेश क्रमांक..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all disabled:opacity-50 resize-none"
            />
          </div>

          {/* Important Warning Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">प्रशासनिक नियम:</strong> बैठक निरस्त होने के बाद सक्रिय आगामी सभाओं से हटकर 
              <strong> 'पुनर्निर्धारण लंबित (Reschedule Pending)'</strong> में चली जाएगी। यह बैठक कभी भी MIS Pending में नहीं जाएगी 
              जब तक कि इसे नई तिथि पर पुनः आयोजित कर सम्पन्न न किया जाए।
            </div>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 leading-snug">
              क्या आप वास्तव में इस बैठक को निरस्त करना चाहते हैं? निरस्त बैठक पुनर्निर्धारण के लिए Pending में चली जाएगी।
            </span>
          </label>

          {/* Error Message Display */}
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
            वापस जाएं (रद्द करें)
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={loading || !isConfirmed}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>निरस्त किया जा रहा है...</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 text-white" />
                <span>हाँ, बैठक निरस्त करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderTextTime(record: SocialAuditRecord) {
  return record.timeUnicode || record.timeKrutiDev || '1:00 बजे';
}

