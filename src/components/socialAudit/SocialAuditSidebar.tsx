'use client';

import React from 'react';
import { useSocialAuditStore, SocialAuditTab } from '@/stores/socialAuditStore';
import { 
  LayoutDashboard, Clock, Calendar, Smartphone, FileSpreadsheet, 
  Users, FileText, Briefcase, ChevronLeft, ChevronRight, X, 
  Building2, ShieldCheck, UserCheck, CheckCircle2, AlertCircle
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isOpenMobile: boolean;
  setIsOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SocialAuditSidebar({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}: SidebarProps) {
  const { activeTab, setActiveTab, records, nsapRecords, asOfDate } = useSocialAuditStore();

  // Dynamic counts for navigation badges
  const upcomingCount = records.filter(
    (r) => r.meetingDate >= asOfDate && r.status !== 'completed'
  ).length;
  const amendedCount = records.filter((r) => r.isAmended).length;
  const nirnayCapturedCount = records.filter(
    (r) => r.panchayatNirnayStatus === 'captured'
  ).length;
  const misFedCount = records.filter((r) => r.misStatus === 'fed').length;
  const nsapRecordedCount = nsapRecords?.length || 16;
  const nsapRosterCount = records.filter((r) => r.hasNSAP).length;

  // Exact 8 items in requested order
  const navItems: Array<{
    id: SocialAuditTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    iconColor: string;
  }> = [
    {
      id: 'dashboard',
      label: 'डैशबोर्ड',
      sublabel: 'Executive Monitoring Center',
      icon: LayoutDashboard,
      iconColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      id: 'upcoming',
      label: 'आगामी सभाएं',
      sublabel: 'Upcoming Sabha',
      icon: Clock,
      badge: `${upcomingCount}`,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      id: 'calendar',
      label: 'सोशल ऑडिट कैलेंडर',
      sublabel: 'Meeting Calendar (Roster)',
      icon: Calendar,
      badge: amendedCount > 0 ? `${amendedCount} संशोधित` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
      iconColor: 'text-blue-800 bg-blue-50 border-blue-200',
    },
    {
      id: 'nirnay',
      label: 'पंचायत निर्णय ऐप',
      sublabel: 'R 9.6.2 Live Upload Tracker',
      icon: Smartphone,
      badge: `${nirnayCapturedCount} अपलोड`,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      iconColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      id: 'mis-feeding',
      label: 'MIS ऑडिट फीडिंग',
      sublabel: 'R 9.1.3 Portal Feeding',
      icon: FileSpreadsheet,
      badge: `${misFedCount} फीडेड`,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      iconColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'nsap-data',
      label: 'NSAP डेटा',
      sublabel: 'Beneficiary Register & Data Entry',
      icon: Users,
      badge: `${nsapRecordedCount} रिकॉर्डेड`,
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      iconColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      id: 'nsap-report',
      label: 'NSAP पेंशन रिपोर्ट',
      sublabel: 'Monthly Progress Report',
      icon: FileText,
      badge: `${nsapRosterCount}`,
      badgeColor: 'bg-violet-100 text-violet-900 border-violet-200',
      iconColor: 'text-violet-700 bg-violet-50 border-violet-200',
    },
    {
      id: 'roster',
      label: 'टीम एवं BRP रोस्टर',
      sublabel: 'Field Officers & BRP Directory',
      icon: Briefcase,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  const handleSelectTab = (tabId: SocialAuditTab) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay - Positioned over remaining viewport below header */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`absolute lg:static inset-y-0 left-0 h-full z-50 bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          /* Mobile Drawer */
          isOpenMobile
            ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl visible'
            : '-translate-x-full lg:translate-x-0 invisible lg:visible shadow-none'
        } ${
          /* Desktop Width: 72px collapsed, 260px expanded */
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        }`}
      >
        {/* Top: Mobile Close Button & Header Branding for Mobile (Always visible at top of drawer) */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 lg:hidden bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-slate-900 text-sm block leading-tight truncate">सोशल ऑडिट बागपत</span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">प्रशासनिक नेविगेशन मेन्यू</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="p-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs shrink-0"
            title="मेन्यू बंद करें"
            aria-label="Close Navigation Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1 scrollbar-thin">
          {!isCollapsed && (
            <div className="hidden lg:block px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              प्रशासनिक मॉड्यूल्स (Navigation)
            </div>
          )}

          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'dashboard' && activeTab === 'overview');

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left text-xs font-bold relative ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-900 border-l-4 border-blue-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-1.5' : ''}`}
                >
                  {/* Colored Icon Badge */}
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 transition-transform ${
                      isActive ? 'scale-105 shadow-xs' : 'group-hover:scale-105'
                    } ${item.iconColor}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </span>

                  {/* Expanded Item Label & Badge */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                      <div className="truncate">
                        <div className="truncate text-xs">{item.label}</div>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                            item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Collapsed Tooltip on Desktop Hover */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl whitespace-nowrap items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer: User / Role & Version */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/80 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                  DDO
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-900 truncate">
                    जिला विकास अधिकारी
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    DRDA बागपत, उत्तर प्रदेश
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-600 px-1 font-medium">
                <span>Enterprise v3.0</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  सक्रिय
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs"
                title="जिला विकास अधिकारी (DDO) बागपत"
              >
                DDO
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

