import { AuditLogEntry, DocumentType, RealtimeAlert, SarabanDoc } from '../types/document';
import { toArabicNumerals, toThaiNumerals } from '../utils/thaiFormat';
import { playNotificationSound, playUrgentSound } from './sound';
import { deleteAttachmentFromIDB, saveAttachmentToIDB } from './attachmentStore';
import { loadAgencyConfig } from './agencyConfig';

const STORAGE_KEY_DOCS = 'banri_saraban_documents_v1';
const STORAGE_KEY_ALERTS = 'banri_saraban_alerts_v1';
const STORAGE_KEY_DUTY_SEEDED = 'banri_saraban_duty_seeded_v1';

// BroadcastChannel สำหรับซิงค์สถานะข้ามแท็บและจำลองเรียลไทม์
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('banri_saraban_realtime') 
  : null;

const INITIAL_DUTY_DOCS: SarabanDoc[] = [
  {
    id: 'doc-duty-001',
    type: 'DUTY_ORDER',
    bookNo: '1/2569',
    arabicNo: '1/2569',
    runningNumber: 1,
    year: 2569,
    date: '2026-01-25',
    receivedOrSentDate: '2026-01-25',
    subject: 'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ (กพ.69)',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ รพ.สต.บ้านรี (ปฏิบัติงานนอกเวลา/วันหยุด)',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
    signer: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)',
    notes: '',
    logs: [
      {
        id: 'log-duty-1',
        timestamp: '2026-01-25T08:30:00Z',
        action: 'ลงทะเบียนคำสั่งเวรยาม',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ออกคำสั่งเวรยามที่ 1/2569 (กพ.69)',
      },
    ],
    createdAt: '2026-01-25T08:30:00Z',
    updatedAt: '2026-01-25T08:30:00Z',
  },
  {
    id: 'doc-duty-002',
    type: 'DUTY_ORDER',
    bookNo: '2/2569',
    arabicNo: '2/2569',
    runningNumber: 2,
    year: 2569,
    date: '2026-02-25',
    receivedOrSentDate: '2026-02-25',
    subject: 'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ (มีนาคม69)',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ รพ.สต.บ้านรี (ปฏิบัติงานนอกเวลา/วันหยุด)',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
    signer: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)',
    notes: '',
    logs: [
      {
        id: 'log-duty-2',
        timestamp: '2026-02-25T08:30:00Z',
        action: 'ลงทะเบียนคำสั่งเวรยาม',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ออกคำสั่งเวรยามที่ 2/2569 (มีนาคม69)',
      },
    ],
    createdAt: '2026-02-25T08:30:00Z',
    updatedAt: '2026-02-25T08:30:00Z',
  },
  {
    id: 'doc-duty-003',
    type: 'DUTY_ORDER',
    bookNo: '3/2569',
    arabicNo: '3/2569',
    runningNumber: 3,
    year: 2569,
    date: '2026-03-29',
    receivedOrSentDate: '2026-03-29',
    subject: 'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ (เมษายน69)',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ รพ.สต.บ้านรี (ปฏิบัติงานนอกเวลา/วันหยุด)',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
    signer: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)',
    notes: '',
    logs: [
      {
        id: 'log-duty-3',
        timestamp: '2026-03-29T08:30:00Z',
        action: 'ลงทะเบียนคำสั่งเวรยาม',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ออกคำสั่งเวรยามที่ 3/2569 (เมษายน69)',
      },
    ],
    createdAt: '2026-03-29T08:30:00Z',
    updatedAt: '2026-03-29T08:30:00Z',
  },
  {
    id: 'doc-duty-004',
    type: 'DUTY_ORDER',
    bookNo: '4/2569',
    arabicNo: '4/2569',
    runningNumber: 4,
    year: 2569,
    date: '2026-04-08',
    receivedOrSentDate: '2026-04-08',
    subject: 'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาช่วงเทศกาลสงกรานต์ 2569',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ รพ.สต.บ้านรี (เวรเทศกาลสงกรานต์ ๒๕๖๙)',
    speed: 'URGENT',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
    signer: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)',
    notes: '',
    logs: [
      {
        id: 'log-duty-4',
        timestamp: '2026-04-08T08:30:00Z',
        action: 'ลงทะเบียนคำสั่งเวรยาม',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ออกคำสั่งเวรยามที่ 4/2569 (เทศกาลสงกรานต์ 2569)',
      },
    ],
    createdAt: '2026-04-08T08:30:00Z',
    updatedAt: '2026-04-08T08:30:00Z',
  },
  {
    id: 'doc-duty-005',
    type: 'DUTY_ORDER',
    bookNo: '5/2569',
    arabicNo: '5/2569',
    runningNumber: 5,
    year: 2569,
    date: '2026-04-29',
    receivedOrSentDate: '2026-04-29',
    subject: 'ให้เจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ (พฤษภาคม69)',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ รพ.สต.บ้านรี (ปฏิบัติงานนอกเวลา/วันหยุด)',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
    signer: 'นายสมพงษ์ มลิวัลย์ (ผอ.รพ.สต.บ้านรี)',
    notes: '',
    logs: [
      {
        id: 'log-duty-5',
        timestamp: '2026-04-29T08:30:00Z',
        action: 'ลงทะเบียนคำสั่งเวรยาม',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ออกคำสั่งเวรยามที่ 5/2569 (พฤษภาคม69)',
      },
    ],
    createdAt: '2026-04-29T08:30:00Z',
    updatedAt: '2026-04-29T08:30:00Z',
  },
];

// ข้อมูลจำลองเริ่มต้นของ รพ.สต.บ้านรี ประจำปี พ.ศ. 2569
const INITIAL_DOCS: SarabanDoc[] = [
  {
    id: 'doc-in-001',
    type: 'INCOMING',
    bookNo: 'รับ ๔๒/๒๕๖๙',
    arabicNo: 'รับ 42/2569',
    runningNumber: 42,
    year: 2569,
    date: '2026-11-08',
    receivedOrSentDate: '2026-11-09',
    subject: 'ขอเชิญประชุมชี้แจงแนวทางการรณรงค์ฉีดวัคซีนไข้หวัดใหญ่กลุ่มเสี่ยง ประจำปี ๒๕๗๐',
    fromDept: 'สำนักงานสาธารณสุขอำเภอเมืองอ่างทอง',
    toDept: 'ผู้อำนวยการโรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    speed: 'VERY_URGENT',
    secret: 'NORMAL',
    status: 'PROCESSING',
    officerInCharge: 'พว.สุดารัตน์ ใจดี (พยาบาลวิชาชีพชำนาญการ)',
    signer: 'ผอ.รพ.สต.บ้านรี',
    endorsement: 'มอบ พว.สุดารัตน์ เข้าร่วมประชุมและสรุปแผนจัดสรรวัคซีนให้กลุ่ม 608 ในพื้นที่ ต.บ้านรี',
    notes: 'หนังสือต้นทางเลขที่ อท ๐๐๓๒/ว ๑๑๕ ลงวันที่ ๗ พ.ย. ๖๙',
    dueDate: '2026-11-15',
    logs: [
      {
        id: 'log-1',
        timestamp: '2026-11-09T08:30:00Z',
        action: 'รับเข้าเอกสารและลงทะเบียนรับ',
        user: 'นางสาวมาลี รักงาน (จพ.ธุรการ)',
        details: 'ลงรับหนังสือรับเข้าเลขที่ รับ ๔๒/๒๕๖๙',
      },
      {
        id: 'log-2',
        timestamp: '2026-11-09T10:15:00Z',
        action: 'เกษียรหนังสือสั่งการ',
        user: 'นายแพทย์สมชาย ชูเกียรติ (รักษาการ ผอ.รพ.สต.บ้านรี)',
        details: 'เกษียรหนังสือมอบหมาย พว.สุดารัตน์',
      },
    ],
    createdAt: '2026-11-09T08:30:00Z',
    updatedAt: '2026-11-09T10:15:00Z',
  },
  {
    id: 'doc-out-001',
    type: 'OUTGOING',
    bookNo: 'สธ ๐๕๑๒.๐๓/๑๕',
    arabicNo: 'สธ 0512.03/15',
    runningNumber: 15,
    year: 2569,
    date: '2026-11-10',
    receivedOrSentDate: '2026-11-10',
    subject: 'รายงานสรุปผลการดำเนินงานเฝ้าระวังโรคไข้เลือดออกและสำรวจดัชนีลูกน้ำยุงลาย ประจำเดือนตุลาคม ๒๕๖๙',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'สาธารณสุขอำเภอเมืองอ่างทอง',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'COMPLETED',
    officerInCharge: 'นายสมบัติ พิทักษ์ไทย (นักวิชาการสาธารณสุขปฏิบัติการ)',
    signer: 'นายแพทย์สมชาย ชูเกียรติ (ผอ.รพ.สต.บ้านรี)',
    endorsement: 'อนุมัติส่งรายงานเรียบร้อยแล้ว',
    notes: 'ส่งผ่านระบบ e-Document สสอ. และส่งสำเนาให้อบต.บ้านรี',
    logs: [
      {
        id: 'log-3',
        timestamp: '2026-11-10T09:00:00Z',
        action: 'สร้างหนังสือส่งออก',
        user: 'นายสมบัติ พิทักษ์ไทย',
        details: 'ออกเลขที่ สธ ๐๕๑๒.๐๓/๑๕',
      },
      {
        id: 'log-4',
        timestamp: '2026-11-10T14:20:00Z',
        action: 'ส่งออกหนังสือและจัดเก็บ',
        user: 'นางสาวมาลี รักงาน',
        details: 'นำส่งปลายทางเรียบร้อยแล้ว',
      },
    ],
    createdAt: '2026-11-10T09:00:00Z',
    updatedAt: '2026-11-10T14:20:00Z',
  },
  {
    id: 'doc-ord-001',
    type: 'ORDER',
    bookNo: 'คำสั่ง รพ.สต.บ้านรี ที่ ๘/๒๕๖๙',
    arabicNo: 'คำสั่ง รพ.สต.บ้านรี ที่ 8/2569',
    runningNumber: 8,
    year: 2569,
    date: '2026-11-01',
    subject: 'แต่งตั้งคณะกรรมการตรวจนับและควบคุมยาเสพติดให้โทษและวัตถุออกฤทธิ์ต่อจิตและประสาท ประจำปีงบประมาณ ๒๕๗๐',
    fromDept: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี',
    toDept: 'เจ้าหน้าที่ผู้มีรายนามตามคำสั่ง',
    speed: 'NORMAL',
    secret: 'CONFIDENTIAL',
    status: 'COMPLETED',
    officerInCharge: 'ภก.นิธิพงศ์ สุขสันต์ (เภสัชกรชำนาญการ)',
    signer: 'นายแพทย์สมชาย ชูเกียรติ (ผอ.รพ.สต.บ้านรี)',
    notes: 'มีผลบังคับใช้ตั้งแต่วันที่ ๑ พฤศจิกายน ๒๕๖๙ เป็นต้นไป',
    logs: [
      {
        id: 'log-5',
        timestamp: '2026-11-01T11:00:00Z',
        action: 'ออกคำสั่งและลงนาม',
        user: 'นายแพทย์สมชาย ชูเกียรติ',
        details: 'ลงนามคำสั่งและประกาศเวียนเจ้าหน้าที่',
      },
    ],
    createdAt: '2026-11-01T11:00:00Z',
    updatedAt: '2026-11-01T11:00:00Z',
  },
  {
    id: 'doc-hire-001',
    type: 'HIRE_ORDER',
    bookNo: 'จ. ๐๓/๒๕๖๙',
    arabicNo: 'จ. 03/2569',
    runningNumber: 3,
    year: 2569,
    date: '2026-11-05',
    subject: 'จ้างเหมาบำรุงรักษาและล้างเครื่องปรับอากาศประจำห้องตรวจโรคและห้องเก็บคลังยา จำนวน ๕ เครื่อง',
    fromDept: 'งานพัสดุและอาคารสถานที่ รพ.สต.บ้านรี',
    toDept: 'ห้างหุ้นส่วนจำกัด อ่างทองแอร์เซอร์วิส',
    speed: 'NORMAL',
    secret: 'NORMAL',
    status: 'PROCESSING',
    officerInCharge: 'นายสุรชัย มั่นคง (เจ้าพนักงานพัสดุปฏิบัติงาน)',
    signer: 'นายแพทย์สมชาย ชูเกียรติ (ผอ.รพ.สต.บ้านรี)',
    amount: 4500,
    contractorOrShop: 'หจก. อ่างทองแอร์เซอร์วิส (โทร. 081-9988776)',
    budgetType: 'เงินบำรุง รพ.สต.บ้านรี ประจำปี ๒๕๗๐',
    dueDate: '2026-11-12',
    inspectionDate: '2026-11-12',
    notes: 'นัดหมายเข้าดำเนินงานล้างเครื่องปรับอากาศวันพฤหัสบดีที่ ๑๒ พ.ย. ๖๙',
    logs: [
      {
        id: 'log-6',
        timestamp: '2026-11-05T13:30:00Z',
        action: 'ออกใบสั่งจ้าง',
        user: 'นายสุรชัย มั่นคง',
        details: 'ทำใบสั่งจ้าง จ. ๐๓/๒๕๖๙ วงเงิน ๔,๕๐๐ บาท',
      },
    ],
    createdAt: '2026-11-05T13:30:00Z',
    updatedAt: '2026-11-05T13:30:00Z',
  },
  {
    id: 'doc-buy-001',
    type: 'PURCHASE_ORDER',
    bookNo: 'ซ. ๑๒/๒๕๖๙',
    arabicNo: 'ซ. 12/2569',
    runningNumber: 12,
    year: 2569,
    date: '2026-11-07',
    subject: 'จัดซื้อวัสดุการแพทย์และน้ำยาตรวจน้ำตาลในเลือด (Glucose Strip) สำหรับคลินิก NCDs ชุมชน',
    fromDept: 'งานเภสัชกรรมและคุ้มครองผู้บริโภค รพ.สต.บ้านรี',
    toDept: 'บริษัท สยามเมดิคอล ซัพพลาย จำกัด',
    speed: 'URGENT',
    secret: 'NORMAL',
    status: 'AWAITING_SIGNATURE',
    officerInCharge: 'พว.สุดารัตน์ ใจดี (พยาบาลวิชาชีพชำนาญการ)',
    signer: 'นายแพทย์สมชาย ชูเกียรติ (ผอ.รพ.สต.บ้านรี)',
    amount: 18500,
    contractorOrShop: 'บจก. สยามเมดิคอล ซัพพลาย',
    budgetType: 'งบประมาณกองทุนหลักประกันสุขภาพตำบลบ้านรี (กปท.)',
    dueDate: '2026-11-20',
    notes: 'เพื่อรองรับผู้ป่วยเบาหวาน-ความดันโลหิตสูงในเขตความรับผิดชอบ ๕ หมู่บ้าน',
    logs: [
      {
        id: 'log-7',
        timestamp: '2026-11-07T10:00:00Z',
        action: 'ออกใบสั่งซื้อและส่งตรวจร่าง',
        user: 'พว.สุดารัตน์ ใจดี',
        details: 'ออกใบสั่งซื้อ ซ. ๑๒/๒๕๖๙ วงเงิน ๑๘,๕๐๐ บาท',
      },
    ],
    createdAt: '2026-11-07T10:00:00Z',
    updatedAt: '2026-11-07T10:00:00Z',
  },
  ...INITIAL_DUTY_DOCS,
];

const INITIAL_ALERTS: RealtimeAlert[] = [
  {
    id: 'alert-1',
    docId: 'doc-in-001',
    type: 'URGENT',
    title: 'เอกสารด่วนมากต้องดำเนินการ',
    message: 'หนังสือรับ ๔๒/๒๕๖๙ ขอเชิญประชุมวัคซีนไข้หวัดใหญ่ ครบกำหนด ๑๕ พ.ย. ๖๙',
    timestamp: '2026-11-09T10:15:00Z',
    read: false,
    docType: 'INCOMING',
    priority: 'VERY_URGENT',
  },
  {
    id: 'alert-2',
    docId: 'doc-buy-001',
    type: 'ENDORSEMENT',
    title: 'รอเกษียร/ลงนามใบสั่งซื้อ',
    message: 'ใบสั่งซื้อ ซ. ๑๒/๒๕๖๙ จัดซื้อ Strip น้ำตาล ๑๘,๕๐๐ บาท รอ ผอ.รพ.สต. ลงนาม',
    timestamp: '2026-11-07T10:05:00Z',
    read: false,
    docType: 'PURCHASE_ORDER',
    priority: 'URGENT',
  },
];

// โหลดเอกสารทั้งหมดจาก Storage
export function loadAllDocuments(): SarabanDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(INITIAL_DOCS));
      localStorage.setItem(STORAGE_KEY_DUTY_SEEDED, '1');
      return INITIAL_DOCS;
    }
    const parsed: SarabanDoc[] = JSON.parse(raw);
    if (!localStorage.getItem(STORAGE_KEY_DUTY_SEEDED)) {
      const hasDuty = parsed.some((d) => d.type === 'DUTY_ORDER');
      localStorage.setItem(STORAGE_KEY_DUTY_SEEDED, '1');
      if (!hasDuty) {
        const merged = [...parsed, ...INITIAL_DUTY_DOCS];
        localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(merged));
        return merged;
      }
    }
    return parsed;
  } catch (err) {
    console.error('Error loading documents:', err);
    return INITIAL_DOCS;
  }
}

// บันทึกเอกสารทั้งหมดลง Storage (ย้ายไฟล์แนบขนาดใหญ่ไป IndexedDB อัตโนมัติหากเกินโควตา localStorage)
export function saveAllDocuments(docs: SarabanDoc[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
    if (broadcast) {
      broadcast.postMessage({ type: 'DOCS_UPDATED', count: docs.length });
    }
  } catch (err) {
    console.warn('localStorage quota exceeded, offloading large attachments to IndexedDB...', err);
    try {
      const compactedDocs = docs.map((d) => {
        if (d.attachmentUrl && d.attachmentUrl.startsWith('data:') && d.attachmentUrl.length > 50000) {
          void saveAttachmentToIDB(d.id, d.attachmentName || 'document', d.attachmentUrl);
          return { ...d, attachmentUrl: `idb:${d.id}` };
        }
        return d;
      });
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(compactedDocs));
      if (broadcast) {
        broadcast.postMessage({ type: 'DOCS_UPDATED', count: compactedDocs.length });
      }
    } catch (innerErr) {
      console.error('Error saving documents even after compacting:', innerErr);
    }
  }
}

// คำนวณเลขที่รันถัดไปตามประเภทเอกสารและปี
export function getNextRunningNumber(type: DocumentType, year = 2569): {
  nextRunning: number;
  bookNoThai: string;
  bookNoArabic: string;
} {
  const docs = loadAllDocuments();
  const docsOfType = docs.filter((d) => d.type === type && (d.year === year || !d.year));
  
  let maxRunning = 0;
  docsOfType.forEach((d) => {
    if (d.runningNumber && d.runningNumber > maxRunning) {
      maxRunning = d.runningNumber;
    }
  });

  const nextRunning = maxRunning + 1;
  const runningThai = toThaiNumerals(String(nextRunning).padStart(2, '0'));
  const runningArabic = String(nextRunning).padStart(2, '0');
  const yearThai = toThaiNumerals(year);

  const agency = loadAgencyConfig();

  let bookNoThai = '';
  let bookNoArabic = '';

  switch (type) {
    case 'OUTGOING':
      bookNoThai = `${agency.outgoingPrefix}${toThaiNumerals(nextRunning)}`;
      bookNoArabic = `${toArabicNumerals(agency.outgoingPrefix)}${nextRunning}`;
      break;
    case 'INCOMING':
      bookNoThai = `รับ ${toThaiNumerals(nextRunning)}/${yearThai}`;
      bookNoArabic = `รับ ${nextRunning}/${year}`;
      break;
    case 'ORDER':
      bookNoThai = `คำสั่ง ${agency.shortName} ที่ ${toThaiNumerals(nextRunning)}/${yearThai}`;
      bookNoArabic = `คำสั่ง ${agency.shortName} ที่ ${nextRunning}/${year}`;
      break;
    case 'DUTY_ORDER':
      bookNoThai = `${nextRunning}/${year}`;
      bookNoArabic = `${nextRunning}/${year}`;
      break;
    case 'HIRE_ORDER':
      bookNoThai = `จ. ${runningThai}/${yearThai}`;
      bookNoArabic = `จ. ${runningArabic}/${year}`;
      break;
    case 'PURCHASE_ORDER':
      bookNoThai = `ซ. ${runningThai}/${yearThai}`;
      bookNoArabic = `ซ. ${runningArabic}/${year}`;
      break;
  }

  return { nextRunning, bookNoThai, bookNoArabic };
}

// เพิ่มเอกสารใหม่
export function createNewDocument(docData: Omit<SarabanDoc, 'id' | 'createdAt' | 'updatedAt' | 'logs'>, currentUser = 'เจ้าหน้าที่ รพ.สต.บ้านรี'): SarabanDoc {
  const docs = loadAllDocuments();
  const now = new Date().toISOString();
  const id = `doc-${docData.type.toLowerCase()}-${Date.now()}`;

  const initialLog: AuditLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: now,
    action: 'ลงทะเบียนเอกสารใหม่',
    user: currentUser,
    details: `สร้างทะเบียน ${docData.bookNo} (${docData.subject})`,
  };

  let attachmentUrl = docData.attachmentUrl;
  if (attachmentUrl && attachmentUrl.startsWith('data:')) {
    void saveAttachmentToIDB(id, docData.attachmentName || 'document', attachmentUrl);
    if (attachmentUrl.length > 300000) {
      attachmentUrl = `idb:${id}`;
    }
  }

  const newDoc: SarabanDoc = {
    ...docData,
    attachmentUrl,
    id,
    createdAt: now,
    updatedAt: now,
    logs: [initialLog],
  };

  const updatedDocs = [newDoc, ...docs];
  saveAllDocuments(updatedDocs);

  // สร้าง Realtime Alert
  const isUrgent = newDoc.speed === 'URGENT' || newDoc.speed === 'VERY_URGENT' || newDoc.speed === 'MOST_URGENT';
  if (isUrgent) {
    playUrgentSound();
  } else {
    playNotificationSound();
  }

  addRealtimeAlert({
    id: `alert-${Date.now()}`,
    docId: newDoc.id,
    type: isUrgent ? 'URGENT' : 'NEW_DOC',
    title: isUrgent ? `🚨 เอกสารด่วน: ${newDoc.bookNo}` : `📄 ลงทะเบียนเอกสารใหม่: ${newDoc.bookNo}`,
    message: newDoc.subject,
    timestamp: now,
    read: false,
    docType: newDoc.type,
    priority: newDoc.speed,
  });

  return newDoc;
}

// อัปเดตสถานะ หรือข้อมูลเอกสาร
export function updateDocument(
  docId: string,
  updates: Partial<SarabanDoc>,
  actionDescription: string,
  currentUser = 'เจ้าหน้าที่ รพ.สต.บ้านรี'
): SarabanDoc | null {
  const docs = loadAllDocuments();
  const index = docs.findIndex((d) => d.id === docId);
  if (index === -1) return null;

  const currentDoc = docs[index];
  const now = new Date().toISOString();

  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}`,
    timestamp: now,
    action: actionDescription,
    user: currentUser,
    details: updates.status && updates.status !== currentDoc.status 
      ? `เปลี่ยนสถานะจาก ${currentDoc.status} เป็น ${updates.status}` 
      : actionDescription,
  };

  const processedUpdates: Partial<SarabanDoc> = { ...updates };
  if ('attachmentUrl' in processedUpdates) {
    const newUrl = processedUpdates.attachmentUrl;
    if (!newUrl) {
      void deleteAttachmentFromIDB(docId);
    } else if (newUrl.startsWith('data:')) {
      void saveAttachmentToIDB(
        docId,
        processedUpdates.attachmentName || currentDoc.attachmentName || 'document',
        newUrl
      );
      if (newUrl.length > 300000) {
        processedUpdates.attachmentUrl = `idb:${docId}`;
      }
    }
  }

  const updatedDoc: SarabanDoc = {
    ...currentDoc,
    ...processedUpdates,
    updatedAt: now,
    logs: [newLog, ...(currentDoc.logs || [])],
  };

  docs[index] = updatedDoc;
  saveAllDocuments(docs);

  // แจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะหรือการเกษียร
  playNotificationSound();
  addRealtimeAlert({
    id: `alert-${Date.now()}`,
    docId: updatedDoc.id,
    type: updates.endorsement ? 'ENDORSEMENT' : 'STATUS_CHANGE',
    title: updates.endorsement ? `✍️ เกษียรหนังสือ: ${updatedDoc.bookNo}` : `🔄 อัปเดตข้อมูล: ${updatedDoc.bookNo}`,
    message: updates.endorsement || actionDescription,
    timestamp: now,
    read: false,
    docType: updatedDoc.type,
  });

  return updatedDoc;
}

// ลบเอกสาร (Destructive action - ต้องมีการยืนยันก่อน)
export function deleteDocument(docId: string): boolean {
  const docs = loadAllDocuments();
  const filtered = docs.filter((d) => d.id !== docId);
  if (filtered.length === docs.length) return false;
  void deleteAttachmentFromIDB(docId);
  saveAllDocuments(filtered);
  return true;
}

// จัดการการแจ้งเตือน Realtime Alerts
export function loadAllAlerts(): RealtimeAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(INITIAL_ALERTS));
      return INITIAL_ALERTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ALERTS;
  }
}

export function saveAllAlerts(alerts: RealtimeAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    if (broadcast) {
      broadcast.postMessage({ type: 'ALERTS_UPDATED', count: alerts.length });
    }
  } catch (err) {
    console.error('Error saving alerts:', err);
  }
}

export function addRealtimeAlert(alert: RealtimeAlert) {
  const alerts = loadAllAlerts();
  const updated = [alert, ...alerts].slice(0, 50); // เก็บ 50 รายการล่าสุด
  saveAllAlerts(updated);

  // ส่ง Web Browser Notification หากได้รับอนุญาต
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
      });
    } catch {
      // Ignore if not supported in iframe
    }
  }
}

export function markAlertAsRead(alertId: string) {
  const alerts = loadAllAlerts();
  const updated = alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a));
  saveAllAlerts(updated);
}

export function markAllAlertsAsRead() {
  const alerts = loadAllAlerts();
  const updated = alerts.map((a) => ({ ...a, read: true }));
  saveAllAlerts(updated);
}

// ติดตามเหตุการณ์ Realtime ผ่าน BroadcastChannel
export function subscribeToRealtimeUpdates(callback: (event: any) => void): () => void {
  if (!broadcast) return () => {};
  const handler = (msg: MessageEvent) => callback(msg.data);
  broadcast.addEventListener('message', handler);
  return () => {
    broadcast.removeEventListener('message', handler);
  };
}
