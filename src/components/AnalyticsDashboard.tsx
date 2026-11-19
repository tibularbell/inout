import React from 'react';
import { 
  BarChart3, 
  Send, 
  Inbox, 
  FileBadge, 
  Wrench, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { SarabanDoc } from '../types/document';
import { formatCurrency, toThaiNumerals } from '../utils/thaiFormat';

interface AnalyticsDashboardProps {
  documents: SarabanDoc[];
  onFilterStatus: (status: string) => void;
  onFilterType: (type: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  documents,
  onFilterStatus,
  onFilterType,
}) => {
  const outgoingCount = documents.filter((d) => d.type === 'OUTGOING').length;
  const incomingCount = documents.filter((d) => d.type === 'INCOMING').length;
  const orderCount = documents.filter((d) => d.type === 'ORDER').length;
  const hireCount = documents.filter((d) => d.type === 'HIRE_ORDER').length;
  const purchaseCount = documents.filter((d) => d.type === 'PURCHASE_ORDER').length;

  const pendingCount = documents.filter((d) => d.status === 'PENDING').length;
  const processingCount = documents.filter((d) => d.status === 'PROCESSING').length;
  const awaitingSigCount = documents.filter((d) => d.status === 'AWAITING_SIGNATURE').length;
  const completedCount = documents.filter((d) => d.status === 'COMPLETED').length;

  const urgentCount = documents.filter((d) => d.speed !== 'NORMAL').length;

  // Calculate total procurement expenditure
  const totalProcurementBudget = documents
    .filter((d) => d.type === 'HIRE_ORDER' || d.type === 'PURCHASE_ORDER')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const hireBudget = documents
    .filter((d) => d.type === 'HIRE_ORDER')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const purchaseBudget = documents
    .filter((d) => d.type === 'PURCHASE_ORDER')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const completionRate = documents.length > 0 
    ? Math.round((completedCount / documents.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-emerald-700/80 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-600/60 inline-block mb-2">
            รายงานสถิติงบประมาณและงานสารบรรณ พ.ศ. ๒๕๗๐
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            สรุปภาพรวมงานสารบรรณ รพ.สต.บ้านรี
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
            ติดตามสถานะงานหนังสือราชการ คำสั่ง การจัดซื้อจัดจ้าง และการเบิกจ่ายงบประมาณเพื่อบริการสุขภาพประชาชนตำบลบ้านรี
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-emerald-200 block text-[10px]">เอกสารในระบบทั้งหมด</span>
              <span className="text-base font-bold text-white">{documents.length} เรื่อง</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-emerald-200 block text-[10px]">อัตราการดำเนินการสำเร็จ</span>
              <span className="text-base font-bold text-emerald-300">{completionRate}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-emerald-200 block text-[10px]">วงเงินจัดซื้อจัดจ้างรวม</span>
              <span className="text-base font-bold text-amber-300">{formatCurrency(totalProcurementBudget)}</span>
            </div>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* 5 Core Document Types Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          <span>จำนวนทะเบียนเอกสาร ๕ หมวดหมู่งาน</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Outgoing */}
          <div 
            onClick={() => onFilterType('OUTGOING')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">เลขที่ส่ง (ออก)</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {outgoingCount} <span className="text-xs font-normal text-slate-400">เรื่อง</span>
            </span>
          </div>

          {/* Incoming */}
          <div 
            onClick={() => onFilterType('INCOMING')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">เลขที่รับ (เข้า)</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {incomingCount} <span className="text-xs font-normal text-slate-400">เรื่อง</span>
            </span>
          </div>

          {/* Order */}
          <div 
            onClick={() => onFilterType('ORDER')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
              <FileBadge className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">คำสั่ง รพ.สต.</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {orderCount} <span className="text-xs font-normal text-slate-400">ฉบับ</span>
            </span>
          </div>

          {/* Hire Order */}
          <div 
            onClick={() => onFilterType('HIRE_ORDER')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">เลขที่สั่งจ้าง</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {hireCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </span>
          </div>

          {/* Purchase Order */}
          <div 
            onClick={() => onFilterType('PURCHASE_ORDER')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 shadow-xs hover:shadow-md transition-all cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">เลขที่สั่งซื้อ</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {purchaseCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Status Tracker Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>สถานะการดำเนินงานปัจจุบัน</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  รอดำเนินการ (Pending)
                </span>
                <span className="text-slate-700 font-bold">{pendingCount} เรื่อง</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${(pendingCount / (documents.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  กำลังดำเนินการ (Processing)
                </span>
                <span className="text-slate-700 font-bold">{processingCount} เรื่อง</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${(processingCount / (documents.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-indigo-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  รอเกษียร/ลงนาม (Awaiting Signature)
                </span>
                <span className="text-slate-700 font-bold">{awaitingSigCount} เรื่อง</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${(awaitingSigCount / (documents.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  เสร็จสิ้นและจัดเก็บ (Completed)
                </span>
                <span className="text-slate-700 font-bold">{completedCount} เรื่อง</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${(completedCount / (documents.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Procurement Budget Summary Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>สรุปวงเงินจัดซื้อจัดจ้าง (พัสดุและเวชภัณฑ์)</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-medium block">
                รวมวงเงินการจัดซื้อจัดจ้างทั้งสิ้น
              </span>
              <span className="text-2xl font-black text-emerald-950 block mt-0.5">
                {formatCurrency(totalProcurementBudget)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">งานจ้างเหมา (ใบสั่งจ้าง)</span>
                <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">
                  {formatCurrency(hireBudget)}
                </span>
                <span className="text-[10px] text-slate-400">{hireCount} สัญญา</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">งานจัดซื้อเวชภัณฑ์/พัสดุ</span>
                <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">
                  {formatCurrency(purchaseBudget)}
                </span>
                <span className="text-[10px] text-slate-400">{purchaseCount} สัญญา</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
