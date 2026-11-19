import React, { useState } from 'react';
import { X, QrCode, Search, FileText } from 'lucide-react';
import { SarabanDoc } from '../types/document';
import { toArabicNumerals } from '../utils/thaiFormat';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: SarabanDoc[];
  onSelectDoc: (doc: SarabanDoc) => void;
}

export const QRScanModal: React.FC<QRScanModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
}) => {
  const [query, setQuery] = useState('');
  const [matchError, setMatchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMatchError(null);
    if (!query.trim()) return;

    const q = query.toLowerCase().trim();
    const qArabic = toArabicNumerals(q);

    const found = documents.find((d) => 
      d.bookNo.toLowerCase().includes(q) ||
      d.arabicNo.toLowerCase().includes(qArabic) ||
      d.id.toLowerCase() === q
    );

    if (found) {
      onSelectDoc(found);
      onClose();
    } else {
      setMatchError(`ไม่พบเอกสารที่ตรงกับ "${query}" ในระบบ`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold">สแกน QR Code / ค้นหาด่วน</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-emerald-400 bg-emerald-50/50 rounded-2xl p-6 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                สแกนผ่านกล้องสมาร์ทโฟน
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                ใช้แอปกล้องในมือถือสแกน QR Code บนใบปะหน้า หรือพิมพ์เลขที่หนังสือด้านล่างเพื่อเปิดทันที
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              หรือพิมพ์เลขที่หนังสือ/เลขที่รับ-ส่ง:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMatchError(null);
                }}
                placeholder="เช่น ๔๒, สธ 0512, หรือ 42/2569"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {matchError && (
              <p className="text-xs text-rose-600 font-medium">⚠️ {matchError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              ค้นหาและเปิดเอกสาร
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
