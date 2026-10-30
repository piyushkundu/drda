'use client';

import React from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import SocialAuditHeader from './SocialAuditHeader';
import UpcomingSabhasTab from './UpcomingSabhasTab';
import ExecutiveDashboardTab from './ExecutiveDashboardTab';
import CalendarTableTab from './CalendarTableTab';
import NSAPReportTab from './NSAPReportTab';
import TeamRosterTab from './TeamRosterTab';
import PanchayatNirnayTab from './PanchayatNirnayTab';
import MisFeedingTab from './MisFeedingTab';
import EditRecordModal from './EditRecordModal';
import AddRecordModal from './AddRecordModal';

export default function SocialAuditDashboard() {
  const { activeTab } = useSocialAuditStore();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header & Navigation */}
      <SocialAuditHeader />

      {/* Main Tab Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
        {/* 1. आगामी सभाएं (FIRST TAB) */}
        {activeTab === 'upcoming' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <UpcomingSabhasTab />
          </div>
        )}

        {/* 2. डैशबोर्ड (SECOND TAB) */}
        {(activeTab === 'dashboard' || activeTab === 'overview') && (
          <div className="max-w-7xl mx-auto space-y-6">
            <ExecutiveDashboardTab />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <CalendarTableTab />
          </div>
        )}

        {/* 4. पंचायत निर्णय ऐप (R 9.6.2) */}
        {activeTab === 'nirnay' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <PanchayatNirnayTab />
          </div>
        )}

        {/* 5. MIS ऑडिट फीडिंग (R 9.1.3) */}
        {activeTab === 'mis-feeding' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <MisFeedingTab />
          </div>
        )}

        {activeTab === 'nsap-report' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <NSAPReportTab />
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <TeamRosterTab />
          </div>
        )}
      </main>

      {/* Edit & Add Modals */}
      <EditRecordModal />
      <AddRecordModal />
    </div>
  );
}
