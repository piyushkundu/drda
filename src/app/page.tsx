'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import Sidebar from '@/components/layout/Sidebar';
import RibbonToolbar from '@/components/editor/RibbonToolbar';
import StatusBar from '@/components/layout/StatusBar';
import Editor from '@/components/editor/Editor';
import SpecialCharPanel from '@/components/editor/SpecialCharPanel';
import Dashboard from '@/components/dashboard/Dashboard';
import FontConverterPanel from '@/components/tools/FontConverter';
import GovDictionaryPanel from '@/components/tools/GovDictionary';
import TemplateGallery from '@/components/templates/TemplateGallery';
import AIDocGenerator from '@/components/ai/AIDocGenerator';
import OCRScanner from '@/components/ocr/OCRScanner';
import SettingsPanel from '@/components/settings/SettingsPanel';
import ArchivedFiles from '@/components/dashboard/ArchivedFiles';
import SocialAuditDashboard from '@/components/socialAudit/SocialAuditDashboard';

const SpreadsheetEditor = dynamic(() => import('@/components/spreadsheet/SpreadsheetEditor'), { ssr: false });

export default function Home() {
  const { sidebarPanel, sidebarCollapsed } = useUIStore();
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const renderPanel = () => {
    switch (sidebarPanel) {
      case 'social-audit':
        return <SocialAuditDashboard />;
      case 'dashboard':
        return <Dashboard />;
      case 'editor':
        return (
          <div className="flex flex-col h-full">
            <RibbonToolbar />
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 overflow-hidden">
                <Editor />
              </div>
              <SpecialCharPanel />
            </div>
          </div>
        );
      case 'spreadsheet':
        return <SpreadsheetEditor />;
      case 'templates':
        return <TemplateGallery />;
      case 'ai-generator':
        return <AIDocGenerator />;
      case 'font-converter':
        return <FontConverterPanel />;
      case 'ocr':
        return <OCRScanner />;
      case 'dictionary':
        return <GovDictionaryPanel />;
      case 'files':
        return <ArchivedFiles />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <SocialAuditDashboard />;
    }
  };

  const isSocialAudit = sidebarPanel === 'social-audit';

  // If in Social Audit mode, show full-screen Social Audit portal without Page Hindi sidebar and status bar
  if (isSocialAudit) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950">
        <SocialAuditDashboard />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 print:ml-0 print:w-full"
        style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <main className="flex-1 overflow-hidden">
          <div className="h-full panel-content">{renderPanel()}</div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
