import { jsPDF } from 'jspdf';
import { SarabanDoc } from '../types/document';
import {
  CONFIDENTIAL_META,
  DOC_TYPE_META,
  formatCurrency,
  formatThaiDate,
  PRIORITY_META,
  STATUS_META,
  toThaiNumerals,
} from '../utils/thaiFormat';
import { loadAgencyConfig } from './agencyConfig';

const PAGE_WIDTH_UNITS = 827;
const PAGE_HEIGHT_UNITS = 1170;
const SCALE = 2; // 1654 x 2340 px (~200 DPI crisp A4)
const FONT_STACK = "'Sarabun', 'Noto Sans Thai', 'Tahoma', 'Leelawadee UI', sans-serif";

function wrapThaiText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = (text || '-').replace(/\r\n/g, '\n');
  const paragraphs = clean.split('\n');
  const lines: string[] = [];

  const segmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? new Intl.Segmenter('th', { granularity: 'word' })
      : null;

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }

    const tokens = segmenter
      ? Array.from(segmenter.segment(para), (s) => s.segment)
      : Array.from(para);

    let currentLine = '';

    for (const token of tokens) {
      const testLine = currentLine + token;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine.trimEnd());
        }
        // If a single long token (e.g. URL or long word) exceeds maxWidth, split by character
        if (ctx.measureText(token).width > maxWidth) {
          let chunk = '';
          for (const ch of Array.from(token)) {
            if (ctx.measureText(chunk + ch).width <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          currentLine = chunk.trimStart();
        } else {
          currentLine = token.trimStart();
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine.trimEnd());
    }
  }

  return lines.length > 0 ? lines : ['-'];
}

function loadQrImage(url: string, timeoutMs = 2500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;

    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      }
    };

    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function exportCoverSlipPdf(doc: SarabanDoc): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with available system Thai fonts
    }
  }

  const agency = loadAgencyConfig();
  const typeMeta = DOC_TYPE_META[doc.type];
  const priorityMeta = PRIORITY_META[doc.speed];
  const secretMeta = CONFIDENTIAL_META[doc.secret];
  const statusMeta = STATUS_META[doc.status];

  const qrData = `${agency.shortName} | ทะเบียน: ${doc.bookNo} | เรื่อง: ${doc.subject} | สถานะ: ${statusMeta.label}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;
  const qrImg = await loadQrImage(qrUrl);

  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH_UNITS * SCALE;
  canvas.height = PAGE_HEIGHT_UNITS * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถสร้าง Canvas สำหรับส่งออก PDF ได้');
  }

  ctx.scale(SCALE, SCALE);

  // White paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PAGE_WIDTH_UNITS, PAGE_HEIGHT_UNITS);

  // Official double outer border
  const margin = 34;
  const innerInset = 6;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, PAGE_WIDTH_UNITS - margin * 2, PAGE_HEIGHT_UNITS - margin * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(
    margin + innerInset,
    margin + innerInset,
    PAGE_WIDTH_UNITS - (margin + innerInset) * 2,
    PAGE_HEIGHT_UNITS - (margin + innerInset) * 2
  );

  const contentX = margin + 30;
  const contentW = PAGE_WIDTH_UNITS - contentX * 2;
  let y = margin + 46;

  // Hospital Title
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.font = `700 22px ${FONT_STACK}`;
  ctx.fillText(agency.fullName, PAGE_WIDTH_UNITS / 2, y);

  y += 24;
  ctx.fillStyle = '#334155';
  ctx.font = `500 15px ${FONT_STACK}`;
  ctx.fillText(agency.address, PAGE_WIDTH_UNITS / 2, y);

  // Official Banner
  y += 18;
  drawRoundedRect(ctx, contentX, y, contentW, 38, 6);
  ctx.fillStyle = '#E2E8F0';
  ctx.fill();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 17px ${FONT_STACK}`;
  ctx.fillText('บัตรตรวจติดตามงานสารบรรณ / ใบปะหน้าเอกสารราชการ', PAGE_WIDTH_UNITS / 2, y + 25);

  y += 56;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contentX, y);
  ctx.lineTo(contentX + contentW, y);
  ctx.stroke();

  y += 24;
  ctx.textAlign = 'left';

  // Metadata 2-Column Grid
  const colGap = 20;
  const colW = (contentW - colGap) / 2;
  const drawField = (
    x: number,
    currY: number,
    width: number,
    label: string,
    value: string
  ): number => {
    ctx.fillStyle = '#475569';
    ctx.font = `700 13px ${FONT_STACK}`;
    ctx.fillText(label, x, currY);

    const labelWidth = ctx.measureText(label).width + 8;
    const availW = Math.max(width - labelWidth, 80);
    ctx.fillStyle = '#0F172A';
    ctx.font = `500 14px ${FONT_STACK}`;
    const wrapped = wrapThaiText(ctx, value || '-', availW);
    wrapped.forEach((line, idx) => {
      ctx.fillText(line, x + labelWidth, currY + idx * 20);
    });
    return Math.max(wrapped.length, 1) * 22 + 4;
  };

  const row1H = Math.max(
    drawField(contentX, y, colW, 'ประเภท:', typeMeta.label),
    drawField(contentX + colW + colGap, y, colW, 'เลขที่หนังสือ:', doc.bookNo)
  );
  y += row1H;

  const row2H = Math.max(
    drawField(contentX, y, colW, 'ลงวันที่:', formatThaiDate(doc.date)),
    drawField(
      contentX + colW + colGap,
      y,
      colW,
      'ชั้นความเร็ว/ลับ:',
      `${priorityMeta.label} / ${secretMeta.label}`
    )
  );
  y += row2H;

  const row3H = Math.max(
    drawField(contentX, y, colW, 'จาก:', doc.fromDept),
    drawField(contentX + colW + colGap, y, colW, 'ถึง:', doc.toDept)
  );
  y += row3H;

  const row4H = Math.max(
    drawField(contentX, y, colW, 'สถานะปัจจุบัน:', statusMeta.label),
    drawField(contentX + colW + colGap, y, colW, 'ผู้รับผิดชอบ:', doc.officerInCharge)
  );
  y += row4H + 4;

  // Divider before Subject
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, y);
  ctx.lineTo(contentX + contentW, y);
  ctx.stroke();

  y += 24;
  ctx.fillStyle = '#334155';
  ctx.font = `700 14px ${FONT_STACK}`;
  ctx.fillText('เรื่อง:', contentX, y);

  y += 24;
  ctx.fillStyle = '#0F172A';
  ctx.font = `600 16px ${FONT_STACK}`;
  const subjectLines = wrapThaiText(ctx, doc.subject, contentW);
  subjectLines.forEach((line, idx) => {
    ctx.fillText(line, contentX, y + idx * 24);
  });
  y += subjectLines.length * 24 + 10;

  // Procurement / Hire Order Details Box (if present)
  if (doc.amount !== undefined || doc.contractorOrShop || doc.budgetType) {
    const boxLines: string[] = [];
    if (doc.amount !== undefined) {
      boxLines.push(
        `วงเงินงบประมาณ: ${formatCurrency(doc.amount)}   (คู่สัญญา: ${doc.contractorOrShop || '-'})`
      );
    } else if (doc.contractorOrShop) {
      boxLines.push(`คู่สัญญา / ร้านค้า: ${doc.contractorOrShop}`);
    }
    if (doc.budgetType || doc.inspectionDate) {
      const budgetPart = doc.budgetType ? `แหล่งงบประมาณ: ${doc.budgetType}` : '';
      const inspectPart = doc.inspectionDate
        ? `วันที่ตรวจรับ: ${formatThaiDate(doc.inspectionDate)}`
        : '';
      boxLines.push([budgetPart, inspectPart].filter(Boolean).join('   |   '));
    }

    ctx.font = `500 13.5px ${FONT_STACK}`;
    const wrappedBoxLines = boxLines.flatMap((line) => wrapThaiText(ctx, line, contentW - 24));
    const boxH = wrappedBoxLines.length * 20 + 20;

    drawRoundedRect(ctx, contentX, y, contentW, boxH, 6);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    wrappedBoxLines.forEach((line, idx) => {
      ctx.fillText(line, contentX + 12, y + 22 + idx * 20);
    });

    y += boxH + 14;
  }

  // Optional Notes / Due Date / Attachment Info
  if (doc.dueDate || doc.notes || doc.attachmentName) {
    ctx.font = `400 13px ${FONT_STACK}`;
    ctx.fillStyle = '#334155';
    if (doc.dueDate) {
      ctx.fillText(`กำหนดดำเนินการ / ส่งมอบ: ${formatThaiDate(doc.dueDate)}`, contentX, y + 14);
      y += 22;
    }
    if (doc.attachmentName) {
      ctx.fillText(`เอกสารแนบในระบบ: ${doc.attachmentName}`, contentX, y + 14);
      y += 22;
    }
    if (doc.notes) {
      const noteLines = wrapThaiText(ctx, `หมายเหตุ: ${doc.notes}`, contentW);
      noteLines.forEach((line, idx) => {
        ctx.fillText(line, contentX, y + 14 + idx * 19);
      });
      y += noteLines.length * 19 + 8;
    }
  }

  // Endorsement Section (คำสั่งการ / การเกษียรหนังสือ)
  y = Math.max(y + 10, 560);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contentX, y);
  ctx.lineTo(contentX + contentW, y);
  ctx.stroke();

  y += 24;
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 15px ${FONT_STACK}`;
  ctx.fillText(`คำสั่งการ / การเกษียรหนังสือ (ผอ.${agency.shortName}):`, contentX, y);

  y += 14;
  const endorseBoxH = 195;
  drawRoundedRect(ctx, contentX, y, contentW, endorseBoxH, 6);
  ctx.fillStyle = '#FAFAFA';
  ctx.fill();
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  if (doc.endorsement && doc.endorsement.trim()) {
    ctx.fillStyle = '#0F172A';
    ctx.font = `500 15px ${FONT_STACK}`;
    const endorseLines = wrapThaiText(ctx, doc.endorsement, contentW - 28).slice(0, 7);
    endorseLines.forEach((line, idx) => {
      ctx.fillText(line, contentX + 14, y + 28 + idx * 24);
    });
  } else {
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const lineY = y + 48 + i * 36;
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(contentX + 20, lineY);
      ctx.lineTo(contentX + contentW - 20, lineY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Signature block
  y += endorseBoxH + 46;
  const thaiYear = toThaiNumerals(doc.year || agency.fiscalYear || 2570);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = `500 14px ${FONT_STACK}`;
  ctx.fillText(`ลงชื่อ ............................................................ ผอ.${agency.shortName}`, contentX + contentW, y);
  y += 24;
  ctx.fillText(`(............ / ............ / พ.ศ. ${thaiYear})`, contentX + contentW - 32, y);

  // Footer + QR Code
  const footerY = PAGE_HEIGHT_UNITS - margin - 110;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, footerY);
  ctx.lineTo(contentX + contentW, footerY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = `500 12.5px ${FONT_STACK}`;
  ctx.fillText(`รหัสอ้างอิงเอกสาร: ${doc.id}`, contentX, footerY + 26);
  ctx.fillText(
    `ส่งออกไฟล์ PDF เมื่อ: ${formatThaiDate(new Date().toISOString(), true)}`,
    contentX,
    footerY + 46
  );
  ctx.fillStyle = '#64748B';
  ctx.font = `400 12px ${FONT_STACK}`;
  ctx.fillText(`ระบบสารบรรณอิเล็กทรอนิกส์ ${agency.shortName} (E-Saraban)`, contentX, footerY + 68);

  if (qrImg) {
    const qrSize = 72;
    const qrX = contentX + contentW - qrSize;
    const qrY = footerY + 12;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748B';
    ctx.font = `500 10px ${FONT_STACK}`;
    ctx.fillText('สแกนตรวจสอบสถานะ', qrX + qrSize / 2, qrY + qrSize + 12);
  }

  // Generate A4 PDF via jsPDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

  const safeBookNo = (doc.bookNo || doc.id)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .trim();
  const filename = `ใบปะหน้า_${safeBookNo}.pdf`;
  pdf.save(filename);

  return filename;
}
