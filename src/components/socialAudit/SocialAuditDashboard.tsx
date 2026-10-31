'use client';

import React, { useState } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import SocialAuditCompactHeader from './SocialAuditCompactHeader';
import SocialAuditSidebar from './SocialAuditSidebar';
import UpcomingSabhasTab from './UpcomingSabhasTab';
import ExecutiveDashboardTab from './ExecutiveDashboardTab';
import CalendarTableTab from './CalendarTableTab';
import NSAPReportTab from './NSAPReportTab';
import TeamRosterTab from './TeamRosterTab';
import PanchayatNirnayTab from './PanchayatNirnayTab';
import MisFeedingTab from './MisFeedingTab';
import NSAPDataTab from './NSAPDataTab';
import EditRecordModal from './EditRecordModal';
import AddRecordModal from './AddRecordModal';

export default function SocialAuditDashboard() {
  const { activeTab } = useSocialAuditStore();

  // Desktop sidebar collapse state & mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* 1. Compact Top Header (~56-64px height) */}
      <SocialAuditCompactHeader
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Shell: Collapsible Left Sidebar + Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsible Left Sidebar */}
        <SocialAuditSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto p-3 sm:p-5 md:p-6 bg-slate-100/70 scrollbar-thin">
          <div className="w-full max-w-[1920px] mx-auto space-y-5">
            {/* 1. डैशबोर्ड (PRIMARY MONITORING CENTER) */}
            {(activeTab === 'dashboard' || activeTab === 'overview') && (
              <ExecutiveDashboardTab />
            )}

            {/* 2. आगामी सभाएं */}
            {activeTab === 'upcoming' && (
              <UpcomingSabhasTab />
            )}

            {/* 3. सोशल ऑडिट कैलेंडर (रोस्टर) */}
            {activeTab === 'calendar' && (
              <CalendarTableTab />
            )}

            {/* 4. पंचायत निर्णय ऐप (R 9.6.2) */}
            {activeTab === 'nirnay' && (
              <PanchayatNirnayTab />
            )}

            {/* 5. MIS ऑडिट फीडिंग (R 9.1.3) */}
            {activeTab === 'mis-feeding' && (
              <MisFeedingTab />
            )}

            {/* 6. NSAP डेटा (लाभार्थी विवरण व प्रविष्टि) */}
            {activeTab === 'nsap-data' && (
              <NSAPDataTab />
            )}

            {/* 7. NSAP पेंशन रिपोर्ट (मासिक प्रारूप) */}
            {activeTab === 'nsap-report' && (
              <NSAPReportTab />
            )}

            {/* 8. टीम एवं बी०आर०पी० रोस्टर */}
            {activeTab === 'roster' && (
              <TeamRosterTab />
            )}
          </div>
        </main>
      </div>

      {/* Shared Modals */}
      <EditRecordModal />
      <AddRecordModal />
    </div>
  );
}
