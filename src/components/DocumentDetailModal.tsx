import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  QrCode, 
  Printer, 
  Share2, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  History, 
  ArrowRight, 
  FileText, 
  Send, 
  FileBadge, 
  Wrench, 
  ShoppingCart,
  Copy,
  Check,
  Paperclip,
  ExternalLink,
  Download,
  Eye,
  Pencil,
  AlertCircle,
  FileDown,
  Loader2
} from 'lucide-react';
import { DocumentStatus, SarabanDoc, StaffUser } from '../types/document';
import { 
  DOC_TYPE_META, 
  formatCurrency, 
  formatThaiDate, 
  PRIORITY_META, 
  STATUS_META, 
  toArabicNumerals, 
  toThaiNumerals 
} from '../utils/thaiFormat';
import { resolveDocumentAttachment } from '../services/attachmentStore';
import { exportCoverSlipPdf } from '../services/pdfExport';

interface DocumentDetailModalProps {
  doc: SarabanDoc | null;
  currentUser: StaffUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (newStatus: DocumentStatus, comment?: string) => Promise<void>;
  onAddEndorsement: (endorsementText: string) => Promise<void>;
  onEditRequest: (doc: SarabanDoc) => void;
  onDeleteRequest: (doc: SarabanDoc) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  doc,
  currentUser,
  isOpen,
  onClose,
  onUpdateStatus,
  onAddEndorsement,
  onEditRequest,
  onDeleteRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'endorsement' | 'history' | 'qrcode'>('info');
  const [endorsementInput, setEndorsementInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resolvedAttachment, setResolvedAttachment] = useState<{
    url: string;
    mimeType: string;
    isObjectUrl: boolean;
  } | null>(null);
  const [attachmentError, setAttachmentError] = useState(false);

  // Resolve data: URL or IndexedDB attachment into a safe Blob URL whenever doc changes
  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    setResolvedAttachment(null);
    setAttachmentError(false);
    setIsPreviewOpen(false);
    setPdfStatus(null);

    if (isOpen && doc && (doc.attachmentUrl || doc.attachmentName)) {
      resolveDocumentAttachment(doc.id, doc.attachmentUrl, doc.attachmentName)
        .then((res) => {
          if (!active) {
            if (res?.isObjectUrl) URL.revokeObjectURL(res.url);
            return;
          }
          if (res) {
            if (res.isObjectUrl) objectUrlToRevoke = res.url;
            setResolvedAttachment(res);
          } else {
            setAttachmentError(true);
          }
        })
        .catch(() => {
          if (active) setAttachmentError(true);
        });
    }

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [isOpen, doc?.id, doc?.attachmentUrl, doc?.attachmentName]);

  if (!isOpen || !doc) return null;

  const typeMeta = DOC_TYPE_META[doc.type];
  const priorityMeta = PRIORITY_META[doc.speed];
  const statusMeta = STATUS_META[doc.status];

  const handleCopyNo = () => {
    navigator.clipboard.writeText(doc.bookNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndorseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsementInput.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddEndorsement(endorsementInput.trim());
      setEndorsementInput('');
      setActiveTab('info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfStatus(null);
    try {
      const filename = await exportCoverSlipPdf(doc);
      setPdfStatus({
        type: 'success',
        message: `บันทึกไฟล์ PDF (${filename}) ลงเครื่องเรียบร้อยแล้ว`,
      });
      setTimeout(() => setPdfStatus(null), 5000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setPdfStatus({
        type: 'error',
        message: 'ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใช้ปุ่ม "สั่งพิมพ์ใบปะหน้า" แล้วเลือก Save as PDF แทน',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // QR Code URL: generates SVG data URL using simple encoding or qr server
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `รพ.สต.บ้านรี | ทะเบียน: ${doc.bookNo} | เรื่อง: ${doc.subject} | สถานะ: ${statusMeta.label}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in print:hidden">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${typeMeta.badgeBg}`}>
              {typeMeta.label}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{doc.bookNo}</span>
                <button
                  type="button"
                  onClick={handleCopyNo}
                  className="p-1 text-emerald-300 hover:text-white rounded"
                  title="คัดลอกเลขที่หนังสือ"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </h2>
              <p className="text-xs text-emerald-200">โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onEditRequest(doc)}
              title="แก้ไขข้อมูลเอกสารกรณีบันทึกผิด"
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              title="บันทึกใบปะหน้าเป็นไฟล์ PDF ลงเครื่อง"
              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-sky-400/50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Export as PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSlip}
              title="สั่งพิมพ์ใบปะหน้าเอกสารราชการ"
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-emerald-600/60"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">สั่งพิมพ์ใบปะหน้า</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {pdfStatus && (
          <div
            className={`px-5 py-2 text-xs font-semibold flex items-center justify-between gap-2 border-b ${
              pdfStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{pdfStatus.message}</span>
            <button
              type="button"
              onClick={() => setPdfStatus(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-slate-50 border-b border-slate-200 flex-shrink-0 print:hidden">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ข้อมูลเอกสาร
          </button>
          <button
            onClick={() => setActiveTab('endorsement')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'endorsement'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>เกษียร/คำสั่งการ</span>
            {doc.endorsement && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>ประวัติไทม์ไลน์</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {doc.logs?.length || 1}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'qrcode'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR ติดตาม</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              
              {/* Status & Priority Ribbon */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">สถานะปัจจุบัน:</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">ชั้นความเร็ว:</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${priorityMeta.badgeClass}`}>
                    {priorityMeta.label}
                  </span>
                  {doc.secret !== 'NORMAL' && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      {doc.secret === 'TOP_SECRET' ? 'ลับมาก' : 'ลับ'}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {doc.subject}
                </h3>
                {doc.notes && (
                  <p className="mt-1 text-xs text-slate-500">
                    หมายเหตุ/อ้างอิง: {doc.notes}
                  </p>
                )}
              </div>

              {/* Primary Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">ลงวันที่ในเอกสาร</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatThaiDate(doc.date)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">
                    {doc.type === 'INCOMING' ? 'วันที่รับเข้า รพ.สต.' : 'วันที่ดำเนินการ/ส่งออก'}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatThaiDate(doc.receivedOrSentDate || doc.date)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">จาก (ต้นทาง)</span>
                  <span className="font-bold text-slate-800">{doc.fromDept}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">ถึง (ปลายทาง)</span>
                  <span className="font-bold text-slate-800">{doc.toDept}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">เจ้าหน้าที่ผู้รับผิดชอบ</span>
                  <span className="font-bold text-slate-800">{doc.officerInCharge}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold block">ผู้ลงนาม / อำนาจสั่งการ</span>
                  <span className="font-bold text-slate-800">{doc.signer || 'ผอ.รพ.สต.บ้านรี'}</span>
                </div>
              </div>

              {/* Procurement Information if Hire/Purchase Order */}
              {(doc.type === 'HIRE_ORDER' || doc.type === 'PURCHASE_ORDER') && doc.amount !== undefined && (
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-800" />
                    <span>ข้อมูลจัดซื้อ / สั่งจ้าง</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">วงเงินงบประมาณ</span>
                      <span className="font-extrabold text-base text-emerald-800">
                        {formatCurrency(doc.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ผู้รับจ้าง/ร้านค้า</span>
                      <span className="font-bold text-slate-800">{doc.contractorOrShop || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">แหล่งงบประมาณ</span>
                      <span className="font-bold text-slate-800">{doc.budgetType || 'เงินบำรุง รพ.สต.'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Endorsement preview if exists */}
              {doc.endorsement && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">
                      การเกษียรหนังสือ / คำสั่งการของ ผอ.รพ.สต.บ้านรี
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                    &ldquo;{doc.endorsement}&rdquo;
                  </p>
                </div>
              )}

              {/* Attachment if exists */}
              {(doc.attachmentUrl || doc.attachmentName) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 min-w-0">
                      <Paperclip className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{doc.attachmentName || 'เอกสารแนบ'}</span>
                    </div>

                    {resolvedAttachment ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPreviewOpen ? 'ซ่อนตัวอย่าง' : 'เปิดดูในหน้านี้'}</span>
                        </button>

                        <a
                          href={resolvedAttachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 text-emerald-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>เปิดแท็บใหม่</span>
                        </a>

                        <a
                          href={resolvedAttachment.url}
                          download={doc.attachmentName || 'document.pdf'}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ดาวน์โหลด</span>
                        </a>
                      </div>
                    ) : attachmentError ? (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ไม่พบข้อมูลไฟล์ (กดปุ่ม &ldquo;แก้ไข&rdquo; เพื่อแนบไฟล์ใหม่)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">กำลังเตรียมไฟล์เอกสาร...</span>
                    )}
                  </div>

                  {/* Inline Document Viewer (Works reliably for PDF & Images without top-frame data URL blocks) */}
                  {isPreviewOpen && resolvedAttachment && (
                    <div className="border-t border-slate-200 bg-slate-900/5 p-3 space-y-2">
                      {resolvedAttachment.mimeType.startsWith('image/') ? (
                        <div className="flex justify-center bg-white rounded-xl p-2 border border-slate-200">
                          <img
                            src={resolvedAttachment.url}
                            alt={doc.attachmentName || 'เอกสารแนบ'}
                            className="max-h-[60vh] w-auto object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <iframe
                            src={resolvedAttachment.url}
                            title={doc.attachmentName || 'PDF Preview'}
                            className="w-full h-[60vh] min-h-[380px] border-0"
                          />
                          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                            <span>หากอุปกรณ์มือถือไม่แสดงผล PDF ในกรอบ ให้กดปุ่ม &ldquo;ดาวน์โหลด&rdquo; หรือ &ldquo;เปิดแท็บใหม่&rdquo;</span>
                            <a
                              href={resolvedAttachment.url}
                              download={doc.attachmentName || 'document.pdf'}
                              className="text-emerald-700 font-bold hover:underline flex-shrink-0"
                            >
                              ดาวน์โหลด PDF
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Status Update Selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  อัปเดตสถานะการดำเนินงาน (Real-time Tracking)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['PENDING', 'PROCESSING', 'AWAITING_SIGNATURE', 'FORWARDED', 'COMPLETED'] as DocumentStatus[]).map((st) => {
                    const isCur = doc.status === st;
                    const smeta = STATUS_META[st];
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateStatus(st)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                          isCur
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <span>{smeta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB: ENDORSEMENT (การเกษียรหนังสือ) */}
          {activeTab === 'endorsement' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <p className="font-bold text-sm mb-1">✍️ บันทึกการเกษียรหนังสือ / คำสั่งการ</p>
                <p className="text-slate-600">
                  สำหรับผู้อำนวยการ รพ.สต.บ้านรี หรือผู้รับมอบหมายอำนาจในการสั่งการ มอบหมายเจ้าหน้าที่ผู้ปฏิบัติ และระบุกำหนดส่งงาน
                </p>
              </div>

              {doc.endorsement && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    คำสั่งการที่บันทึกไว้ปัจจุบัน:
                  </span>
                  <p className="text-sm font-semibold text-slate-800 whitespace-pre-line">
                    &ldquo;{doc.endorsement}&rdquo;
                  </p>
                </div>
              )}

              <form onSubmit={handleEndorseSubmit} className="space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  เขียนข้อความเกษียรหนังสือ / สั่งการใหม่:
                </label>
                <textarea
                  rows={4}
                  required
                  value={endorsementInput}
                  onChange={(e) => setEndorsementInput(e.target.value)}
                  placeholder="เช่น มอบ พว.สุดารัตน์ ดำเนินการตามเสนอ และสรุปรายงานภายในวันที่..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    ลงนามในฐานะ: <strong>{currentUser.name}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || !endorsementInput.trim()}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคำสั่งการเกษียร'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: HISTORY / AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-semibold mb-2">
                ประวัติการดำเนินการทั้งหมดของเอกสาร (Audit Log เพื่อความปลอดภัยและโปร่งใส)
              </div>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {doc.logs?.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs" />
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-slate-400">{formatThaiDate(log.timestamp, true)}</span>
                      </div>
                      <p className="text-xs text-slate-600">{log.details}</p>
                      <div className="mt-1.5 text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        <span>โดย: {log.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: QR CODE */}
          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                <img
                  src={qrUrl}
                  alt={`QR Code for ${doc.bookNo}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">{doc.bookNo}</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  สแกนผ่านกล้องสมาร์ทโฟนของเจ้าหน้าที่ เพื่อตรวจสอบสถานะและประวัติเอกสารได้ทันที
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>{isExportingPdf ? 'กำลังสร้างไฟล์ PDF...' : 'Export as PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบปะหน้าพร้อม QR Code</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer with Print, PDF Export, Edit & Destructive Action Buttons */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'Export as PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSlip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>สั่งพิมพ์ใบปะหน้า</span>
            </button>

            <button
              type="button"
              onClick={() => onEditRequest(doc)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลเอกสาร</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteRequest(doc)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xs:inline">ลบ/ยกเลิกเอกสารนี้</span>
              <span className="xs:hidden">ลบ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
