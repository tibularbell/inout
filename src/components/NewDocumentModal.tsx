import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Inbox, 
  FileBadge, 
  Wrench, 
  ShoppingCart, 
  Sparkles, 
  Paperclip, 
  Camera, 
  CheckCircle2,
  Pencil,
  CalendarClock
} from 'lucide-react';
import { Confidentiality, DocumentStatus, DocumentType, Priority, SarabanDoc, StaffUser } from '../types/document';
import { toArabicNumerals, toThaiNumerals } from '../utils/thaiFormat';
import { getNextRunningNumber } from '../services/storage';
import { loadAgencyConfig } from '../services/agencyConfig';

interface NewDocumentModalProps {
  isOpen: boolean;
  initialType?: DocumentType;
  editingDoc?: SarabanDoc | null;
  currentUser: StaffUser;
  onClose: () => void;
  onSubmit: (docData: Omit<SarabanDoc, 'id' | 'createdAt' | 'updatedAt' | 'logs'>) => Promise<void>;
  isSyncingWithSheets?: boolean;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  initialType = 'OUTGOING',
  editingDoc = null,
  currentUser,
  onClose,
  onSubmit,
}) => {
  const isEditMode = Boolean(editingDoc);

  const [docType, setDocType] = useState<DocumentType>(initialType);
  const [year, setYear] = useState<number>(2570);
  const [useAutoNumber, setUseAutoNumber] = useState(true);
  const [runningNum, setRunningNum] = useState<number>(1);
  const [bookNo, setBookNo] = useState('');
  const [arabicNo, setArabicNo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receivedOrSentDate, setReceivedOrSentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [fromDept, setFromDept] = useState('');
  const [toDept, setToDept] = useState('');
  const [speed, setSpeed] = useState<Priority>('NORMAL');
  const [secret, setSecret] = useState<Confidentiality>('NORMAL');
  const [status, setStatus] = useState<DocumentStatus>('PENDING');
  const [officerInCharge, setOfficerInCharge] = useState(currentUser.name);
  const [signer, setSigner] = useState('นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)');
  const [endorsement, setEndorsement] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Procurement specific
  const [amount, setAmount] = useState<string>('');
  const [contractorOrShop, setContractorOrShop] = useState('');
  const [budgetType, setBudgetType] = useState('เงินบำรุง รพ.สต.บ้านรี');
  const [inspectionDate, setInspectionDate] = useState('');

  // Attachment
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form whenever modal opens or editingDoc changes
  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);

    if (editingDoc) {
      setDocType(editingDoc.type);
      setYear(editingDoc.year || 2569);
      setUseAutoNumber(false);
      setRunningNum(editingDoc.runningNumber || 1);
      setBookNo(editingDoc.bookNo);
      setArabicNo(editingDoc.arabicNo);
      setDate(editingDoc.date);
      setReceivedOrSentDate(editingDoc.receivedOrSentDate || editingDoc.date);
      setSubject(editingDoc.subject);
      setFromDept(editingDoc.fromDept);
      setToDept(editingDoc.toDept);
      setSpeed(editingDoc.speed);
      setSecret(editingDoc.secret);
      setStatus(editingDoc.status);
      setOfficerInCharge(editingDoc.officerInCharge);
      setSigner(editingDoc.signer || 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)');
      setEndorsement(editingDoc.endorsement || '');
      setNotes(editingDoc.notes || '');
      setDueDate(editingDoc.dueDate || '');
      setAmount(editingDoc.amount !== undefined ? String(editingDoc.amount) : '');
      setContractorOrShop(editingDoc.contractorOrShop || '');
      setBudgetType(editingDoc.budgetType || 'เงินบำรุง รพ.สต.บ้านรี');
      setInspectionDate(editingDoc.inspectionDate || '');
      setAttachmentName(editingDoc.attachmentName || null);
      setAttachmentUrl(editingDoc.attachmentUrl || null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const agency = loadAgencyConfig();
      setDocType(initialType);
      setYear(agency.fiscalYear || 2570);
      setUseAutoNumber(true);
      setDate(today);
      setReceivedOrSentDate(today);
      setSubject('');
      setSpeed('NORMAL');
      setSecret('NORMAL');
      setOfficerInCharge(currentUser.name);
      setSigner(`${agency.directorName} (ผอ.${agency.shortName})`);
      setEndorsement('');
      setNotes('');
      setDueDate('');
      setAmount('');
      setContractorOrShop('');
      setBudgetType(`เงินบำรุง ${agency.shortName}`);
      setInspectionDate('');
      setAttachmentName(null);
      setAttachmentUrl(null);
    }
  }, [isOpen, editingDoc, initialType, currentUser.name]);

  // Auto calculate running number & defaults when creating or when user turns on auto number
  useEffect(() => {
    if (!isOpen) return;

    if (useAutoNumber) {
      const next = getNextRunningNumber(docType, year);
      setRunningNum(next.nextRunning);
      setBookNo(next.bookNoThai);
      setArabicNo(next.bookNoArabic);
    }

    if (!editingDoc) {
      const agency = loadAgencyConfig();
      if (docType === 'OUTGOING') {
        setFromDept(agency.fullName);
        setToDept('');
        setStatus('PROCESSING');
      } else if (docType === 'INCOMING') {
        setFromDept('');
        setToDept(agency.fullName);
        setStatus('PENDING');
      } else if (docType === 'ORDER') {
        setFromDept(agency.fullName);
        setToDept('เจ้าหน้าที่ผู้มีรายนามตามคำสั่ง');
        setStatus('COMPLETED');
      } else if (docType === 'DUTY_ORDER') {
        setFromDept(agency.fullName);
        setToDept(`เจ้าหน้าที่ ${agency.shortName} (ปฏิบัติงานนอกเวลา/วันหยุด)`);
        setStatus('COMPLETED');
      } else if (docType === 'HIRE_ORDER') {
        setFromDept(`งานพัสดุ ${agency.shortName}`);
        setToDept('');
        setStatus('PROCESSING');
      } else if (docType === 'PURCHASE_ORDER') {
        setFromDept(`งานเภสัชกรรมและพัสดุ ${agency.shortName}`);
        setToDept('');
        setStatus('AWAITING_SIGNATURE');
      }
    }
  }, [isOpen, docType, year, useAutoNumber, editingDoc]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentUrl(event.target?.result as string);
      };
      reader.onerror = () => {
        setFormError('ไม่สามารถอ่านไฟล์ที่เลือกได้ กรุณาลองใหม่อีกครั้ง');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subject.trim()) {
      setFormError('กรุณาระบุเรื่อง หรือสาระสำคัญของเอกสาร');
      return;
    }
    if (!bookNo.trim()) {
      setFormError('กรุณาระบุเลขที่หนังสือ');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: docType,
        bookNo: bookNo.trim(),
        arabicNo: arabicNo.trim() || toArabicNumerals(bookNo.trim()),
        runningNumber: runningNum,
        year,
        date,
        receivedOrSentDate,
        subject: subject.trim(),
        fromDept: fromDept.trim() || 'รพ.สต.บ้านรี',
        toDept: toDept.trim() || 'รพ.สต.บ้านรี',
        speed,
        secret,
        status,
        officerInCharge,
        signer,
        endorsement: endorsement.trim() || undefined,
        notes: notes.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        contractorOrShop: contractorOrShop.trim() || undefined,
        budgetType: budgetType.trim() || undefined,
        inspectionDate: inspectionDate || undefined,
        dueDate: dueDate || undefined,
        attachmentName: attachmentName || undefined,
        attachmentUrl: attachmentUrl || undefined,
      });

      onClose();
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการบันทึกเอกสาร');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeTabs: Array<{ id: DocumentType; label: string; icon: React.ReactNode }> = [
    { id: 'OUTGOING', label: 'เลขที่ส่ง', icon: <Send className="w-4 h-4" /> },
    { id: 'INCOMING', label: 'เลขที่รับ', icon: <Inbox className="w-4 h-4" /> },
    { id: 'ORDER', label: 'คำสั่ง', icon: <FileBadge className="w-4 h-4" /> },
    { id: 'DUTY_ORDER', label: 'คำสั่งเวรยาม', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'HIRE_ORDER', label: 'เลขที่สั่งจ้าง', icon: <Wrench className="w-4 h-4" /> },
    { id: 'PURCHASE_ORDER', label: 'เลขที่สั่งซื้อ', icon: <ShoppingCart className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className={`px-5 py-4 text-white flex items-center justify-between flex-shrink-0 ${isEditMode ? 'bg-amber-900' : 'bg-emerald-900'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditMode ? 'bg-amber-800 text-amber-200' : 'bg-emerald-800 text-emerald-300'}`}>
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isEditMode ? `แก้ไขข้อมูลเอกสาร (${editingDoc?.bookNo})` : 'ออกเลขทะเบียนเอกสารใหม่'}
              </h2>
              <p className={`text-xs ${isEditMode ? 'text-amber-200' : 'text-emerald-200'}`}>
                โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี (พ.ศ. {toThaiNumerals(year)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-black/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Type Selector Tabs */}
        <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {typeTabs.map((t) => {
              const active = docType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocType(t.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              ⚠️ {formError}
            </div>
          )}

          {/* Auto Running Number Section */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>เลขที่ทะเบียนประจำปี พ.ศ.</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="text-xs font-bold bg-white border border-emerald-300 rounded-lg px-2 py-0.5 text-emerald-900 focus:outline-hidden"
                >
                  <option value={2569}>๒๕๖๙</option>
                  <option value={2570}>๒๕๗๐</option>
                  <option value={2571}>๒๕๗๑</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">รันเลขอัตโนมัติ:</span>
                <input
                  type="checkbox"
                  id="autoNumToggle"
                  checked={useAutoNumber}
                  onChange={(e) => setUseAutoNumber(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  เลขที่แบบทางการ (เลขไทย)
                </label>
                <input
                  type="text"
                  value={bookNo}
                  onChange={(e) => {
                    setBookNo(e.target.value);
                    if (useAutoNumber) setUseAutoNumber(false);
                  }}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="เช่น สธ ๐๕๑๒.๐๓/๑๖"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  เลขอารบิกสำหรับค้นหา
                </label>
                <input
                  type="text"
                  value={arabicNo}
                  onChange={(e) => setArabicNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="เช่น สธ 0512.03/16"
                />
              </div>
            </div>
          </div>

          {/* Subject (เรื่อง) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
              <label className="text-xs font-bold text-slate-800">
                เรื่อง (สาระสำคัญของเอกสาร) <span className="text-rose-600">*</span>
              </label>
              {docType === 'DUTY_ORDER' && (
                <button
                  type="button"
                  onClick={() =>
                    setSubject(
                      'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ ()'
                    )
                  }
                  className="text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md transition-colors"
                >
                  + ใช้ข้อความมาตรฐานเวรยาม
                </button>
              )}
            </div>
            <textarea
              required
              rows={2}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
              placeholder={
                docType === 'DUTY_ORDER'
                  ? 'เช่น ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ (มิถุนายน69)'
                  : 'ระบุชื่อเรื่อง วัตถุประสงค์ หรือสาระสำคัญของหนังสือราชการ...'
              }
            />
          </div>

          {/* Date & Received/Sent Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ลงวันที่ในหนังสือ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {docType === 'INCOMING' ? 'วันที่รับเข้า รพ.สต.' : 'วันที่ดำเนินการ / ส่งออก'}
              </label>
              <input
                type="date"
                value={receivedOrSentDate}
                onChange={(e) => setReceivedOrSentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* From & To Departments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                จาก (หน่วยงาน/ผู้ส่ง)
              </label>
              <input
                type="text"
                value={fromDept}
                onChange={(e) => setFromDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                placeholder="เช่น สสอ.ดอนพุด, รพ.ดอนพุด, อบต.บ้านรี"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ถึง (หน่วยงาน/ผู้รับ)
              </label>
              <input
                type="text"
                value={toDept}
                onChange={(e) => setToDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                placeholder="เช่น ผอ.รพ.สต.บ้านรี, สสจ.สระบุรี"
              />
            </div>
          </div>

          {/* Priority, Secret & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ชั้นความเร็ว
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="NORMAL">ปกติ</option>
                <option value="URGENT">ด่วน</option>
                <option value="VERY_URGENT">ด่วนมาก</option>
                <option value="MOST_URGENT">ด่วนที่สุด</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ชั้นความลับ
              </label>
              <select
                value={secret}
                onChange={(e) => setSecret(e.target.value as Confidentiality)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="NORMAL">ทั่วไป</option>
                <option value="CONFIDENTIAL">ลับ</option>
                <option value="TOP_SECRET">ลับมาก</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isEditMode ? 'สถานะเอกสาร' : 'สถานะแรกเริ่ม'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="PENDING">รอดำเนินการ</option>
                <option value="PROCESSING">กำลังดำเนินการ</option>
                <option value="AWAITING_SIGNATURE">รอเกษียร/ลงนาม</option>
                <option value="FORWARDED">ส่งต่อหน่วยงาน</option>
                <option value="COMPLETED">เสร็จสิ้น/จัดเก็บ</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields: Hire & Purchase Orders */}
          {(docType === 'HIRE_ORDER' || docType === 'PURCHASE_ORDER') && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-800" />
                <span>ข้อมูลจัดซื้อ / จ้างพัสดุและเวชภัณฑ์</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    วงเงินงบประมาณ (บาท)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="เช่น 15000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {docType === 'HIRE_ORDER' ? 'ผู้รับจ้าง/ห้างหุ้นส่วน' : 'ร้านค้า/ผู้จัดจำหน่าย'}
                  </label>
                  <input
                    type="text"
                    value={contractorOrShop}
                    onChange={(e) => setContractorOrShop(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="เช่น หจก. หรือ ร้านค้าคู่สัญญา..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    แหล่งงบประมาณ
                  </label>
                  <select
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="เงินบำรุง รพ.สต.บ้านรี">เงินบำรุง รพ.สต.บ้านรี</option>
                    <option value="งบ UC (กองทุนหลักประกันสุขภาพ)">งบ UC (กองทุนหลักประกันสุขภาพ)</option>
                    <option value="งบ PPA (สร้างเสริมสุขภาพและป้องกันโรค)">งบ PPA (สร้างเสริมสุขภาพฯ)</option>
                    <option value="งบ อปท. (กองทุนสุขภาพตำบลบ้านรี)">งบ อปท. (กองทุนสุขภาพตำบล)</option>
                    <option value="งบประมาณจัดสรรจาก สสจ.">งบประมาณจัดสรรจาก สสจ.</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    กำหนดตรวจรับพัสดุ / ส่งมอบงาน
                  </label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Officer in charge & Due date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                เจ้าหน้าที่ผู้รับผิดชอบ / เจ้าของเรื่อง
              </label>
              <input
                type="text"
                value={officerInCharge}
                onChange={(e) => setOfficerInCharge(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                กำหนดแล้วเสร็จ / ส่งรายงาน (ถ้ามี)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Signer & Endorsement (especially useful when editing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ผู้ลงนาม / อำนาจสั่งการ
              </label>
              <input
                type="text"
                value={signer}
                onChange={(e) => setSigner(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                หมายเหตุ / เลขที่หนังสือต้นทาง
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                placeholder="เช่น หนังสือต้นทางเลขที่ สธ ๐๐๓๒/ว ๑๑๕"
              />
            </div>
          </div>

          {isEditMode && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                คำสั่งการ / การเกษียรหนังสือ (แก้ไขเพิ่มเติม)
              </label>
              <input
                type="text"
                value={endorsement}
                onChange={(e) => setEndorsement(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                placeholder="ระบุคำสั่งการ/การเกษียร..."
              />
            </div>
          )}

          {/* Smartphone Camera / File Attachment */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-3 bg-slate-50/60">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                <span>แนบไฟล์รูปถ่าย / เอกสาร PDF</span>
              </span>
              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-xs">
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>{attachmentName ? 'เปลี่ยนไฟล์ใหม่' : 'ถ่ายรูป / เลือกไฟล์'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {attachmentName && (
              <div className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="truncate">📎 {attachmentName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName(null);
                    setAttachmentUrl(null);
                  }}
                  title="ลบไฟล์แนบ"
                  className="text-rose-600 hover:text-rose-800 font-bold ml-2"
                >
                  ✕ ลบไฟล์
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            * ระบบจะบันทึกลงฐานข้อมูลและซิงค์ Google Sheets ทันที
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                isEditMode ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-800 hover:bg-emerald-900'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกและออกเลข'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
