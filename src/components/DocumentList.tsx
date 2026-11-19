import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  User, 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Eye, 
  QrCode,
  Sparkles,
  SlidersHorizontal,
  FileCheck,
  Pencil,
  Paperclip
} from 'lucide-react';
import { DocumentStatus, DocumentType, Priority, SarabanDoc } from '../types/document';
import { 
  DOC_TYPE_META, 
  formatCurrency, 
  formatThaiDate, 
  formatThaiDateShort, 
  PRIORITY_META, 
  STATUS_META, 
  toArabicNumerals 
} from '../utils/thaiFormat';

interface DocumentListProps {
  documents: SarabanDoc[];
  filterType?: DocumentType | 'ALL';
  onSelectDoc: (doc: SarabanDoc) => void;
  onEditDoc: (doc: SarabanDoc) => void;
  onOpenNewDoc: () => void;
  onQuickStatusChange: (doc: SarabanDoc, newStatus: DocumentStatus) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  filterType = 'ALL',
  onSelectDoc,
  onEditDoc,
  onOpenNewDoc,
  onQuickStatusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'num-desc' | 'num-asc'>('date-desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyBookNo = (e: React.MouseEvent, bookNo: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookNo);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // กรองและค้นหาข้อมูล
  const filteredDocs = useMemo(() => {
    let result = documents;

    // Filter by type
    if (filterType !== 'ALL') {
      result = result.filter((d) => d.type === filterType);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'ALL') {
      result = result.filter((d) => d.speed === priorityFilter);
    }

    // Search query across fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qArabic = toArabicNumerals(q);

      result = result.filter((d) => {
        return (
          d.bookNo.toLowerCase().includes(q) ||
          d.arabicNo.toLowerCase().includes(qArabic) ||
          d.subject.toLowerCase().includes(q) ||
          d.fromDept.toLowerCase().includes(q) ||
          d.toDept.toLowerCase().includes(q) ||
          d.officerInCharge.toLowerCase().includes(q) ||
          (d.contractorOrShop && d.contractorOrShop.toLowerCase().includes(q)) ||
          (d.endorsement && d.endorsement.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'num-desc') {
        return (b.runningNumber || 0) - (a.runningNumber || 0);
      }
      if (sortBy === 'num-asc') {
        return (a.runningNumber || 0) - (b.runningNumber || 0);
      }
      return 0;
    });

    return result;
  }, [documents, filterType, statusFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขที่หนังสือ, เรื่อง, หน่วยงาน, ผู้รับผิดชอบ หรือคำสั่งการ..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="PROCESSING">กำลังดำเนินการ</option>
              <option value="AWAITING_SIGNATURE">รอเกษียร/ลงนาม</option>
              <option value="FORWARDED">ส่งต่อหน่วยงาน</option>
              <option value="COMPLETED">เสร็จสิ้น/จัดเก็บ</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">ชั้นความเร็วทั้งหมด</option>
              <option value="NORMAL">ปกติ</option>
              <option value="URGENT">ด่วน</option>
              <option value="VERY_URGENT">ด่วนมาก</option>
              <option value="MOST_URGENT">ด่วนที่สุด</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="date-desc">วันที่ล่าสุด</option>
              <option value="date-asc">วันที่เก่าสุด</option>
              <option value="num-desc">เลขที่ (มากไปน้อย)</option>
              <option value="num-asc">เลขที่ (น้อยไปมาก)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills if filtered */}
        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>ผลการกรอง: พบ <strong>{filteredDocs.length}</strong> รายการ</span>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:underline font-semibold ml-auto"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* Document List View */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่พบเอกสารตามเงื่อนไขที่ค้นหา</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            คุณสามารถลองค้นหาด้วยคำอื่น หรือกดปุ่มด้านล่างเพื่อออกเลขทะเบียนหนังสือใหม่
          </p>
          <button
            type="button"
            onClick={onOpenNewDoc}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>ออกเลขทะเบียนใหม่</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const typeMeta = DOC_TYPE_META[doc.type];
            const priorityMeta = PRIORITY_META[doc.speed];
            const statusMeta = STATUS_META[doc.status];
            const isUrgent = doc.speed !== 'NORMAL';

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Accent stripe for urgency */}
                {isUrgent && (
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      doc.speed === 'MOST_URGENT'
                        ? 'bg-rose-600 animate-pulse'
                        : doc.speed === 'VERY_URGENT'
                        ? 'bg-orange-500'
                        : 'bg-amber-500'
                    }`}
                  />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  {/* Left: Book Number & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Document Type Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeMeta.badgeBg}`}
                      >
                        {typeMeta.shortLabel}
                      </span>

                      {/* Official Thai Book Number */}
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        {doc.bookNo}
                      </span>

                      {/* Copy book number button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyBookNo(e, doc.bookNo, doc.id)}
                        title="คัดลอกเลขที่หนังสือ"
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                      >
                        {copiedId === doc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Priority Badge */}
                      {doc.speed !== 'NORMAL' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${priorityMeta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotColor}`} />
                          {priorityMeta.label}
                        </span>
                      )}

                      {/* Confidentiality Badge */}
                      {doc.secret !== 'NORMAL' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          {doc.secret === 'TOP_SECRET' ? 'ลับมาก' : 'ลับ'}
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                      {doc.subject}
                    </h3>

                    {/* Meta info: From/To, Due date, Officer */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>ลงวันที่: {formatThaiDate(doc.date)}</span>
                      </div>

                      {doc.type === 'INCOMING' && (
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <span>จาก:</span>
                          <span className="text-slate-800 truncate max-w-[200px]">{doc.fromDept}</span>
                        </div>
                      )}

                      {doc.type === 'OUTGOING' && (
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <span>ถึง:</span>
                          <span className="text-slate-800 truncate max-w-[200px]">{doc.toDept}</span>
                        </div>
                      )}

                      {/* Procurement fields: Amount & Contractor */}
                      {(doc.type === 'HIRE_ORDER' || doc.type === 'PURCHASE_ORDER') && doc.amount !== undefined && (
                        <div className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <span>วงเงิน:</span>
                          <span>{formatCurrency(doc.amount)}</span>
                        </div>
                      )}

                      {doc.contractorOrShop && (
                        <div className="truncate max-w-[180px] text-slate-600">
                          คู่สัญญา: <strong>{doc.contractorOrShop}</strong>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{doc.officerInCharge.split(' ')[0]}</span>
                      </div>

                      {doc.dueDate && (
                        <div className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>กำหนดส่ง: {formatThaiDateShort(doc.dueDate)}</span>
                        </div>
                      )}

                      {(doc.attachmentUrl || doc.attachmentName) && (
                        <div className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[140px]">{doc.attachmentName || 'มีไฟล์แนบ'}</span>
                        </div>
                      )}
                    </div>

                    {/* Director Endorsement / Note snippet */}
                    {doc.endorsement && (
                      <div className="mt-2 text-xs bg-slate-50 border-l-2 border-emerald-600 pl-2.5 py-1 text-slate-700 italic">
                        <strong>เกษียร/คำสั่งการ:</strong> &ldquo;{doc.endorsement}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Right: Status Pill & Quick Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                      >
                        {doc.status === 'COMPLETED' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : doc.status === 'PENDING' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Quick Actions: Edit & View Details */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDoc(doc);
                        }}
                        title="แก้ไขข้อมูลเอกสาร"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>แก้ไข</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                        <span className="hidden sm:inline">ดูรายละเอียด</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
