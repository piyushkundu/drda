'use client';

import React, { useState, useEffect } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { SocialAuditRecord, AuditStatus } from '@/types/socialAudit';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { X, Save, Trash2, AlertCircle, Calendar, Phone, Users, Shield, MapPin, Clock } from 'lucide-react';

export default function EditRecordModal() {
  const { selectedRecordForEdit, closeEditModal, updateRecord, deleteRecord } = useSocialAuditStore();

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
    }
  }, [selectedRecordForEdit]);

  if (!selectedRecordForEdit) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

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
      } : undefined
    };

    updateRecord(selectedRecordForEdit.id, updates);
  };

  const handleDelete = () => {
    if (confirm(`क्या आप ग्राम पंचायत ${selectedRecordForEdit.gpNameUnicode} का रोस्टर हटाना चाहते हैं?`)) {
      deleteRecord(selectedRecordForEdit.id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              #{selectedRecordForEdit.sno}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                सोशल ऑडिट रोस्टर संशोधन: {selectedRecordForEdit.gpNameUnicode}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedRecordForEdit.blockHindi} (District Baghpat)
              </p>
            </div>
          </div>
          <button
            onClick={closeEditModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* GP Name & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ग्राम पंचायत का नाम</label>
              <input
                type="text"
                value={gpName}
                onChange={(e) => setGpName(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">सोशल ऑडिट प्रारम्भ तिथि</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-amber-300 font-bold mb-1">
                बैठक की तिथि (Meeting Date)
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
                className="w-full bg-slate-800 border-2 border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 font-bold outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* BRP Quick Selection */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>आवंटित बी०आर०पी० (BRP)</span>
              </span>
              <span className="text-[10px] text-slate-400">त्वरित चयन करें:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {brpOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.phone}
                  onClick={() => {
                    setBrpName(opt.name);
                    setBrpPhone(opt.phone);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    brpName.includes(opt.name)
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="truncate">{opt.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{opt.phone}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">BRP का नाम</label>
                <input
                  type="text"
                  value={brpName}
                  onChange={(e) => setBrpName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">BRP मोबाइल नं०</label>
                <input
                  type="text"
                  value={brpPhone}
                  onChange={(e) => setBrpPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              सोशल ऑडिट टीम सदस्यों का नाम (सर्वश्री/श्रीमती)
            </label>
            <textarea
              rows={2}
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="उदा० सुधीर कुमार (नेथला) बबली शर्मा (नेथला)..."
            />
          </div>

          {/* Supervisory Officer */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              जनपद स्तरीय पर्यवेक्षक अधिकारी
            </label>
            <input
              type="text"
              value={supervisorOfficer}
              onChange={(e) => setSupervisorOfficer(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="उदा० अधिशासी अभियन्ता जल निगम बागपत।"
            />
          </div>

          {/* Venue & Time & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">स्थान</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">समय</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">वर्तमान स्थिति</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AuditStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="scheduled">प्रस्तावित (Scheduled)</option>
                <option value="completed">सम्पन्न (Completed)</option>
                <option value="amended">संशोधित (Amended)</option>
                <option value="postponed">स्थगित (Postponed)</option>
              </select>
            </div>
          </div>

          {/* Scheme Checkboxes */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center gap-4">
            <span className="text-slate-400 font-semibold">ऑडिट योजनाएं:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={hasMGNREGA}
                onChange={(e) => setHasMGNREGA(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>मनरेगा (MGNREGA)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300 font-bold">
              <input
                type="checkbox"
                checked={hasNSAP}
                onChange={(e) => setHasNSAP(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>NSAP पेंशन (वृद्धावस्था/पारिवारिक)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-purple-300">
              <input
                type="checkbox"
                checked={hasPMAYG}
                onChange={(e) => setHasPMAYG(e.target.checked)}
                className="rounded accent-purple-600"
              />
              <span>प्र० आ० ग्रा० (PMAY-G)</span>
            </label>
          </div>

          {/* Amendment Reason */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              संशोधन का कारण (टिप्पणी / Reason for Amendment)
            </label>
            <input
              type="text"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="उदा० बी०आर०पी० कार्यमुक्त होने एवं अन्य प्रशासनिक कारणों से संशोधित"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>हटाएं</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>संशोधन सहेजें</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
