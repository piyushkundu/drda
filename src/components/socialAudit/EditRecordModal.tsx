'use client';

import React, { useState, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord, AuditStatus, PanchayatNirnayStatus } from '@/types/socialAudit';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { validateIndianMobile, validateMeetingDateRange, detectDuplicateGP } from '@/lib/socialAuditValidation';
import { X, Save, Trash2, AlertCircle, Calendar, Phone, Users, Shield, MapPin, Clock, Smartphone, CheckCircle2, XCircle, Lock } from 'lucide-react';

export default function EditRecordModal() {
  const { 
    selectedRecordForEdit, 
    closeEditModal, 
    updateRecord, 
    deleteRecord, 
    records, 
    isEditMode, 
    setHasUnsavedChanges 
  } = useSocialAuditStore();

  const [gpName, setGpName] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [brpName, setBrpName] = useState('');
  const [brpPhone, setBrpPhone] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [supervisorOfficer, setSupervisorOfficer] = useState('');
  const [venue, setVenue] = useState('पंचायतधर');
  const [time, setTime] = useState('1:00 बजे');
  const [hasNSAP, setHasNSAP] = useState(false);
  const [hasMGNREGA, setHasMGNREGA] = useState(true);
  const [hasPMAYG, setHasPMAYG] = useState(false);
  const [status, setStatus] = useState<AuditStatus>('scheduled');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [nirnayStatus, setNirnayStatus] = useState<PanchayatNirnayStatus>('pending');
  const [nirnayCapturedDate, setNirnayCapturedDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRecordForEdit) {
      setGpName(selectedRecordForEdit.gpNameUnicode);
      setMeetingDate(selectedRecordForEdit.meetingDate);
      setStartDate(selectedRecordForEdit.startDate);
      setBrpName(selectedRecordForEdit.brpName || selectedRecordForEdit.brpUnicode);
      setBrpPhone(selectedRecordForEdit.brpPhone || '');
      setTeamMembers(selectedRecordForEdit.teamMembersUnicode);
      setSupervisorOfficer(selectedRecordForEdit.supervisorOfficerUnicode);
      setVenue(selectedRecordForEdit.venueUnicode || 'पंचायतधर');
      setTime(selectedRecordForEdit.timeUnicode || '1:00 बजे');
      setHasNSAP(selectedRecordForEdit.hasNSAP);
      setHasMGNREGA(selectedRecordForEdit.hasMGNREGA);
      setHasPMAYG(selectedRecordForEdit.hasPMAYG);
      setStatus(selectedRecordForEdit.status);
      setAmendmentReason(selectedRecordForEdit.amendmentDetails?.reason || '');
      setNirnayStatus(selectedRecordForEdit.panchayatNirnayStatus || 'pending');
      setNirnayCapturedDate(selectedRecordForEdit.panchayatNirnayCapturedDate || '');
    }
  }, [selectedRecordForEdit]);

  if (!selectedRecordForEdit) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 0. Central Edit Mode Check
    if (!isEditMode) {
      setFormError('त्रुटि: बदलाव सुरक्षित करने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }

    // 1. Required name check
    if (!gpName.trim()) {
      setFormError('कृपया ग्राम पंचायत का नाम दर्ज करें।');
      return;
    }

    // 2. Duplicate GP check
    const dupCheck = detectDuplicateGP(records, gpName, selectedRecordForEdit.block, selectedRecordForEdit.id);
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

    const isDateChanged = meetingDate !== selectedRecordForEdit.meetingDate;
    const isAmended = selectedRecordForEdit.isAmended || isDateChanged;

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

    const updates: Partial<SocialAuditRecord> = {
      gpNameUnicode: gpName,
      gpNameKrutiDev: unicodeToKrutiDev(gpName),
      meetingDate,
      startDate,
      brpName,
      brpPhone,
      brpUnicode: brpCombinedUni,
      brpKrutiDev: brpKruti,
      teamMembersUnicode: teamMembers,
      teamMembersKrutiDev: unicodeToKrutiDev(teamMembers),
      supervisorOfficerUnicode: supervisorOfficer,
      supervisorOfficerKrutiDev: unicodeToKrutiDev(supervisorOfficer),
      venueUnicode: venue,
      venueKrutiDev: unicodeToKrutiDev(venue),
      timeUnicode: time,
      timeKrutiDev: unicodeToKrutiDev(time),
      hasNSAP,
      hasMGNREGA,
      hasPMAYG,
      schemeUnicode: schemeUni,
      schemeKrutiDev: unicodeToKrutiDev(schemeUni),
      status: isDateChanged ? 'amended' : status,
      isAmended,
      originalMeetingDate: isAmended ? (selectedRecordForEdit.originalMeetingDate || selectedRecordForEdit.meetingDate) : undefined,
      amendmentDetails: isAmended ? {
        originalDate: selectedRecordForEdit.originalMeetingDate || selectedRecordForEdit.meetingDate,
        modifiedDate: meetingDate,
        reason: amendmentReason || 'बी०आर०पी० परिवर्तन / संशोधित रोस्टर'
      } : undefined,
      panchayatNirnayStatus: nirnayStatus,
      panchayatNirnayCapturedDate: nirnayStatus === 'captured' ? (nirnayCapturedDate || meetingDate) : undefined
    };

    updateRecord(selectedRecordForEdit.id, updates);
    setHasUnsavedChanges(false);
  };

  const handleDelete = () => {
    if (!isEditMode) {
      alert('त्रुटि: रिकॉर्ड हटाने के लिए कृपया पहले Header से Edit Mode ON करें।');
      return;
    }
    if (confirm(`क्या आप ग्राम पंचायत ${selectedRecordForEdit.gpNameUnicode} का रोस्टर हटाना चाहते हैं?`)) {
      deleteRecord(selectedRecordForEdit.id);
      setHasUnsavedChanges(false);
    }
  };

  // Quick BRP picker options
  const brpOptions = [
    { name: 'तेजपाल', phone: '9997202522' },
    { name: 'सुदेश पाल सिंह', phone: '9117323927' },
    { name: 'राजकुमार', phone: '9760732189' },
    { name: 'ईश्वरचन्द', phone: '9759612544' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              #{selectedRecordForEdit.sno}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                सोशल ऑडिट रोस्टर संशोधन: {selectedRecordForEdit.gpNameUnicode}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedRecordForEdit.blockHindi} (जनपद बागपत)
              </p>
            </div>
          </div>
          <button
            onClick={closeEditModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {!isEditMode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>केवल पठन मोड (Read Only):</strong> संपादन मोड वर्तमान में बंद है। संशोधन सुरक्षित करने के लिए पहले Header से Edit Mode ON करें।
              </span>
            </div>
          )}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {/* GP Name & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ग्राम पंचायत का नाम</label>
              <input
                type="text"
                value={gpName}
                onChange={(e) => setGpName(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">सोशल ऑडिट प्रारम्भ तिथि</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-amber-800 font-bold mb-1">
                बैठक की तिथि (Meeting Date)
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                required
                className="w-full bg-amber-50/80 border-2 border-amber-400 rounded-xl px-3 py-2 text-amber-950 font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* BRP Quick Selection */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-800 font-semibold">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>आवंटित बी०आर०पी० (BRP)</span>
              </span>
              <span className="text-[10px] text-slate-500">त्वरित चयन करें:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {brpOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.phone}
                  disabled={!isEditMode}
                  onClick={() => {
                    setBrpName(opt.name);
                    setBrpPhone(opt.phone);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    !isEditMode
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : brpName.includes(opt.name)
                      ? 'bg-amber-100 border-2 border-amber-500 text-amber-950 font-bold shadow-sm cursor-pointer'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <div className="truncate font-semibold">{opt.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{opt.phone}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">BRP का नाम</label>
                <input
                  type="text"
                  value={brpName}
                  onChange={(e) => setBrpName(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">BRP मोबाइल नं०</label>
                <input
                  type="text"
                  value={brpPhone}
                  onChange={(e) => setBrpPhone(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              सोशल ऑडिट टीम सदस्यों का नाम (सर्वश्री/श्रीमती)
            </label>
            <textarea
              rows={2}
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="उदा० सुधीर कुमार (नेथला) बबली शर्मा (नेथला)..."
            />
          </div>

          {/* Supervisory Officer */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              जनपद स्तरीय पर्यवेक्षक अधिकारी
            </label>
            <input
              type="text"
              value={supervisorOfficer}
              onChange={(e) => setSupervisorOfficer(e.target.value)}
              disabled={!isEditMode}
              readOnly={!isEditMode}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              placeholder="उदा० अधिशासी अभियन्ता जल निगम बागपत।"
            />
          </div>

          {/* Venue & Time & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">स्थान</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">समय</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">वर्तमान स्थिति</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AuditStatus)}
                disabled={!isEditMode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <option value="scheduled">प्रस्तावित (Scheduled)</option>
                <option value="completed">सम्पन्न (Completed)</option>
                <option value="amended">संशोधित (Amended)</option>
                <option value="postponed">स्थगित (Postponed)</option>
              </select>
            </div>
          </div>

          {/* Scheme Checkboxes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
            <span className="text-slate-600 font-semibold">ऑडिट योजनाएं:</span>
            <label className={`flex items-center gap-1.5 text-slate-800 ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hasMGNREGA}
                onChange={(e) => setHasMGNREGA(e.target.checked)}
                disabled={!isEditMode}
                className="rounded accent-blue-600 disabled:cursor-not-allowed"
              />
              <span className="font-medium">मनरेगा (MGNREGA)</span>
            </label>

            <label className={`flex items-center gap-1.5 text-emerald-800 font-bold ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hasNSAP}
                onChange={(e) => setHasNSAP(e.target.checked)}
                disabled={!isEditMode}
                className="rounded accent-emerald-600 disabled:cursor-not-allowed"
              />
              <span>NSAP पेंशन (वृद्धावस्था/पारिवारिक)</span>
            </label>

            <label className={`flex items-center gap-1.5 text-indigo-800 font-medium ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hasPMAYG}
                onChange={(e) => setHasPMAYG(e.target.checked)}
                disabled={!isEditMode}
                className="rounded accent-indigo-600 disabled:cursor-not-allowed"
              />
              <span>प्र० आ० ग्रा० (PMAY-G)</span>
            </label>
          </div>

          {/* Panchayat Nirnay App Status (R 9.6.2) */}
          <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-700" />
                <span className="text-sm font-bold text-purple-900">पंचायत निर्णय ऐप (R 9.6.2) स्थिति</span>
              </div>
              <span className="text-xs text-purple-700 font-semibold font-mono">पोर्टल सत्यापन</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!isEditMode}
                onClick={() => setNirnayStatus('captured')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  !isEditMode
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200'
                    : nirnayStatus === 'captured'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-300 cursor-pointer'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>अपलोड (Captured)</span>
              </button>

              <button
                type="button"
                disabled={!isEditMode}
                onClick={() => setNirnayStatus('pending')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  !isEditMode
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200'
                    : nirnayStatus === 'pending'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-300 cursor-pointer'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>लंबित (Pending)</span>
              </button>

              <button
                type="button"
                disabled={!isEditMode}
                onClick={() => setNirnayStatus('not_captured')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  !isEditMode
                    ? 'opacity-60 cursor-not-allowed bg-slate-50 text-slate-500 border-slate-200'
                    : nirnayStatus === 'not_captured'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-300 cursor-pointer'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-rose-400 hover:bg-rose-50 cursor-pointer'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>नहीं हुआ (No)</span>
              </button>
            </div>

            {nirnayStatus === 'captured' && (
              <div className="mt-2.5 pt-2.5 border-t border-purple-200 flex items-center gap-2">
                <span className="text-xs text-purple-900 font-medium">अपलोड/सत्यापन तिथि:</span>
                <input
                  type="date"
                  value={nirnayCapturedDate || meetingDate}
                  onChange={(e) => setNirnayCapturedDate(e.target.value)}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="bg-white border border-purple-300 text-slate-900 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed font-mono"
                />
              </div>
            )}
          </div>

          {/* Amendment Reason */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              संशोधन का कारण (टिप्पणी / Reason for Amendment)
            </label>
            <input
              type="text"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              disabled={!isEditMode}
              readOnly={!isEditMode}
              placeholder="उदा० बी०आर०पी० कार्यमुक्त होने एवं अन्य प्रशासनिक कारणों से संशोधित"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isEditMode}
              className={`flex items-center gap-1 font-semibold px-3 py-2 rounded-xl transition-colors ${
                !isEditMode 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>हटाएं</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  closeEditModal();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                disabled={!isEditMode}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold transition-all ${
                  !isEditMode
                    ? 'bg-slate-400 text-slate-100 cursor-not-allowed opacity-60'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                }`}
              >
                {!isEditMode ? (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>सहेजना लॉक है (Read Only)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>संशोधन सहेजें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
