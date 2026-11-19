import React from 'react';
import { 
  Files, 
  Send, 
  Inbox, 
  FileBadge, 
  Wrench, 
  ShoppingCart, 
  BarChart3,
  CalendarClock
} from 'lucide-react';
import { DocumentType } from '../types/document';

export type NavTab = 'ALL' | DocumentType | 'ANALYTICS';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  counts: Record<string, number>;
  pendingCounts: Record<string, number>;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  counts,
  pendingCounts,
}) => {
  const tabs: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'ALL',
      label: 'เอกสารทั้งหมด',
      shortLabel: 'ทั้งหมด',
      icon: <Files className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'slate',
    },
    {
      id: 'OUTGOING',
      label: 'หนังสือส่ง (ออก)',
      shortLabel: 'เลขที่ส่ง',
      icon: <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'emerald',
    },
    {
      id: 'INCOMING',
      label: 'หนังสือรับ (เข้า)',
      shortLabel: 'เลขที่รับ',
      icon: <Inbox className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'sky',
    },
    {
      id: 'ORDER',
      label: 'คำสั่ง รพ.สต.',
      shortLabel: 'คำสั่ง',
      icon: <FileBadge className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'purple',
    },
    {
      id: 'DUTY_ORDER',
      label: 'คำสั่งเวรยาม',
      shortLabel: 'เวรยาม',
      icon: <CalendarClock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'teal',
    },
    {
      id: 'HIRE_ORDER',
      label: 'ใบสั่งจ้าง',
      shortLabel: 'สั่งจ้าง',
      icon: <Wrench className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'amber',
    },
    {
      id: 'PURCHASE_ORDER',
      label: 'ใบสั่งซื้อ',
      shortLabel: 'สั่งซื้อ',
      icon: <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'rose',
    },
    {
      id: 'ANALYTICS',
      label: 'รายงานสรุปผล',
      shortLabel: 'สถิติ',
      icon: <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      color: 'indigo',
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Horizontal Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 sm:top-20 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id] ?? 0;
              const pending = pendingCounts[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-300' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                  
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                        isActive
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  {pending > 0 && tab.id !== 'ANALYTICS' && (
                    <span
                      title="รอดำเนินการ"
                      className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar for Smartphone Officers */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1.5 shadow-lg print:hidden">
        <div className="grid grid-cols-6 gap-0.5 items-center">
          {tabs
            .filter((t) => ['ALL', 'OUTGOING', 'INCOMING', 'ORDER', 'DUTY_ORDER', 'PURCHASE_ORDER'].includes(t.id))
            .map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative ${
                    isActive
                      ? 'text-emerald-800 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-0.5 ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : ''
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <span className="text-[10px] leading-tight truncate w-full text-center">
                    {tab.shortLabel}
                  </span>
                  {count > 0 && !isActive && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
};
