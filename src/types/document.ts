export type DocumentType = 
  | 'OUTGOING'       // เลขที่ส่ง (หนังสือส่งออก)
  | 'INCOMING'       // เลขที่รับ (หนังสือรับเข้า)
  | 'ORDER'          // คำสั่ง รพ.สต.
  | 'HIRE_ORDER'     // เลขที่สั่งจ้าง
  | 'PURCHASE_ORDER';// เลขที่สั่งซื้อ

export type Priority = 'NORMAL' | 'URGENT' | 'VERY_URGENT' | 'MOST_URGENT';
// ปกติ, ด่วน, ด่วนมาก, ด่วนที่สุด

export type Confidentiality = 'NORMAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
// ปกติ, ลับ, ลับมาก

export type DocumentStatus = 
  | 'PENDING'            // รอดำเนินการ
  | 'PROCESSING'         // กำลังดำเนินการ
  | 'AWAITING_SIGNATURE' // รอเกษียร / ลงนาม
  | 'FORWARDED'          // ส่งต่อหน่วยงาน
  | 'COMPLETED'          // เสร็จสิ้น / จัดเก็บ
  | 'CANCELLED';         // ยกเลิก

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface SarabanDoc {
  id: string;
  type: DocumentType;
  bookNo: string;           // เลขที่เอกสาร เช่น "สธ ๐๕๑๒.๐๓/๑๒", "รับ ๔๕/๒๕๖๙", "คำสั่ง ๐๘/๒๕๖๙"
  arabicNo: string;         // เลขที่แบบอารบิก เพื่อค้นหาง่าย
  runningNumber: number;    // ลำดับที่รัน เช่น 1, 2, 3...
  year: number;             // ปี พ.ศ. เช่น 2569
  date: string;             // วันที่ลงในหนังสือ (YYYY-MM-DD)
  receivedOrSentDate?: string; // วันที่รับเข้า หรือ วันที่ส่งออก
  subject: string;          // เรื่อง
  fromDept: string;         // จากหน่วยงาน/บุคคล
  toDept: string;           // ถึงหน่วยงาน/บุคคล
  speed: Priority;          // ชั้นความเร็ว
  secret: Confidentiality;  // ชั้นความลับ
  status: DocumentStatus;   // สถานะปัจจุบัน
  officerInCharge: string;  // เจ้าหน้าที่ผู้รับผิดชอบ
  signer?: string;          // ผู้ลงนาม (เช่น ผอ.รพ.สต.บ้านรี)
  endorsement?: string;     // การเกษียรหนังสือ / คำสั่งการของผู้บริหาร
  notes?: string;           // หมายเหตุ

  // ฟิลด์เฉพาะสำหรับ สั่งซื้อ / สั่งจ้าง
  amount?: number;          // วงเงินงบประมาณ (บาท)
  contractorOrShop?: string;// ผู้รับจ้าง หรือ ร้านค้าคู่สัญญา
  budgetType?: string;      // แหล่งงบประมาณ (เงินบำรุง รพ.สต., งบ UC, งบ PPA, งบ อปท.)
  inspectionDate?: string;  // วันที่ตรวจรับพัสดุ / งานจ้าง

  dueDate?: string;         // วันครบกำหนดดำเนินการ / ส่งมอบ
  attachmentUrl?: string;   // ลิงก์ไฟล์แนบ หรือ รูปถ่ายเอกสาร
  attachmentName?: string;  // ชื่อไฟล์แนบ

  logs: AuditLogEntry[];    // ประวัติการบันทึกและแก้ไข
  createdAt: string;
  updatedAt: string;
  syncedToGoogleSheet?: boolean;
}

export interface RealtimeAlert {
  id: string;
  docId: string;
  type: 'NEW_DOC' | 'URGENT' | 'STATUS_CHANGE' | 'DEADLINE' | 'ENDORSEMENT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  docType: DocumentType;
  priority?: Priority;
}

export interface StaffUser {
  uid: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DIRECTOR' | 'SARABAN_OFFICER' | 'PROCUREMENT_OFFICER' | 'HEALTH_OFFICER';
  avatarUrl?: string;
}
