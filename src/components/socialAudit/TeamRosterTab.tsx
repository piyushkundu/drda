'use client';

import React, { useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { matchesBRP } from '@/lib/brpHelper';
import { Phone, Users, Shield, Calendar, MapPin, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function TeamRosterTab() {
  const { records, asOfDate, openEditModal, openGPProfile, isEditMode, selectedBRP, selectedBlock } = useSocialAuditStore();

  const effectiveRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesBRP(r, selectedBRP)) return false;
      if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;
      return true;
    });
  }, [records, selectedBRP, selectedBlock]);

  // Group by BRP
  const brpDirectory = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      isExBRP?: boolean;
      allGPs: typeof records;
      upcomingGPs: typeof records;
      completedGPs: typeof records;
    }>();

    // Known BRPs
    const knownBRPs = [
      { name: 'तेजपाल', phone: '9997202522' },
      { name: 'सुदेश पाल सिंह', phone: '9117323927' },
      { name: 'राजकुमार', phone: '9760732189' },
      { name: 'ईश्वरचन्द', phone: '9759612544' },
      { name: 'हरिकिशन (पूर्व बी०आर०पी०)', phone: '8859660315', isExBRP: true }
    ];

    knownBRPs.forEach((b) => {
      map.set(b.phone, {
        name: b.name,
        phone: b.phone,
        isExBRP: b.isExBRP,
        allGPs: [],
        upcomingGPs: [],
        completedGPs: []
      });
    });

    effectiveRecords.forEach((r) => {
      const phone = r.brpPhone || '';
      if (!map.has(phone) && r.brpName) {
        map.set(phone, {
          name: r.brpName,
          phone,
          allGPs: [],
          upcomingGPs: [],
          completedGPs: []
        });
      }
      const item = map.get(phone);
      if (item) {
        item.allGPs.push(r);
        if (r.meetingDate >= asOfDate && r.status !== 'completed') {
          item.upcomingGPs.push(r);
        } else {
          item.completedGPs.push(r);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.allGPs.length - a.allGPs.length);
  }, [effectiveRecords, asOfDate]);

  // Filter BRP Directory by selected BRP if active
  const filteredBrpDirectory = useMemo(() => {
    if (!selectedBRP || selectedBRP === 'all') return brpDirectory;
    return brpDirectory.filter((b) => {
      if (b.phone && selectedBRP.includes(b.phone)) return true;
      if (b.name && selectedBRP.includes(b.name)) return true;
      if (b.allGPs.some((r) => matchesBRP(r, selectedBRP))) return true;
      return false;
    });
  }, [brpDirectory, selectedBRP]);

  // Group by Supervisory Officers
  const supervisorDirectory = useMemo(() => {
    const map = new Map<string, typeof effectiveRecords>();
    effectiveRecords.forEach((r) => {
      const s = r.supervisorOfficerUnicode.trim();
      if (!s) return;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [effectiveRecords]);

  return (
    <div className="space-y-6">
      {/* Section 1: Block Resource Persons (BRPs) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span>ब्लॉक रिसोर्स पर्सन (BRP) रोस्टर एवं संपर्क विवरण</span>
            </h3>
            <p className="text-xs text-slate-600">
              सोशल ऑडिट का संचालन करने वाले मुख्य बी०आर०पी० एवं उनकी आवंटित ग्राम पंचायतें
            </p>
          </div>
        </div>

        {filteredBrpDirectory.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-500">
            चयनित बी०आर०पी० के लिए कोई रिकॉर्ड उपलब्ध नहीं है।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrpDirectory.map((brp) => (
            <div
              key={brp.phone || brp.name}
              className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                brp.isExBRP
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-black text-base">
                    {brp.name.charAt(0)}
                  </div>

                  {brp.isExBRP ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                      कार्यमुक्त / स्थानांतरित
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      सक्रिय BRP
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">{brp.name}</h4>
                {brp.phone && (
                  <a
                    href={`tel:${brp.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-mono mt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{brp.phone}</span>
                  </a>
                )}

                {/* KPI numbers */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-medium">कुल सभाएं</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{brp.allGPs.length}</div>
                  </div>
                  <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                    <div className="text-[10px] text-blue-700 font-medium">आगामी</div>
                    <div className="text-base font-bold text-blue-800 mt-0.5">{brp.upcomingGPs.length}</div>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 font-medium">सम्पन्न</div>
                    <div className="text-base font-bold text-emerald-800 mt-0.5">{brp.completedGPs.length}</div>
                  </div>
                </div>

                {/* Assigned GPs preview */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">आवंटित ग्राम पंचायतें:</div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-none">
                    {brp.allGPs.map((gp) => (
                      <span
                        key={gp.id}
                        onClick={() => (isEditMode ? openEditModal(gp) : openGPProfile(gp))}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                          gp.isAmended
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                        title={
                          isEditMode 
                            ? `${gp.gpNameUnicode} (${gp.blockHindi}) - विवरण संपादित करें` 
                            : `${gp.gpNameUnicode} (${gp.blockHindi}) - प्रोफाइल विवरण देखें`
                        }
                      >
                        {gp.gpNameUnicode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Section 2: District Level Supervisory Officers */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <h3 className="text-base md:text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>जनपद स्तरीय पर्यवेक्षक अधिकारी सूची (Supervisory Officers)</span>
          </h3>
          <p className="text-xs text-slate-600">
            सोशल ऑडिट बैठकों में जनपद स्तर से नामित नोडल/पर्यवेक्षक अधिकारी
          </p>
        </div>

        {/* Master Supervisory Table (Desktop, Tablet & Mobile) */}
        <div className="w-full space-y-2">
          <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>👉 तालिका को बाएं-दाएं स्वाइप करें</span>
            <span className="font-mono text-slate-500">कुल {supervisorDirectory.length} अधिकारी</span>
          </div>
          <div className="overflow-x-auto max-h-80 scrollbar-thin rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs min-w-[550px]">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">क्र०</th>
                  <th className="py-2.5 px-3">पर्यवेक्षक अधिकारी का पदनाम / विभाग</th>
                  <th className="py-2.5 px-3 text-center">आवंटित बैठकें</th>
                  <th className="py-2.5 px-3">ग्राम पंचायतें</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {supervisorDirectory.map(([officer, gps], i) => (
                  <tr key={officer} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{officer}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-purple-700 font-mono">
                      {gps.length}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xl">
                        {gps.map((gp) => (
                          <span
                            key={gp.id}
                            className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                          >
                            {gp.gpNameUnicode} ({gp.meetingDate.slice(5)})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
