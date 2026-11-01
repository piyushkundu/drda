'use client';

import React, { useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { Phone, Users, Shield, Calendar, MapPin, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function TeamRosterTab() {
  const { records, asOfDate, openEditModal } = useSocialAuditStore();

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

    records.forEach((r) => {
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
  }, [records, asOfDate]);

  // Group by Supervisory Officers
  const supervisorDirectory = useMemo(() => {
    const map = new Map<string, typeof records>();
    records.forEach((r) => {
      const s = r.supervisorOfficerUnicode.trim();
      if (!s) return;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [records]);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brpDirectory.map((brp) => (
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
                        onClick={() => openEditModal(gp)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                          gp.isAmended
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                        title={`${gp.gpNameUnicode} (${gp.blockHindi}) - ${gp.meetingDate}`}
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
      </div>

      {/* Section 2: District Level Supervisory Officers */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base md:text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>जनपद स्तरीय पर्यवेक्षक अधिकारी सूची (Supervisory Officers)</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          सोशल ऑडिट बैठकों में जनपद स्तर से नामित नोडल/पर्यवेक्षक अधिकारी
        </p>

        {/* Desktop Table (>=768px) */}
        <div className="hidden md:block overflow-x-auto max-h-80 scrollbar-thin rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
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

        {/* Dedicated Mobile Cards (<768px) */}
        <div className="md:hidden space-y-3">
          {supervisorDirectory.map(([officer, gps], i) => (
            <div
              key={officer}
              className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
                    #{i + 1}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">
                    {officer}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
                  {gps.length} बैठकें
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 font-semibold mb-1">आवंटित ग्राम पंचायतें:</div>
                <div className="flex flex-wrap gap-1">
                  {gps.map((gp) => (
                    <span
                      key={gp.id}
                      className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-800 font-medium"
                    >
                      {gp.gpNameUnicode} ({gp.meetingDate.slice(5)})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
