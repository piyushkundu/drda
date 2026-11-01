'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { 
  Search, X, Building2, User, Calendar, Smartphone, 
  FileSpreadsheet, Users, ChevronRight, CornerDownLeft,
  ArrowRight, ShieldCheck, CheckCircle2, Clock
} from 'lucide-react';
import { SocialAuditRecord } from '@/types/socialAudit';

interface SearchResultItem {
  id: string;
  category: 'gp' | 'brp' | 'meeting' | 'nirnay' | 'mis' | 'nsap';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  record?: SocialAuditRecord;
  action: () => void;
}

export default function GlobalSearchModal() {
  const { 
    records, 
    nsapRecords, 
    isGlobalSearchOpen, 
    setIsGlobalSearchOpen,
    openGPProfile,
    setSelectedBRP,
    setActiveTab,
    asOfDate
  } = useSocialAuditStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to toggle global search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGlobalSearchOpen]);

  // Compute search results across all modules
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Gram Panchayats (GP)
    records.forEach((r) => {
      const nameU = (r.gpNameUnicode || '').toLowerCase();
      const nameK = (r.gpNameKrutiDev || '').toLowerCase();
      const block = (r.blockHindi || r.block || '').toLowerCase();
      const sno = String(r.sno || '');

      if (nameU.includes(q) || nameK.includes(q) || block.includes(q) || sno === q) {
        items.push({
          id: `gp-${r.id}`,
          category: 'gp',
          categoryLabel: 'ग्राम पंचायत',
          title: r.gpNameUnicode,
          subtitle: `${r.block === 'Baghpat' ? 'विकास खण्ड बागपत' : 'विकास खण्ड बड़ौत'} • क्र० सं० ${r.sno || '-'} • BRP: ${r.brpName}`,
          badge: r.status === 'completed' || r.meetingDate <= asOfDate ? 'सम्पन्न' : 'प्रस्तावित',
          badgeColor: r.status === 'completed' || r.meetingDate <= asOfDate 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-blue-50 text-blue-800 border-blue-200',
          record: r,
          action: () => {
            setIsGlobalSearchOpen(false);
            openGPProfile(r);
          }
        });
      }
    });

    // 2. BRPs
    const uniqueBRPs = new Map<string, { name: string; phone: string; count: number }>();
    records.forEach((r) => {
      if (r.brpName && r.brpPhone) {
        const key = r.brpPhone;
        const existing = uniqueBRPs.get(key) || { name: r.brpName, phone: r.brpPhone, count: 0 };
        existing.count += 1;
        uniqueBRPs.set(key, existing);
      }
    });

    uniqueBRPs.forEach((brp) => {
      if (brp.name.toLowerCase().includes(q) || brp.phone.includes(q)) {
        items.push({
          id: `brp-${brp.phone}`,
          category: 'brp',
          categoryLabel: 'बी०आर०पी० अधिकारी',
          title: brp.name,
          subtitle: `मो०: ${brp.phone} • कुल आवंटित: ${brp.count} ग्राम पंचायतें`,
          badge: `${brp.count} GP`,
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          action: () => {
            setIsGlobalSearchOpen(false);
            setSelectedBRP(brp.phone);
            setActiveTab('roster');
          }
        });
      }
    });

    // 3. Meetings (by date)
    if (q.includes('2026') || q.includes('/') || q.includes('-') || q.includes('बैठक')) {
      records.forEach((r) => {
        if (r.meetingDate.includes(q) || (r.startDate && r.startDate.includes(q))) {
          items.push({
            id: `meeting-${r.id}`,
            category: 'meeting',
            categoryLabel: 'सोशल ऑडिट बैठक',
            title: `${r.gpNameUnicode} - बैठक दिनांक ${r.meetingDate}`,
            subtitle: `${r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'} • BRP: ${r.brpName} • स्थल: ${r.venueUnicode || 'पंचायत भवन'}`,
            badge: r.meetingDate,
            badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
            record: r,
            action: () => {
              setIsGlobalSearchOpen(false);
              openGPProfile(r);
            }
          });
        }
      });
    }

    // 4. Panchayat Nirnay App entries
    if (q.includes('निर्णय') || q.includes('nirnay') || q.includes('अपलोड') || q.includes('captured')) {
      records.filter(r => r.panchayatNirnayStatus === 'captured').slice(0, 10).forEach(r => {
        items.push({
          id: `nirnay-${r.id}`,
          category: 'nirnay',
          categoryLabel: 'पंचायत निर्णय ऐप',
          title: `${r.gpNameUnicode} - निर्णय अपलोड सत्यापित`,
          subtitle: `अपलोड दिनांक: ${r.panchayatNirnayCapturedDate || r.meetingDate} • ब्लॉक: ${r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}`,
          badge: 'R 9.6.2 अपलोड',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
          record: r,
          action: () => {
            setIsGlobalSearchOpen(false);
            openGPProfile(r);
          }
        });
      });
    }

    // 5. MIS Feeding entries
    if (q.includes('mis') || q.includes('फीड') || q.includes('पोर्टल')) {
      records.filter(r => r.misStatus === 'fed').slice(0, 10).forEach(r => {
        items.push({
          id: `mis-${r.id}`,
          category: 'mis',
          categoryLabel: 'MIS पोर्टल फीडिंग',
          title: `${r.gpNameUnicode} - MIS फीडेड (पूर्ण)`,
          subtitle: `फीडिंग दिनांक: ${r.misFedDate || r.meetingDate} • ब्लॉक: ${r.block === 'Baghpat' ? 'बागपत' : 'बड़ौत'}`,
          badge: 'R 9.1.3 फीडेड',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          record: r,
          action: () => {
            setIsGlobalSearchOpen(false);
            openGPProfile(r);
          }
        });
      });
    }

    // 6. NSAP Beneficiaries
    nsapRecords.forEach((gp) => {
      const gpName = gp.gpNameUnicode;
      (gp.beneficiaries || []).forEach((b) => {
        const bName = (b.nameUnicode || '').toLowerCase();
        const bReg = (b.registrationId || '').toLowerCase();
        if (bName.includes(q) || bReg.includes(q)) {
          const matchedGP = records.find(r => r.id === gp.id || r.gpNameUnicode === gp.gpNameUnicode);
          items.push({
            id: `nsap-${b.id}`,
            category: 'nsap',
            categoryLabel: 'NSAP पेंशन लाभार्थी',
            title: b.nameUnicode,
            subtitle: `पंजीकरण: ${b.registrationId} • ग्राम पंचायत: ${gpName} • श्रेणी: ${b.categoryHindi || b.category}`,
            badge: b.categoryHindi || b.category,
            badgeColor: b.category === 'deceased' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-purple-50 text-purple-800 border-purple-200',
            record: matchedGP,
            action: () => {
              setIsGlobalSearchOpen(false);
              if (matchedGP) {
                openGPProfile(matchedGP);
              } else {
                setActiveTab('nsap-data');
              }
            }
          });
        }
      });
    });

    return items.slice(0, 30);
  }, [query, records, nsapRecords, asOfDate, setIsGlobalSearchOpen, openGPProfile, setSelectedBRP, setActiveTab]);

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
    }
  };

  if (!isGlobalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => setIsGlobalSearchOpen(false)}
      />

      {/* Spotlight Search Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/80">
          <Search className="w-5 h-5 text-blue-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ग्राम पंचायत, BRP, बैठक तिथि, निर्णय, MIS या NSAP लाभार्थी खोजें..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 font-semibold outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              title="साफ करें"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300/50">
              ESC
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin max-h-[60vh]">
          {query.trim() === '' ? (
            /* Suggestions / Quick Guide */
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
                <Search className="w-6 h-6 text-blue-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                सोशल ऑडिट बागपत एकीकृत खोज (Global Search)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                पूरे पोर्टल में किसी भी <strong>ग्राम पंचायत</strong>, <strong>बी०आर०पी०</strong>, <strong>बैठक तिथि</strong>, <strong>पंचायत निर्णय</strong>, <strong>MIS</strong> या <strong>NSAP पेंशनर</strong> को सीधे खोजें।
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px]">
                <span className="text-slate-400 font-medium">त्वरित सुझाव:</span>
                {['बागपत', 'बड़ौत', 'तेजपाल', 'राजकुमार', 'निर्णय', 'MIS'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 font-medium transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-1">
              <p className="font-bold text-slate-600">कोई परिणाम नहीं मिला</p>
              <p>&ldquo;{query}&rdquo; के लिए कोई ग्राम पंचायत या अभिलेख उपलब्ध नहीं है।</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/90 border border-blue-200 shadow-2xs' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.category === 'gp' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      item.category === 'brp' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                      item.category === 'meeting' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      item.category === 'nirnay' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                      item.category === 'mis' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                      'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      {item.category === 'gp' && <Building2 className="w-4 h-4" />}
                      {item.category === 'brp' && <User className="w-4 h-4" />}
                      {item.category === 'meeting' && <Calendar className="w-4 h-4" />}
                      {item.category === 'nirnay' && <Smartphone className="w-4 h-4" />}
                      {item.category === 'mis' && <FileSpreadsheet className="w-4 h-4" />}
                      {item.category === 'nsap' && <Users className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-700 translate-x-0.5' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">↓</kbd>
              <span>नेविगेट</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">↵</kbd>
              <span>चयन करें</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">Esc</kbd>
              <span>बंद करें</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {results.length} परिणाम प्रदर्शित
          </span>
        </div>

      </div>
    </div>
  );
}

