'use client';

import React, { useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord } from '@/types/socialAudit';
import { validateMeetingCompletionDate } from '@/lib/socialAuditAuth';
import { 
  CheckCircle2, AlertTriangle, Calendar, User, Phone, 
  Building2, X, ShieldAlert, Clock, Sparkles, Loader2 
} from 'lucide-react';

interface MeetingCompletionModalProps {
  record: SocialAuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MeetingCompletionModal({
  record,
  isOpen,
  onClose,
  onSuccess
}: MeetingCompletionModalProps) {
  const { 
    asOfDate, 
    markCompleted, 
    currentUser, 
    isEditMode, 
    fontViewMode 
  } = useSocialAuditStore();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Perform client-side preliminary validation
  const validation = validateMeetingCompletionDate(record.meetingDate, asOfDate);

  const handleConfirm = async () => {
    setErrorMessage(null);

    // 1. Check Edit Mode
    if (!isEditMode) {
      setErrorMessage('त्रुटि: बैठक सम्पन्न करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }

    // 2. Client-side date check
    if (!validation.canComplete) {
      setErrorMessage(validation.errorMessage || 'निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।');
      return;
    }

    setLoading(true);

    try {
      // 3. Server-side authoritative date & authorization check
      const res = await fetch('/api/social-audit/complete-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: record.id,
          meetingDate: record.meetingDate,
          desiredStatus: 'completed',
          userRole: currentUser?.role || 'ddo',
          gpName: record.gpNameUnicode
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'सर्वर पर बैठक सत्यापन अस्वीकृत हुआ।');
        setLoading(false);
        return;
      }

      // 4. Update store and Firestore
      markCompleted(record.id, true);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Meeting completion error:', err);
      setErrorMessage('सर्वर से संपर्क करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-black tracking-tight leading-none">
                बैठक सम्पन्न करें?
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium mt-1">
                सोशल ऑडिट बैठक सम्पन्न करने हेतु आधिकारिक पुष्टि
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Main confirmation alert message */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-semibold">
            क्या आप सुनिश्चित हैं कि इस ग्राम पंचायत की सोशल ऑडिट बैठक सम्पन्न हो चुकी है?
          </div>

          {/* Verification warning if date has not arrived */}
          {!validation.canComplete && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-rose-950 mb-0.5">तिथि आधारित सुरक्षा लॉक:</strong>
                <span>{validation.errorMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message if API fails */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Details Table */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
            
            {/* GP Name */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                ग्राम पंचायत:
              </span>
              <span className="font-black text-slate-900 text-sm">
                {record.gpNameUnicode}
                {fontViewMode === 'dual' && record.gpNameKrutiDev && (
                  <span className="block text-[11px] text-amber-800 font-mono" style={{ fontFamily: "'Kruti Dev 010', sans-serif" }}>
                    {record.gpNameKrutiDev}
                  </span>
                )}
              </span>
            </div>

            {/* Development Block */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-bold">विकास खण्ड:</span>
              <span className="font-bold text-slate-800">
                {record.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}
              </span>
            </div>

            {/* Scheduled Meeting Date */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                निर्धारित बैठक तिथि:
              </span>
              <span className="font-black text-slate-900 font-mono text-xs">
                {formatDateHi(record.meetingDate)}
              </span>
            </div>

            {/* Current Authoritative Date */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                वर्तमान संदर्भ तिथि (IST):
              </span>
              <span className="font-black text-emerald-800 font-mono text-xs">
                {formatDateHi(asOfDate)}
              </span>
            </div>

            {/* Assigned BRP */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" />
                आवंटित BRP:
              </span>
              <span className="font-bold text-slate-800 text-right">
                {record.brpName || record.brpUnicode}
                {record.brpPhone && (
                  <span className="block text-[10px] text-slate-500 font-mono">
                    {record.brpPhone}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Edit Mode Warning if OFF */}
          {!isEditMode && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>चेतावनी:</strong> संपादन मोड (Edit Mode) वर्तमान में OFF है। कृपया शीर्ष हेडर से Edit Mode ON करें।
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
          >
            रद्द करें (Cancel)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !isEditMode || !validation.canComplete}
            className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              !isEditMode || !validation.canComplete
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/30'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>सत्यापन जारी...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>सम्पन्न पुष्टि करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

