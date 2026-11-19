import { Confidentiality, DocumentStatus, DocumentType, Priority } from '../types/document';

// แปลงเลขอารบิกเป็นเลขไทย
export function toThaiNumerals(str: string | number): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(str).replace(/[0-9]/g, (digit) => thaiDigits[parseInt(digit, 10)]);
}

// แปลงเลขไทยเป็นเลขอารบิก
export function toArabicNumerals(str: string): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return str.replace(/[๐-๙]/g, (char) => {
    const idx = thaiDigits.indexOf(char);
    return idx !== -1 ? String(idx) : char;
  });
}

// ชื่อเดือนภาษาไทย
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

// จัดรูปแบบวันที่ภาษาไทยแบบเต็ม
export function formatThaiDate(dateStr?: string, withTime = false): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    if (withTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} เวลา ${hours}:${mins} น.`;
    }
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

// จัดรูปแบบวันที่ภาษาไทยแบบย่อ
export function formatThaiDateShort(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const yearShort = String((d.getFullYear() + 543) % 100).padStart(2, '0');
    return `${day} ${month} ${yearShort}`;
  } catch {
    return dateStr;
  }
}

// แปลงตัวเลขเป็นค่าเงินบาท
export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00 บาท';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

// ข้อมูลฉลากและสีประเภทเอกสาร
export const DOC_TYPE_META: Record<DocumentType, {
  label: string;
  shortLabel: string;
  codePrefix: string;
  defaultPattern: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}> = {
  OUTGOING: {
    label: 'หนังสือส่ง (ออก)',
    shortLabel: 'เลขที่ส่ง',
    codePrefix: 'สธ ๐๕๑๒.๐๓/',
    defaultPattern: 'สธ ๐๕๑๒.๐๓/{num}',
    description: 'หนังสือราชการส่งออกจาก รพ.สต.บ้านรี ถึงหน่วยงานภายนอก/ประชาชน',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    iconName: 'Send',
  },
  INCOMING: {
    label: 'หนังสือรับ (เข้า)',
    shortLabel: 'เลขที่รับ',
    codePrefix: 'รับ ',
    defaultPattern: 'รับ {num}/{year}',
    description: 'หนังสือราชการที่รับเข้ามาเพื่อดำเนินการและเกษียรหนังสือ',
    color: 'sky',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    badgeText: 'text-sky-700',
    iconName: 'Inbox',
  },
  ORDER: {
    label: 'คำสั่ง รพ.สต.',
    shortLabel: 'คำสั่ง',
    codePrefix: 'คำสั่ง รพ.สต.บ้านรี ที่ ',
    defaultPattern: 'คำสั่ง ที่ {num}/{year}',
    description: 'คำสั่งมอบหมายหน้าที่ แต่งตั้งคณะทำงาน อสม. หรือข้อปฏิบัติต่างๆ',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    badgeText: 'text-purple-700',
    iconName: 'FileBadge',
  },
  DUTY_ORDER: {
    label: 'คำสั่งเวรยาม (นอกเวลา/วันหยุด)',
    shortLabel: 'คำสั่งเวรยาม',
    codePrefix: '',
    defaultPattern: '{num}/{year}',
    description: 'ทะเบียนหนังสือคำสั่งปฏิบัติงานนอกเวลาราชการและวันหยุดราชการ',
    color: 'teal',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    badgeText: 'text-teal-700',
    iconName: 'CalendarClock',
  },
  HIRE_ORDER: {
    label: 'ใบสั่งจ้าง',
    shortLabel: 'เลขที่สั่งจ้าง',
    codePrefix: 'จ. ',
    defaultPattern: 'จ. {num}/{year}',
    description: 'ทะเบียนสั่งจ้างเหมาบริการ ซ่อมบำรุง หรือจ้างบริการ รพ.สต.',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    badgeText: 'text-amber-800',
    iconName: 'Wrench',
  },
  PURCHASE_ORDER: {
    label: 'ใบสั่งซื้อ',
    shortLabel: 'เลขที่สั่งซื้อ',
    codePrefix: 'ซ. ',
    defaultPattern: 'ซ. {num}/{year}',
    description: 'ทะเบียนสั่งซื้อเวชภัณฑ์ยา วัสดุการแพทย์ วัสดุสำนักงาน',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeText: 'text-rose-700',
    iconName: 'ShoppingCart',
  },
};

// ฉลากชั้นความเร็ว
export const PRIORITY_META: Record<Priority, {
  label: string;
  badgeClass: string;
  dotColor: string;
}> = {
  NORMAL: {
    label: 'ปกติ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  URGENT: {
    label: 'ด่วน',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
    dotColor: 'bg-amber-500',
  },
  VERY_URGENT: {
    label: 'ด่วนมาก',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
    dotColor: 'bg-orange-500',
  },
  MOST_URGENT: {
    label: 'ด่วนที่สุด',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
    dotColor: 'bg-red-600',
  },
};

// ฉลากชั้นความลับ
export const CONFIDENTIAL_META: Record<Confidentiality, {
  label: string;
  badgeClass: string;
}> = {
  NORMAL: {
    label: 'ทั่วไป',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  CONFIDENTIAL: {
    label: 'ลับ',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-medium',
  },
  TOP_SECRET: {
    label: 'ลับมาก',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  },
};

// ฉลากสถานะเอกสาร
export const STATUS_META: Record<DocumentStatus, {
  label: string;
  badgeClass: string;
  stepIndex: number;
  bgHex: string;
}> = {
  PENDING: {
    label: 'รอดำเนินการ',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    stepIndex: 1,
    bgHex: '#FEF3C7',
  },
  PROCESSING: {
    label: 'กำลังดำเนินการ',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    stepIndex: 2,
    bgHex: '#DBEAFE',
  },
  AWAITING_SIGNATURE: {
    label: 'รอเกษียร/ลงนาม',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    stepIndex: 3,
    bgHex: '#E0E7FF',
  },
  FORWARDED: {
    label: 'ส่งต่อหน่วยงาน',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
    stepIndex: 4,
    bgHex: '#CCFBF1',
  },
  COMPLETED: {
    label: 'เสร็จสิ้น/จัดเก็บ',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    stepIndex: 5,
    bgHex: '#D1FAE5',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-300 line-through',
    stepIndex: 0,
    bgHex: '#F1F5F9',
  },
};
