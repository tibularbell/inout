import { DocumentType, SarabanDoc } from '../types/document';
import { DOC_TYPE_META, formatThaiDate, PRIORITY_META, STATUS_META } from '../utils/thaiFormat';

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt?: string;
}

export const DEFAULT_SPREADSHEET_ID = '15isYxCg9yzCfhkdRXqgAblk_v89MBDCXh2pAwxvDJ3A';
export const DEFAULT_SPREADSHEET_CONFIG: SheetConfig = {
  spreadsheetId: DEFAULT_SPREADSHEET_ID,
  spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`,
  title: 'ทะเบียนสารบรรณอิเล็กทรอนิกส์ รพ.สต.บ้านรี ๒๕๗๐',
  lastSyncedAt: new Date().toISOString(),
};

const STORAGE_KEY_SHEET_CONFIG = 'banri_saraban_sheet_config';

export function getStoredSheetConfig(): SheetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEET_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure if user had an empty or old sheet ID, we prioritize the specified one
      if (parsed && parsed.spreadsheetId) return parsed;
    }
    localStorage.setItem(STORAGE_KEY_SHEET_CONFIG, JSON.stringify(DEFAULT_SPREADSHEET_CONFIG));
    return DEFAULT_SPREADSHEET_CONFIG;
  } catch {
    return DEFAULT_SPREADSHEET_CONFIG;
  }
}

export function saveStoredSheetConfig(config: SheetConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEY_SHEET_CONFIG, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEY_SHEET_CONFIG);
  }
}

// ตรวจสอบและสร้างแท็บที่ขาดหายใน Google Sheets
export async function ensureSheetTabs(accessToken: string, spreadsheetId: string): Promise<void> {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

    const neededTabs = Object.values(SHEET_TAB_NAMES);
    const missingTabs = neededTabs.filter((t) => !existingTitles.includes(t));

    if (missingTabs.length > 0) {
      const requests = missingTabs.map((title) => ({
        addSheet: {
          properties: { title, gridProperties: { frozenRowCount: 1 } },
        },
      }));
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  } catch (err) {
    console.warn('ensureSheetTabs warning:', err);
  }
}

// แถบใน Google Sheets
export const SHEET_TAB_NAMES: Record<DocumentType, string> = {
  OUTGOING: 'ทะเบียนหนังสือส่ง',
  INCOMING: 'ทะเบียนหนังสือรับ',
  ORDER: 'ทะเบียนคำสั่ง',
  HIRE_ORDER: 'ทะเบียนใบสั่งจ้าง',
  PURCHASE_ORDER: 'ทะเบียนใบสั่งซื้อ',
};

// หัวตารางของแต่ละหมวดหมู่
export const SHEET_HEADERS: Record<DocumentType, string[]> = {
  OUTGOING: [
    'รหัสระบบ', 'เลขที่ส่ง', 'เลขที่อารบิก', 'วันที่ออกหนังสือ', 'เรื่อง',
    'ส่งถึงหน่วยงาน/บุคคล', 'ชั้นความเร็ว', 'ชั้นความลับ', 'สถานะ',
    'เจ้าหน้าที่ผู้รับผิดชอบ', 'ผู้ลงนาม', 'การเกษียร/หมายเหตุ', 'วันที่บันทึก'
  ],
  INCOMING: [
    'รหัสระบบ', 'เลขทะเบียนรับ', 'เลขที่อารบิก', 'เลขที่หนังสือต้นทาง', 'วันที่ลงหนังสือ',
    'วันที่รับเข้า', 'เรื่อง', 'จากหน่วยงาน/บุคคล', 'ชั้นความเร็ว',
    'ชั้นความลับ', 'สถานะ', 'ผู้รับผิดชอบ', 'กำหนดแล้วเสร็จ',
    'คำสั่งการ/การเกษียร ผอ.', 'วันที่บันทึก'
  ],
  ORDER: [
    'รหัสระบบ', 'เลขที่คำสั่ง', 'เลขที่อารบิก', 'วันที่ลงคำสั่ง', 'เรื่อง',
    'ผู้ลงนาม', 'สถานะ', 'เจ้าหน้าที่ผู้รับผิดชอบ', 'หมายเหตุ', 'วันที่บันทึก'
  ],
  HIRE_ORDER: [
    'รหัสระบบ', 'เลขที่สั่งจ้าง', 'เลขที่อารบิก', 'วันที่สั่งจ้าง', 'รายการ/งานจ้าง',
    'ผู้รับจ้าง/ห้างหุ้นส่วน/บริษัท', 'วงเงิน (บาท)', 'แหล่งงบประมาณ',
    'วันที่ตรวจรับงาน', 'สถานะ', 'ผู้รับผิดชอบ', 'หมายเหตุ', 'วันที่บันทึก'
  ],
  PURCHASE_ORDER: [
    'รหัสระบบ', 'เลขที่สั่งซื้อ', 'เลขที่อารบิก', 'วันที่สั่งซื้อ', 'รายการเวชภัณฑ์/พัสดุ',
    'ร้านค้า/ผู้จัดจำหน่าย', 'วงเงินรวม (บาท)', 'แหล่งงบประมาณ',
    'วันที่ส่งมอบ/ตรวจรับ', 'สถานะ', 'ผู้รับผิดชอบ', 'หมายเหตุ', 'วันที่บันทึก'
  ],
};

// แปลง SarabanDoc เป็นแถวข้อมูลสำหรับ Google Sheets
export function docToSheetRow(doc: SarabanDoc): (string | number)[] {
  const speedLabel = PRIORITY_META[doc.speed]?.label || doc.speed;
  const statusLabel = STATUS_META[doc.status]?.label || doc.status;

  switch (doc.type) {
    case 'OUTGOING':
      return [
        doc.id,
        doc.bookNo,
        doc.arabicNo,
        doc.date,
        doc.subject,
        doc.toDept,
        speedLabel,
        doc.secret,
        statusLabel,
        doc.officerInCharge,
        doc.signer || '',
        doc.endorsement || doc.notes || '',
        doc.createdAt,
      ];
    case 'INCOMING':
      return [
        doc.id,
        doc.bookNo,
        doc.arabicNo,
        doc.notes || '', // เลขที่ต้นทางมักเก็บใน notes หรือ fromDept
        doc.date,
        doc.receivedOrSentDate || doc.date,
        doc.subject,
        doc.fromDept,
        speedLabel,
        doc.secret,
        statusLabel,
        doc.officerInCharge,
        doc.dueDate || '',
        doc.endorsement || '',
        doc.createdAt,
      ];
    case 'ORDER':
      return [
        doc.id,
        doc.bookNo,
        doc.arabicNo,
        doc.date,
        doc.subject,
        doc.signer || '',
        statusLabel,
        doc.officerInCharge,
        doc.notes || '',
        doc.createdAt,
      ];
    case 'HIRE_ORDER':
      return [
        doc.id,
        doc.bookNo,
        doc.arabicNo,
        doc.date,
        doc.subject,
        doc.contractorOrShop || '',
        doc.amount || 0,
        doc.budgetType || 'เงินบำรุง รพ.สต.',
        doc.inspectionDate || '',
        statusLabel,
        doc.officerInCharge,
        doc.notes || '',
        doc.createdAt,
      ];
    case 'PURCHASE_ORDER':
      return [
        doc.id,
        doc.bookNo,
        doc.arabicNo,
        doc.date,
        doc.subject,
        doc.contractorOrShop || '',
        doc.amount || 0,
        doc.budgetType || 'เงินบำรุง รพ.สต.',
        doc.inspectionDate || '',
        statusLabel,
        doc.officerInCharge,
        doc.notes || '',
        doc.createdAt,
      ];
  }
}

// สร้าง Google Spreadsheet ทะเบียนสารบรรณใหม่บน Google Drive ของผู้ใช้
export async function createSarabanSpreadsheet(
  accessToken: string,
  year = 2569
): Promise<SheetConfig> {
  const title = `ทะเบียนสารบรรณอิเล็กทรอนิกส์ รพ.สต.บ้านรี ๒๕๖๙ (${year})`;

  const sheetsPayload = (['OUTGOING', 'INCOMING', 'ORDER', 'HIRE_ORDER', 'PURCHASE_ORDER'] as DocumentType[]).map((t) => ({
    properties: {
      title: SHEET_TAB_NAMES[t],
      gridProperties: {
        frozenRowCount: 1,
      },
    },
  }));

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsPayload,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ไม่สามารถสร้าง Google Sheets ได้: ${errText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // ใส่ Header ให้กับทุก Sheet tab
  for (const docType of ['OUTGOING', 'INCOMING', 'ORDER', 'HIRE_ORDER', 'PURCHASE_ORDER'] as DocumentType[]) {
    const tabName = SHEET_TAB_NAMES[docType];
    const headers = SHEET_HEADERS[docType];
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );
  }

  const config: SheetConfig = {
    spreadsheetId,
    spreadsheetUrl,
    title,
    lastSyncedAt: new Date().toISOString(),
  };

  saveStoredSheetConfig(config);
  return config;
}

// เพิ่มแถวเอกสาร 1 แถวขึ้น Google Sheets
export async function appendDocToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  doc: SarabanDoc
): Promise<boolean> {
  await ensureSheetTabs(accessToken, spreadsheetId);
  const tabName = SHEET_TAB_NAMES[doc.type];
  const row = docToSheetRow(doc);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  return res.ok;
}

// ซิงค์เอกสารทั้งหมดเข้า Google Sheets (Full Sync)
export async function syncAllDocumentsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  allDocs: SarabanDoc[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureSheetTabs(accessToken, spreadsheetId);
    for (const docType of ['OUTGOING', 'INCOMING', 'ORDER', 'HIRE_ORDER', 'PURCHASE_ORDER'] as DocumentType[]) {
      const tabName = SHEET_TAB_NAMES[docType];
      const headers = SHEET_HEADERS[docType];
      const docsInType = allDocs.filter((d) => d.type === docType);
      const rows = [headers, ...docsInType.map(docToSheetRow)];

      // ล้างข้อมูลเดิมแล้วเขียนทับแบบระเบียบเรียบร้อย
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:Z?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );
    }

    const current = getStoredSheetConfig();
    if (current) {
      saveStoredSheetConfig({
        ...current,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    return { success: true, count: allDocs.length };
  } catch (err: any) {
    console.error('Error syncing to Google Sheet:', err);
    return { success: false, count: 0, error: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
  }
}

// ค้นหาไฟล์ทะเบียนสารบรรณเดิมใน Google Drive
export async function searchExistingSheets(accessToken: string): Promise<Array<{ id: string; name: string }>> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}
