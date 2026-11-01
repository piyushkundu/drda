'use client';

import React, { useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { AuditBlock, AuditStatus } from '@/types/socialAudit';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { X, Plus, Calendar, Users, Shield, MapPin } from 'lucide-react';

export default function AddRecordModal() {
  const { isAddModalOpen, closeAddModal, addRecord, records } = useSocialAuditStore();

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

  if (!isAddModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>नई ग्राम सभा बैठक रोस्टर जोड़ें</span>
          </h3>
          <button
            onClick={closeAddModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">विकास खण्ड</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value as AuditBlock)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500"
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
                placeholder="उदा० ग्राम पंचायत का नाम"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-blue-800 font-bold mb-1">बैठक तिथि</label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-blue-50/70 border-2 border-blue-400 rounded-xl px-3 py-2 text-blue-950 font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">बी०आर०पी० मो० नं०</label>
              <input
                type="text"
                value={brpPhone}
                onChange={(e) => setBrpPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">सोशल ऑडिट टीम सदस्य</label>
            <input
              type="text"
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              placeholder="उदा० सदस्य 1 (गाँव), सदस्य 2 (गाँव)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">पर्यवेक्षक अधिकारी</label>
            <input
              type="text"
              value={supervisorOfficer}
              onChange={(e) => setSupervisorOfficer(e.target.value)}
              placeholder="उदा० अधिशासी अभियन्ता..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-800">
              <input
                type="checkbox"
                checked={hasMGNREGA}
                onChange={(e) => setHasMGNREGA(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span className="font-medium">मनरेगा</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-800 font-bold">
              <input
                type="checkbox"
                checked={hasNSAP}
                onChange={(e) => setHasNSAP(e.target.checked)}
                className="rounded accent-emerald-600"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              रोस्टर जोड़ें
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
