import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { OfficialGoogleButton } from './OfficialGoogleButton';
import { SheetConfig } from '../services/googleSheets';
import { formatThaiDate } from '../utils/thaiFormat';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  googleUserEmail: string | null;
  onGoogleSignIn: () => Promise<void>;
  isSigningIn: boolean;
  sheetConfig: SheetConfig | null;
  onCreateNewSheet: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  totalDocsCount: number;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  googleUserEmail,
  onGoogleSignIn,
  isSigningIn,
  sheetConfig,
  onCreateNewSheet,
  onSyncAll,
  isSyncing,
  totalDocsCount,
}) => {
  const [customSheetId, setCustomSheetId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">จัดการการเชื่อมต่อ Google Sheets</h2>
              <p className="text-xs text-emerald-200">ระบบสำรองและซิงค์ทะเบียนหนังสือ รพ.สต.บ้านรี</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Step 1: Authentication */}
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-800">
                  เข้าสู่ระบบด้วยบัญชี Google ของท่าน
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  เพื่อบันทึกและซิงค์ทะเบียนหนังสือรับ-ส่ง คำสั่ง ใบสั่งจ้าง และใบสั่งซื้อ เข้าสู่ Google Sheets ประจำหน่วยงานโดยตรง
                </p>
              </div>

              <div className="pt-2">
                <OfficialGoogleButton
                  onClick={onGoogleSignIn}
                  loading={isSigningIn}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                🔒 ข้อมูลถูกเข้ารหัสและปลอดภัยตามมาตรฐานความปลอดภัยข้อมูลสาธารณสุข
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected User Badge */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 block">
                      เชื่อมต่อบัญชี Google แล้ว
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      {googleUserEmail}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200/60 text-emerald-900 text-[11px] font-bold rounded-md">
                  พร้อมใช้งาน
                </span>
              </div>

              {/* Sheet Status & Details */}
              {sheetConfig ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        ไฟล์ Google Spreadsheet ที่ผูกไว้:
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {sheetConfig.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ซิงค์ล่าสุดเมื่อ: {sheetConfig.lastSyncedAt ? formatThaiDate(sheetConfig.lastSyncedAt, true) : 'ยังไม่เคยซิงค์'}
                      </p>
                    </div>

                    <a
                      href={sheetConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 text-emerald-800 text-xs font-bold rounded-xl shadow-2xs transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิด Sheet</span>
                    </a>
                  </div>

                  {/* Spreadsheet ID & Direct Link */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-mono break-all">
                      <span>ID: <strong>{sheetConfig.spreadsheetId}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sheetConfig.spreadsheetId);
                          setStatusMessage('คัดลอก Sheet ID แล้ว');
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex-shrink-0 ml-2"
                      >
                        {statusMessage || 'คัดลอก ID'}
                      </button>
                    </div>
                  </div>

                  {/* Tabs Info */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      ชีตย่อยที่เชื่อมต่ออัตโนมัติ (๕ ทะเบียนหลัก):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['ทะเบียนหนังสือส่ง', 'ทะเบียนหนังสือรับ', 'ทะเบียนคำสั่ง', 'ทะเบียนใบสั่งจ้าง', 'ทะเบียนใบสั่งซื้อ'].map((tab) => (
                        <span key={tab} className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg">
                          📄 {tab}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sync Actions */}
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      มีเอกสารในระบบทั้งหมด: <strong>{totalDocsCount}</strong> รายการ
                    </span>

                    <button
                      type="button"
                      onClick={onSyncAll}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลทั้งหมดทันที'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No Sheet Linked Yet */
                <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">ยังไม่ได้สร้างหรือผูกไฟล์ Google Sheets</h4>
                    <p className="text-xs text-amber-800 mt-1 max-w-sm mx-auto">
                      คลิกปุ่มด้านล่างเพื่อสร้างไฟล์ Google Sheets ประจำปี ๒๕๖๙ พร้อม ๕ หมวดหมู่อัตโนมัติใน Google Drive ของคุณ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onCreateNewSheet}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isSyncing ? 'กำลังสร้างไฟล์...' : 'สร้างไฟล์ทะเบียนสารบรรณ ๒๕๖๙ บน Sheets'}</span>
                  </button>
                </div>
              )}

              {/* Create new replacement sheet if desired */}
              {sheetConfig && (
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={onCreateNewSheet}
                    disabled={isSyncing}
                    className="text-xs text-emerald-800 hover:underline font-semibold"
                  >
                    + สร้าง Google Sheets ทะเบียนเล่มใหม่
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
