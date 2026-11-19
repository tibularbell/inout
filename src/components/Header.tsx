import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  FileSpreadsheet, 
  Plus, 
  QrCode, 
  UserCircle2, 
  ShieldCheck, 
  ChevronDown,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { StaffUser } from '../types/document';
import { SheetConfig } from '../services/googleSheets';

interface HeaderProps {
  currentUser: StaffUser;
  onUserChange: (user: StaffUser) => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  onOpenNewDoc: () => void;
  onOpenSheetsModal: () => void;
  onOpenScanner: () => void;
  sheetConfig: SheetConfig | null;
  googleUserEmail: string | null;
  isSyncingSheet: boolean;
  onQuickSyncSheet: () => void;
  onLogoutGoogle: () => void;
}

export const ADMIN_EMAILS = ['tibularbell@gmail.com'];

export const STAFF_PRESETS: StaffUser[] = [
  {
    uid: 'admin-tib',
    name: 'ผู้ดูแลระบบ รพ.สต.บ้านรี (Admin)',
    email: 'tibularbell@gmail.com',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'u1',
    name: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.)',
    email: 'somchai.c@banri-hph.go.th',
    role: 'DIRECTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'u2',
    name: 'นางสาวมาลี รักงาน (จพ.ธุรการ/สารบรรณ)',
    email: 'malee.r@banri-hph.go.th',
    role: 'SARABAN_OFFICER',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'u3',
    name: 'นายสุรชัย มั่นคง (จพ.พัสดุและจัดซื้อ)',
    email: 'surachai.m@banri-hph.go.th',
    role: 'PROCUREMENT_OFFICER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'u4',
    name: 'พว.สุดารัตน์ ใจดี (พยาบาลวิชาชีพ)',
    email: 'sudarat.j@banri-hph.go.th',
    role: 'HEALTH_OFFICER',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813528-76c2438fa5a7?w=150&auto=format&fit=crop&q=80',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  unreadAlertCount,
  onOpenAlerts,
  onOpenNewDoc,
  onOpenSheetsModal,
  onOpenScanner,
  sheetConfig,
  googleUserEmail,
  isSyncingSheet,
  onQuickSyncSheet,
  onLogoutGoogle,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (role: StaffUser['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ (Admin สูงสุด)';
      case 'DIRECTOR':
        return 'ผอ.รพ.สต.บ้านรี';
      case 'SARABAN_OFFICER':
        return 'เจ้าหน้าที่สารบรรณ';
      case 'PROCUREMENT_OFFICER':
        return 'เจ้าหน้าที่พัสดุ/จัดซื้อ';
      case 'HEALTH_OFFICER':
        return 'พยาบาลวิชาชีพ / สาธารณสุข';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      {/* Top Banner for Department Info */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo & Hospital Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Ministry of Public Health Thailand Emblem Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-inner flex items-center justify-center flex-shrink-0 border border-emerald-400/40">
              <div className="w-full h-full bg-emerald-950/40 rounded-[10px] flex items-center justify-center text-white">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                  รพ.สต.บ้านรี
                </h1>
                <span className="hidden xs:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-800/80 text-emerald-200 rounded-full border border-emerald-700">
                  ระบบสารบรรณอิเล็กทรอนิกส์
                </span>
                <span className="text-xs text-emerald-300 font-medium hidden md:inline">
                  (ปี พ.ศ. ๒๕๗๐)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 truncate">
                โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี อ.ดอนพุด จ.สระบุรี
              </p>
            </div>
          </div>

          {/* Action Buttons: Sheets, Alerts, QR, User */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Google Sheets Status Pill / Button */}
            <div className="relative">
              {sheetConfig ? (
                <div className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-200 border border-emerald-700/80 rounded-lg p-1 sm:px-2.5 sm:py-1.5 transition-colors">
                  <button
                    onClick={onOpenSheetsModal}
                    title="เปิดจัดการ Google Sheets"
                    className="flex items-center gap-1.5 text-xs text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="hidden lg:inline text-white font-medium truncate max-w-[140px]">
                      {sheetConfig.title}
                    </span>
                    <span className="hidden sm:inline-block text-[10px] text-emerald-300 bg-emerald-800/80 px-1.5 py-0.5 rounded">
                      ซิงค์แล้ว
                    </span>
                  </button>
                  <button
                    onClick={onQuickSyncSheet}
                    disabled={isSyncingSheet}
                    title="ซิงค์ข้อมูลทันที"
                    className="p-1 hover:text-white rounded hover:bg-emerald-800/60 transition-transform active:rotate-180"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-amber-300' : 'text-emerald-300'}`} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSheetsModal}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-amber-950 px-2.5 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">เชื่อมต่อ Google Sheets</span>
                  <span className="sm:hidden">Sheets</span>
                </button>
              )}
            </div>

            {/* QR Scanner for Mobile Staff */}
            <button
              type="button"
              onClick={onOpenScanner}
              title="สแกน QR Code ค้นหาเอกสาร"
              className="p-2 sm:px-2.5 sm:py-2 text-emerald-200 hover:text-white hover:bg-emerald-800/70 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span className="hidden xl:inline">สแกน QR</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={onOpenAlerts}
              title="การแจ้งเตือนติดตามสถานะ"
              className="relative p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/70 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-emerald-200" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-bounce">
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </span>
              )}
            </button>

            {/* Primary Action Button: ออกเลขทะเบียนใหม่ */}
            <button
              type="button"
              onClick={onOpenNewDoc}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-emerald-950 font-bold px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">ออกเลขใหม่</span>
              <span className="xs:hidden">ออกเลข</span>
            </button>

            {/* Current Staff Switcher Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-emerald-800/70 transition-colors text-left"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-emerald-400/60 overflow-hidden bg-emerald-800 flex items-center justify-center flex-shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-5 h-5 text-emerald-200" />
                  )}
                </div>
                <div className="hidden md:block max-w-[120px]">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-300 truncate">
                    {getRoleLabel(currentUser.role)}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">เจ้าหน้าที่ที่กำลังใช้งาน</p>
                      <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-emerald-600 font-semibold">{getRoleLabel(currentUser.role)}</p>
                      {googleUserEmail && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Google: {googleUserEmail}
                        </p>
                      )}
                    </div>

                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      สลับโปรไฟล์เจ้าหน้าที่ รพ.สต.
                    </div>

                    <div className="space-y-0.5 px-2">
                      {STAFF_PRESETS.map((user) => (
                        <button
                          key={user.uid}
                          type="button"
                          onClick={() => {
                            onUserChange(user);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            currentUser.uid === user.uid
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-slate-800">{user.name}</div>
                            <div className="text-[10px] text-slate-500">{getRoleLabel(user.role)}</div>
                          </div>
                          {currentUser.uid === user.uid && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    {googleUserEmail && (
                      <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                        <button
                          type="button"
                          onClick={() => {
                            onLogoutGoogle();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-md text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>ออกจากระบบ Google Workspace</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
