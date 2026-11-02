'use client';

import React, { useState, useEffect } from 'react';
import SocialAuditPortal from './SocialAuditPortal';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { AuditBlock, AuditStatus } from '@/types/socialAudit';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { X, Plus, Calendar, Users, Shield, MapPin, AlertCircle, Lock } from 'lucide-react';
import { validateIndianMobile, validateMeetingDateRange, detectDuplicateGP } from '@/lib/socialAuditValidation';

export default function AddRecordModal() {
  const { isAddModalOpen, closeAddModal, addRecord, records, isEditMode } = useSocialAuditStore();

  const [block, setBlock] = useState<AuditBlock>('Baghpat');
  const [gpName, setGpName] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [brpName, setBrpName] = useState('तेजपाल');
  const [brpPhone, setBrpPhone] = useState('9997202522');
  const [teamMembers, setTeamMembers] = useState('');
  const [supervisorOfficer, setSupervisorOfficer] = useState('');
  const [venue, setVenue] = useState('पंचायतधर');
  const [time, setTime] = useState('1:00 बजे');
  const [hasNSAP, setHasNSAP] = useState(true);
  const [hasMGNREGA, setHasMGNREGA] = useState(true);
  const [hasPMAYG, setHasPMAYG] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        closeAddModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, closeAddModal]);

  if (!isAddModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 0. Central Edit Mode check
    if (!isEditMode) {
      setFormError('त्रुटि: नया रिकॉर्ड जोड़ने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }

    // 1. Required name check
    if (!gpName.trim()) {
      setFormError('कृपया ग्राम पंचायत का नाम दर्ज करें।');
      return;
    }

    // 2. Duplicate GP check
    const dupCheck = detectDuplicateGP(records, gpName, block);
    if (dupCheck.isDuplicate) {
      setFormError(dupCheck.message || 'यह ग्राम पंचायत पहले से दर्ज है।');
      return;
    }

    // 3. Meeting Date range check
    const dateRangeCheck = validateMeetingDateRange(startDate || meetingDate, meetingDate);
    if (!dateRangeCheck.isValid) {
      setFormError(dateRangeCheck.error || 'अमान्य बैठक तिथि।');
      return;
    }

    // 4. Mobile number check
    if (brpPhone) {
      const mobileCheck = validateIndianMobile(brpPhone);
      if (!mobileCheck.isValid) {
        setFormError(mobileCheck.error || 'अमान्य मोबाइल नंबर।');
        return;
      }
    }

    const blockRecords = records.filter((r) => r.block === block);
    const nextSno = blockRecords.length + 1;

    const brpCombinedUni = brpPhone ? `${brpName} (${brpPhone})` : brpName;
    const brpKruti = unicodeToKrutiDev(brpCombinedUni);

    let schemeUni = 'मनरेगा';
    if (hasNSAP && hasPMAYG) {
      schemeUni = 'मनरेगा, एन0एस0ए0पी0, प्र0 आ0 ग्रा0 वर्ष 2024-25';
    } else if (hasNSAP) {
      schemeUni = 'मनरेगा एवं एन0एस0ए0पी0';
    } else if (hasPMAYG) {
      schemeUni = 'मनरेगा एवं प्र0 आ0 ग्रा0';
    }

    addRecord({
      block,
      blockHindi: block === 'Baghpat' ? 'विकास खण्ड - बागपत' : 'विकास खण्ड - बड़ौत',
      blockKrutiDev: block === 'Baghpat' ? 'fodkl [k.M & ckxir' : 'fodkl [k.M & cM+kSr',
      sno: nextSno,
      gpNameRaw: gpName,
      gpNameUnicode: gpName,
      gpNameKrutiDev: unicodeToKrutiDev(gpName),
      startDate: startDate || meetingDate,
      meetingDate,
      isAmended: false,
      supervisorOfficerRaw: supervisorOfficer,
      supervisorOfficerUnicode: supervisorOfficer,
      supervisorOfficerKrutiDev: unicodeToKrutiDev(supervisorOfficer),
      brpRaw: brpCombinedUni,
      brpName,
      brpPhone,
      brpUnicode: brpCombinedUni,
      brpKrutiDev: brpKruti,
      teamMembersRaw: teamMembers,
      teamMembersUnicode: teamMembers,
      teamMembersKrutiDev: unicodeToKrutiDev(teamMembers),
      venueRaw: venue,
      venueUnicode: venue,
      venueKrutiDev: unicodeToKrutiDev(venue),
      timeRaw: time,
      timeUnicode: time,
      timeKrutiDev: unicodeToKrutiDev(time),
      schemeRaw: schemeUni,
      schemeUnicode: schemeUni,
      schemeKrutiDev: unicodeToKrutiDev(schemeUni),
      hasNSAP,
      hasMGNREGA,
      hasPMAYG,
      status: 'scheduled',
      panchayatNirnayStatus: 'pending',
      isMappedInPanchayatNirnay: true
    });
  };

  return (
    <SocialAuditPortal>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeAddModal();
        }}
      >
        <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>नई ग्राम सभा बैठक रोस्टर जोड़ें</span>
            </h3>
            <button
              type="button"
              onClick={closeAddModal}
              className="w-9 h-9 rounded-full bg-slate-200/90 hover:bg-rose-100 hover:text-rose-700 text-slate-700 flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer border border-slate-300/60"
              title="बंद करें (Close)"
              aria-label="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {!isEditMode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>केवल पठन मोड (Read Only):</strong> संपादन मोड वर्तमान में बंद है। रोस्टर जोड़ने के लिए पहले Header से Edit Mode ON करें।
              </span>
            </div>
          )}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">विकास खण्ड</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value as AuditBlock)}
                disabled={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <option value="Baghpat">विकास खण्ड बागपत</option>
                <option value="Baraut">विकास खण्ड बड़ौत</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ग्राम पंचायत का नाम</label>
              <input
                type="text"
                required
                value={gpName}
                onChange={(e) => setGpName(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                placeholder="उदा० ग्राम पंचायत का नाम"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">प्रारम्भ तिथि</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-blue-800 font-bold mb-1">बैठक तिथि</label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-blue-50/70 border-2 border-blue-400 rounded-xl px-3 py-2 text-blue-950 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">बी०आर०पी० का नाम</label>
              <input
                type="text"
                value={brpName}
                onChange={(e) => setBrpName(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">बी०आर०पी० मो० नं०</label>
              <input
                type="text"
                value={brpPhone}
                onChange={(e) => setBrpPhone(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">सोशल ऑडिट टीम सदस्य</label>
            <input
              type="text"
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              disabled={!isEditMode}
              readOnly={!isEditMode}
              placeholder="उदा० सदस्य 1 (गाँव), सदस्य 2 (गाँव)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">पर्यवेक्षक अधिकारी</label>
            <input
              type="text"
              value={supervisorOfficer}
              onChange={(e) => setSupervisorOfficer(e.target.value)}
              disabled={!isEditMode}
              readOnly={!isEditMode}
              placeholder="उदा० अधिशासी अभियन्ता..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className={`flex items-center gap-1.5 text-slate-800 ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hasMGNREGA}
                onChange={(e) => setHasMGNREGA(e.target.checked)}
                disabled={!isEditMode}
                className="rounded accent-blue-600 disabled:cursor-not-allowed"
              />
              <span className="font-medium">मनरेगा</span>
            </label>
            <label className={`flex items-center gap-1.5 text-emerald-800 font-bold ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hasNSAP}
                onChange={(e) => setHasNSAP(e.target.checked)}
                disabled={!isEditMode}
                className="rounded accent-emerald-600 disabled:cursor-not-allowed"
              />
              <span>NSAP पेंशन योजना</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={!isEditMode}
              className={`px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                !isEditMode
                  ? 'bg-slate-400 text-slate-100 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              {!isEditMode ? (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>जोड़ना लॉक है (Read Only)</span>
                </>
              ) : (
                <span>रोस्टर जोड़ें</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </SocialAuditPortal>
  );
}
