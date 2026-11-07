'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { isHistoricalDate, reportingDate } from '@/lib/socialAuditAsOf';
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
    asOfDate,
    liveDelhiDate,
    setLiveSync,
    records,
    nsapRecords,
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
  const undatedWorkCount = records.filter(record =>
    (record.misStatus === 'fed' && !reportingDate(record.misFedDate)) ||
    (record.panchayatNirnayStatus === 'captured' && !reportingDate(record.panchayatNirnayCapturedDate))
  ).length + nsapRecords.filter(record => !reportingDate(record.meetingDate) && !reportingDate(record.recordedDate)).length;

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

      {isHistoricalDate(asOfDate, liveDelhiDate) && (
        <div role="status" className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>पुरानी तारीख की रिपोर्ट: {asOfDate.split('-').reverse().join('/')}</strong>
            {' '}तक का काम दर्ज कार्य-तिथियों के अनुसार दिखाया जा रहा है। डेटा बदलने से पहले चेतावनी आएगी।
            {undatedWorkCount > 0 && (
              <span className="block font-medium">कुछ कार्यों की तारीख उपलब्ध नहीं है; वे पुरानी प्रगति में शामिल नहीं हैं।</span>
            )}
          </span>
          <button type="button" onClick={() => setLiveSync(true)} className="font-bold underline underline-offset-2">
            आज की तारीख पर वापस जाएँ
          </button>
        </div>
      )}

      {asOfDate > liveDelhiDate && (
        <div role="status" className="shrink-0 border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-950">
          <strong>भविष्य की तारीख: {asOfDate.split('-').reverse().join('/')}</strong>
          {' '}प्रस्तावित बैठकें रोस्टर के अनुसार हैं। आगे की बैठकें आपके द्वारा “सम्पन्न” करने पर ही प्रगति में जुड़ेंगी।
        </div>
      )}

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

              {/* केन्द्रीय रिपोर्ट सेंटर */}
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
