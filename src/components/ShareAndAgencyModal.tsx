import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Building2,
  Copy,
  Check,
  QrCode,
  RotateCcw,
  Save,
  CheckCircle2,
  Smartphone,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import {
  AgencyConfig,
  DEFAULT_AGENCY_CONFIG,
  resetAgencyConfig,
  saveAgencyConfig,
} from '../services/agencyConfig';
import { toThaiNumerals } from '../utils/thaiFormat';

interface ShareAndAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyConfig: AgencyConfig;
  onAgencyUpdate: (next: AgencyConfig) => void;
  onOpenSheetsModal: () => void;
}

const SHARED_PUBLIC_URL = 'https://ais-pre-keih3qhrcvapvkjrsp3rzv-892838480730.asia-east1.run.app';

export const ShareAndAgencyModal: React.FC<ShareAndAgencyModalProps> = ({
  isOpen,
  onClose,
  agencyConfig,
  onAgencyUpdate,
  onOpenSheetsModal,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'agency'>('share');
  const [form, setForm] = useState<AgencyConfig>(agencyConfig);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(agencyConfig);
      setSavedNotice(false);
    }
  }, [isOpen, agencyConfig]);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-')
      ? SHARED_PUBLIC_URL
      : typeof window !== 'undefined'
      ? window.location.origin
      : SHARED_PUBLIC_URL;

  const lineRecommendationText = `แนะนำระบบสารบรรณอิเล็กทรอนิกส์สำหรับ รพ.สต. (E-Saraban) ใช้งานฟรีผ่านมือถือและคอมพิวเตอร์

✅ ครบ 6 ทะเบียนหลัก: เลขที่ส่ง, เลขที่รับ, คำสั่ง, คำสั่งเวรยาม, ใบสั่งจ้าง และใบสั่งซื้อ
✅ ออกเลขอัตโนมัติ แจ้งเตือนเรียลไทม์ + แนบไฟล์ภาพ/PDF จากมือถือ
✅ สั่งพิมพ์ใบปะหน้า, Export as PDF และสแกน QR Code ติดตามสถานะได้ทันที
✅ ซิงค์สำรองข้อมูลขึ้น Google Sheets ของหน่วยงานตนเองได้

👉 เข้าใช้งาน / ตั้งค่าเป็นชื่อ รพ.สต. ของท่านได้ที่:
${shareUrl}

(เมื่อเปิดลิงก์แล้ว กดปุ่ม "แชร์ / ตั้งค่าหน่วยงาน" มุมขวาบน เพื่อเปลี่ยนชื่อ รพ.สต. และเชื่อม Google Sheets ของหน่วยงานได้เลย)`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(lineRecommendationText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveAgencyConfig(form);
    onAgencyUpdate(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetAgency = () => {
    const defaults = resetAgencyConfig();
    setForm(defaults);
    onAgencyUpdate(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in print:hidden">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                แนะนำระบบให้หน่วยงานอื่นนำไปใช้ & ตั้งค่าหน่วยงาน
              </h2>
              <p className="text-xs text-emerald-200">
                ปรับใช้ได้ทันทีกับ รพ.สต. และหน่วยงานสาธารณสุขทุกแห่ง
              </p>
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

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>ส่งต่อ / แนะนำให้ที่อื่นใช้</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agency')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'agency'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ตั้งค่าชื่อหน่วยงาน ({agencyConfig.shortName})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'share' ? (
            <>
              {/* Link + QR Box */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs flex-shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="QR Code เข้าใช้งานระบบ"
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">
                    <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                    ลิงก์สำหรับแชร์ให้ รพ.สต. หรือหน่วยงานอื่นใช้งาน
                  </span>
                  <div className="p-2 bg-white rounded-xl border border-emerald-200 text-xs font-mono text-slate-700 break-all">
                    {shareUrl}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ระบบ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('agency')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>เปลี่ยนเป็นชื่อหน่วยงานอื่น</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Copy-paste LINE / Group Pitch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>ข้อความแนะนำระบบ (คัดลอกส่งเข้ากลุ่ม LINE ได้ทันที)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {copiedPitch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPitch ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความแนะนำ'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={lineRecommendationText}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed focus:outline-hidden resize-none"
                />
              </div>

              {/* 3-Step Onboarding Checklist for Other Agencies */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800">
                  ขั้นตอนสำหรับหน่วยงานอื่นที่รับลิงก์ไปใช้งาน:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. ตั้งชื่อหน่วยงาน</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      เข้าแท็บ &ldquo;ตั้งค่าชื่อหน่วยงาน&rdquo; เพื่อระบุชื่อ รพ.สต. ที่อยู่ รหัสหนังสือส่ง และชื่อ ผอ. ของตนเอง
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>2. สร้าง Google Sheet</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      ล็อกอินบัญชี Google ของหน่วยงาน แล้วกด &ldquo;สร้าง Google Sheets ทะเบียนเล่มใหม่&rdquo; เพื่อแยกเก็บข้อมูล
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>3. เพิ่มลงหน้าจอมือถือ</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      เปิดผ่าน Chrome/Safari แล้วเลือก &ldquo;เพิ่มไปยังหน้าจอโฮม&rdquo; เพื่อใช้งานเสมือนแอปประจำหน่วยงาน
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveAgency} className="space-y-4">
              {savedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกการตั้งค่าหน่วยงานเรียบร้อยแล้ว (อัปเดตหัวเว็บ ใบปะหน้า และไฟล์ PDF อัตโนมัติ)</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ชื่อย่อหน่วยงาน (แสดงบนหัวเว็บ/คำสั่ง)
                  </label>
                  <input
                    type="text"
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    placeholder="เช่น รพ.สต.บ้านรี"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ปีงบประมาณ / ปี พ.ศ.
                  </label>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value={2569}>พ.ศ. ๒๕๖๙</option>
                    <option value={2570}>พ.ศ. ๒๕๗๐</option>
                    <option value={2571}>พ.ศ. ๒๕๗๑</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อเต็มหน่วยงาน (แสดงบนใบปะหน้าและไฟล์ PDF)
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="เช่น โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ที่ตั้งหน่วยงาน (ตำบล อำเภอ จังหวัด)
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="เช่น ตำบลบ้านรี อำเภอดอนพุด จังหวัดสระบุรี"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    รหัสนำหน้าเลขที่ส่งออก
                  </label>
                  <input
                    type="text"
                    value={form.outgoingPrefix}
                    onChange={(e) => setForm({ ...form, outgoingPrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    placeholder="เช่น สธ ๐๕๑๒.๐๓/"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ชื่อผู้อำนวยการ / ผู้ลงนามหลัก
                  </label>
                  <input
                    type="text"
                    value={form.directorName}
                    onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    placeholder="เช่น นายสมพงษ์ มลิวัลย์"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-amber-900">
                  💡 หากเป็นหน่วยงานใหม่ อย่าลืมสร้างไฟล์ Google Sheets แยกเฉพาะของหน่วยงานท่าน
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSheetsModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold flex-shrink-0 self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ไปที่จัดการ Google Sheets</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAgency}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าเริ่มต้น ({DEFAULT_AGENCY_CONFIG.shortName} {toThaiNumerals(DEFAULT_AGENCY_CONFIG.fiscalYear)})</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าหน่วยงาน</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
