import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  Sparkles, 
  Volume2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { RealtimeAlert, SarabanDoc } from '../types/document';
import { formatThaiDate } from '../utils/thaiFormat';
import { playNotificationSound, playUrgentSound } from '../services/sound';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RealtimeAlert[];
  onSelectDocById: (docId: string) => void;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (alertId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectDocById,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  const handleRequestPush = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('รพ.สต.บ้านรี', {
          body: 'เปิดใช้งานการแจ้งเตือนหนังสือราชการเรียบร้อยแล้ว',
        });
      }
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden mt-12 sm:mt-16 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>ศูนย์แจ้งเตือนสถานะเรียลไทม์</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-emerald-200">โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านรี</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => playNotificationSound()}
              className="p-1 hover:text-emerald-800 rounded flex items-center gap-1 font-medium text-slate-600"
              title="ทดสอบเสียงกระดิ่งเตือน"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>ทดสอบเสียง</span>
            </button>
            <button
              onClick={handleRequestPush}
              className="text-[11px] text-emerald-700 hover:underline font-semibold"
            >
              เปิดแจ้งเตือนบนมือถือ
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>อ่านทั้งหมดแล้ว</span>
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">ไม่มีการแจ้งเตือนในขณะนี้</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เมื่อมีเอกสารด่วน หนังสือเข้าใหม่ หรือเกษียรคำสั่งการ จะแจ้งเตือนที่นี่
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isUrgent = alert.type === 'URGENT' || alert.priority === 'VERY_URGENT' || alert.priority === 'MOST_URGENT';

              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    onMarkAsRead(alert.id);
                    onSelectDocById(alert.docId);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    alert.read
                      ? 'bg-white border-slate-200/80 hover:bg-slate-50'
                      : isUrgent
                      ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50 shadow-xs'
                      : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700'
                          : alert.type === 'ENDORSEMENT'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isUrgent ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : alert.type === 'ENDORSEMENT' ? (
                        <FileCheck className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {alert.title}
                        </h4>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {alert.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatThaiDate(alert.timestamp, true)}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 self-center flex-shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
