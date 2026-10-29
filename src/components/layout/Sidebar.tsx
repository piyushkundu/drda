'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import type { SidebarPanel } from '@/types';
import {
  LayoutDashboard, FilePlus, FileText, Bot, Type, ScanLine,
  BookOpen, Archive, Settings, ChevronLeft, ChevronRight, Sparkles, TableProperties, Landmark
} from 'lucide-react';

const menuItems: { id: SidebarPanel; label: string; labelHi: string; icon: React.ElementType }[] = [
  { id: 'social-audit', label: 'Social Audit', labelHi: 'सोशल ऑडिट बागपत', icon: Landmark },
  { id: 'dashboard', label: 'Page Hindi Suite', labelHi: 'पेज हिंदी सुइट', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor', labelHi: 'संपादक', icon: FilePlus },
  { id: 'spreadsheet', label: 'Spreadsheet', labelHi: 'स्प्रेडशीट', icon: TableProperties },
  { id: 'templates', label: 'Templates', labelHi: 'टेम्पलेट', icon: FileText },
  { id: 'ai-generator', label: 'AI Draft', labelHi: 'AI ड्राफ्ट', icon: Bot },
  { id: 'font-converter', label: 'Font Convert', labelHi: 'फ़ॉन्ट कनवर्टर', icon: Type },
  { id: 'ocr', label: 'OCR Scanner', labelHi: 'OCR स्कैनर', icon: ScanLine },
  { id: 'dictionary', label: 'Dictionary', labelHi: 'शब्दकोश', icon: BookOpen },
  { id: 'files', label: 'Archive', labelHi: 'आर्काइव', icon: Archive },
  { id: 'settings', label: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, sidebarPanel, toggleSidebar, setSidebarPanel } = useUIStore();

  return (
    <motion.aside
      className="sidebar fixed left-0 top-0 h-full z-40 flex flex-col"
      animate={{ width: sidebarCollapsed ? 68 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-gradient)' }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>पेज हिंदी</h1>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>AI Office Suite</p>
          </motion.div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = sidebarPanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSidebarPanel(item.id)}
              className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon className="shrink-0" />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate flex items-center justify-between flex-1"
                >
                  <span>{item.id === 'social-audit' ? item.labelHi : item.label}</span>
                  {item.id === 'social-audit' && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold ml-1">
                      पोर्टल
                    </span>
                  )}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center p-3 border-t border-white/5 hover:bg-white/5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
}
