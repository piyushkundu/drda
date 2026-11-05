'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import SocialAuditCompactHeader from './SocialAuditCompactHeader';
import GlobalBRPFilterBar from './GlobalBRPFilterBar';
import SocialAuditSidebar from './SocialAuditSidebar';
import UpcomingSabhasTab from './UpcomingSabhasTab';
import ExecutiveDashboardTab from './ExecutiveDashboardTab';
import CalendarTableTab from './CalendarTableTab';
import NSAPReportTab from './NSAPReportTab';
import TeamRosterTab from './TeamRosterTab';
import PanchayatNirnayTab from './PanchayatNirnayTab';
import MisFeedingTab from './MisFeedingTab';
import NSAPDataTab from './NSAPDataTab';
import ReportCenterTab from './ReportCenterTab';
import ActivityLogTab from './ActivityLogTab';
import EditRecordModal from './EditRecordModal';
import AddRecordModal from './AddRecordModal';
import GramPanchayatProfilePanel from './GramPanchayatProfilePanel';
import GlobalSearchModal from './GlobalSearchModal';
import MeetingCompletionModal from './MeetingCompletionModal';
import CancelMeetingModal from './CancelMeetingModal';
import RescheduleMeetingModal from './RescheduleMeetingModal';

const NSAPWorkbook = dynamic(() => import('./workbook/NSAPWorkbook'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
      NSAP आधिकारिक एक्सेल वर्कबुक लोड हो रही है...
    </div>
  )
});

export default function SocialAuditDashboard() {
  const { 
    activeTab, 
    selectedRecordForCompletion, 
    closeCompletionModal,
    selectedRecordForCancel,
    closeCancelModal,
    selectedRecordForReschedule,
    closeRescheduleModal
  } = useSocialAuditStore();

  // Desktop sidebar collapse state & mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="social-audit-shell flex flex-col h-screen w-screen bg-slate-100/80 text-slate-800 overflow-hidden font-sans">
      {/* 1. Compact Top Header (~56-64px height) */}
      <SocialAuditCompactHeader
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Global BRP Filter Toolbar - Persistent across all tabs */}
      <GlobalBRPFilterBar />

      {/* 2. Main Shell: Collapsible Left Sidebar + Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative w-full min-w-0">
        {/* Collapsible Left Sidebar (desktop static, mobile drawer) */}
        <SocialAuditSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isOpenMobile={isMobileSidebarOpen}
          setIsOpenMobile={setIsMobileSidebarOpen}
        />

        {/* Main Content Area - When in NSAP Workbook, use 100% full viewport height without padding */}
        {activeTab === 'nsap-workbook' ? (
          <main className="flex-1 w-full min-w-0 h-full overflow-hidden bg-white flex flex-col">
            <NSAPWorkbook />
          </main>
        ) : (
          <main className="flex-1 w-full min-w-0 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 bg-slate-100/60 scrollbar-thin">
            <div className="w-full max-w-[1920px] mx-auto space-y-4 sm:space-y-5 min-w-0">
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

              {/* 9. केन्द्रीय रिपोर्ट सेंटर (Report Center - 9 Reports) */}
              {activeTab === 'reports' && (
                <ReportCenterTab />
              )}

              {/* 10. गतिविधि लॉग एवं ऑडिट ट्रेल (Activity Log) */}
              {activeTab === 'activity-log' && (
                <ActivityLogTab />
              )}
            </div>
          </main>
        )}
      </div>

      {/* Shared Modals & Slide-over Panels */}
      <EditRecordModal />
      <AddRecordModal />
      <GramPanchayatProfilePanel />
      <GlobalSearchModal />
      <MeetingCompletionModal
        record={selectedRecordForCompletion}
        isOpen={Boolean(selectedRecordForCompletion)}
        onClose={closeCompletionModal}
      />
      <CancelMeetingModal
        record={selectedRecordForCancel}
        isOpen={Boolean(selectedRecordForCancel)}
        onClose={closeCancelModal}
      />
      <RescheduleMeetingModal
        record={selectedRecordForReschedule}
        isOpen={Boolean(selectedRecordForReschedule)}
        onClose={closeRescheduleModal}
      />
    </div>
  );
}
