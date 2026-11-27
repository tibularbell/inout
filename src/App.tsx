/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { 
  Header, 
  STAFF_PRESETS,
  ADMIN_EMAILS 
} from './components/Header';
import { 
  Navigation, 
  NavTab 
} from './components/Navigation';
import { DocumentList } from './components/DocumentList';
import { NewDocumentModal } from './components/NewDocumentModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { NotificationCenter } from './components/NotificationCenter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QRScanModal } from './components/QRScanModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ShareAndAgencyModal } from './components/ShareAndAgencyModal';
import { AgencyConfig, loadAgencyConfig } from './services/agencyConfig';

import { 
  DocumentStatus, 
  DocumentType, 
  RealtimeAlert, 
  SarabanDoc, 
  StaffUser 
} from './types/document';
import { 
  createNewDocument, 
  deleteDocument, 
  loadAllAlerts, 
  loadAllDocuments, 
  markAlertAsRead, 
  markAllAlertsAsRead, 
  subscribeToRealtimeUpdates, 
  updateDocument 
} from './services/storage';
import { 
  checkRedirectAuthResult,
  getAccessToken, 
  googleSignIn, 
  googleSignInRedirect,
  initAuth, 
  logout, 
  mapAuthErrorToThai,
  resetSignInFlag,
  setAccessTokenInMemory 
} from './services/auth';
import { 
  appendDocToGoogleSheet, 
  createSarabanSpreadsheet, 
  getStoredSheetConfig, 
  saveStoredSheetConfig, 
  SheetConfig, 
  syncAllDocumentsToGoogleSheet,
  DEFAULT_SPREADSHEET_ID
} from './services/googleSheets';
import { playNotificationSound, playSuccessSound, playUrgentSound } from './services/sound';
import { 
  DOC_TYPE_META, 
  formatCurrency, 
  formatThaiDate, 
  PRIORITY_META, 
  STATUS_META, 
  toThaiNumerals 
} from './utils/thaiFormat';

export default function App() {
  // Staff User State: default to Admin (tibularbell@gmail.com)
  const [currentUser, setCurrentUser] = useState<StaffUser>(STAFF_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<NavTab>('ALL');

  // Documents & Alerts State
  const [documents, setDocuments] = useState<SarabanDoc[]>(() => loadAllDocuments());
  const [alerts, setAlerts] = useState<RealtimeAlert[]>(() => loadAllAlerts());

  // Google Workspace / Sheets State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const signInAttemptRef = React.useRef(0);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(() => getStoredSheetConfig());
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals State
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SarabanDoc | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<SarabanDoc | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig>(() => loadAgencyConfig());

  // Destructive Confirmation Modal State (MANDATORY per Workspace Skill)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleUserEmail(user.email);
        setAccessTokenInMemory(token);

        // Auto-assign Admin role if user is tibularbell@gmail.com
        if (user.email && (user.email.toLowerCase() === 'tibularbell@gmail.com' || ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || 'ผู้ดูแลระบบ รพ.สต.บ้านรี (Admin)',
            email: user.email,
            role: 'ADMIN',
            avatarUrl: user.photoURL || undefined,
          });
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleUserEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to realtime updates across browser tabs
  useEffect(() => {
    const unsub = subscribeToRealtimeUpdates((event) => {
      if (event.type === 'DOCS_UPDATED') {
        setDocuments(loadAllDocuments());
      } else if (event.type === 'ALERTS_UPDATED') {
        setAlerts(loadAllAlerts());
      }
    });
    return () => unsub();
  }, []);

  // Calculate badge counts
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      ALL: documents.length,
      OUTGOING: 0,
      INCOMING: 0,
      ORDER: 0,
      DUTY_ORDER: 0,
      HIRE_ORDER: 0,
      PURCHASE_ORDER: 0,
      ANALYTICS: 0,
    };
    documents.forEach((d) => {
      if (map[d.type] !== undefined) map[d.type]++;
    });
    return map;
  }, [documents]);

  const pendingCounts = useMemo(() => {
    const map: Record<string, number> = {
      ALL: 0,
      OUTGOING: 0,
      INCOMING: 0,
      ORDER: 0,
      DUTY_ORDER: 0,
      HIRE_ORDER: 0,
      PURCHASE_ORDER: 0,
    };
    documents.forEach((d) => {
      if (d.status === 'PENDING' || d.status === 'AWAITING_SIGNATURE') {
        map.ALL++;
        if (map[d.type] !== undefined) map[d.type]++;
      }
    });
    return map;
  }, [documents]);

  const unreadAlertCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  // Check if returning from signInWithRedirect on mobile/Safari
  useEffect(() => {
    checkRedirectAuthResult()
      .then((res) => {
        if (!res) return;
        setGoogleUser(res.user);
        setGoogleUserEmail(res.user.email);
        const isAdmin =
          res.user.email &&
          (res.user.email.toLowerCase() === 'tibularbell@gmail.com' ||
            ADMIN_EMAILS.includes(res.user.email.toLowerCase()));
        if (isAdmin) {
          setCurrentUser({
            uid: res.user.uid,
            name: res.user.displayName || 'ผู้ดูแลระบบ รพ.สต.บ้านรี (Admin)',
            email: res.user.email || 'tibularbell@gmail.com',
            role: 'ADMIN',
            avatarUrl: res.user.photoURL || undefined,
          });
        }
        showToast(`เข้าสู่ระบบ Google สำเร็จ (${res.user.email})`, 'success');
      })
      .catch((err) => {
        setAuthError(mapAuthErrorToThai(err));
      });
  }, [showToast]);

  // Handle Google Sign In (Popup)
  const handleGoogleSignIn = async () => {
    const attemptId = ++signInAttemptRef.current;
    setAuthError(null);
    setIsSigningInGoogle(true);
    try {
      const res = await googleSignIn();
      if (attemptId !== signInAttemptRef.current) return;

      if (res) {
        setGoogleUser(res.user);
        setGoogleUserEmail(res.user.email);
        setIsSigningInGoogle(false);

        const isAdmin =
          res.user.email &&
          (res.user.email.toLowerCase() === 'tibularbell@gmail.com' ||
            ADMIN_EMAILS.includes(res.user.email.toLowerCase()));
        if (isAdmin) {
          setCurrentUser({
            uid: res.user.uid,
            name: res.user.displayName || 'ผู้ดูแลระบบ รพ.สต.บ้านรี (Admin)',
            email: res.user.email || 'tibularbell@gmail.com',
            role: 'ADMIN',
            avatarUrl: res.user.photoURL || undefined,
          });
          showToast(`ยินดีต้อนรับ ผู้ดูแลระบบ (Admin): ${res.user.email}`, 'success');
        } else {
          showToast(`เข้าสู่ระบบ Google สำเร็จ (${res.user.email})`, 'success');
        }
        playSuccessSound();

        // Background sync with designated Google Spreadsheet ID (does NOT block login spinner)
        if (res.accessToken) {
          setIsSyncingSheet(true);
          try {
            const syncRes = await syncAllDocumentsToGoogleSheet(
              res.accessToken,
              sheetConfig?.spreadsheetId || DEFAULT_SPREADSHEET_ID,
              documents
            );
            if (syncRes.success) {
              setSheetConfig(getStoredSheetConfig());
              showToast('เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets เรียบร้อยแล้ว', 'success');
            } else if (syncRes.error) {
              showToast(syncRes.error, 'error');
            }
          } catch (syncErr: any) {
            console.error('Initial sync error:', syncErr);
          } finally {
            setIsSyncingSheet(false);
          }
        }
      }
    } catch (err: any) {
      if (attemptId !== signInAttemptRef.current) return;
      const friendlyMsg = mapAuthErrorToThai(err);
      setAuthError(friendlyMsg);
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${friendlyMsg}`, 'error');
    } finally {
      if (attemptId === signInAttemptRef.current) {
        setIsSigningInGoogle(false);
      }
    }
  };

  const handleCancelSignIn = () => {
    signInAttemptRef.current++;
    resetSignInFlag();
    setIsSigningInGoogle(false);
    setAuthError('ยกเลิกการเข้าสู่ระบบแล้ว สามารถกดลองใหม่ หรือเลือกวิธีสำรองด้านล่าง');
  };

  const handleGoogleSignInRedirect = async () => {
    setAuthError(null);
    setIsSigningInGoogle(true);
    try {
      await googleSignInRedirect();
    } catch (err: any) {
      const friendlyMsg = mapAuthErrorToThai(err);
      setAuthError(friendlyMsg);
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${friendlyMsg}`, 'error');
      setIsSigningInGoogle(false);
    }
  };

  // Handle Google Logout
  const handleLogoutGoogle = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleUserEmail(null);
    showToast('ออกจากระบบ Google แล้ว', 'info');
  };

  // Create new Sheet on Drive
  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      showToast('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนสร้างไฟล์', 'error');
      setIsSheetsModalOpen(true);
      return;
    }

    setIsSyncingSheet(true);
    try {
      const newSheet = await createSarabanSpreadsheet(token, 2569);
      setSheetConfig(newSheet);
      // Auto-sync all current docs into the newly created sheet
      await syncAllDocumentsToGoogleSheet(token, newSheet.spreadsheetId, documents);
      showToast('สร้าง Google Sheets ทะเบียนสารบรรณ ๒๕๖๙ สำเร็จ!', 'success');
      playSuccessSound();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Sync All Documents to Google Sheet
  const handleSyncAllToSheet = async () => {
    const token = await getAccessToken();
    if (!token || !sheetConfig) {
      showToast('ยังไม่ได้เชื่อมต่อ Google Sheets', 'info');
      setIsSheetsModalOpen(true);
      return;
    }

    setIsSyncingSheet(true);
    try {
      const res = await syncAllDocumentsToGoogleSheet(token, sheetConfig.spreadsheetId, documents);
      if (res.success) {
        showToast(`ซิงค์ข้อมูล ${res.count} รายการขึ้น Google Sheets สำเร็จ`, 'success');
        playSuccessSound();
      } else {
        showToast(`ซิงค์ข้อมูลไม่สำเร็จ: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Create or Update Document
  const handleSaveDoc = async (
    docData: Omit<SarabanDoc, 'id' | 'createdAt' | 'updatedAt' | 'logs'>
  ) => {
    if (editingDoc) {
      const updated = updateDocument(
        editingDoc.id,
        docData,
        `แก้ไขข้อมูลเอกสาร (${docData.bookNo})`,
        currentUser.name
      );
      if (updated) {
        const allDocs = loadAllDocuments();
        setDocuments(allDocs);
        setAlerts(loadAllAlerts());
        if (selectedDoc?.id === editingDoc.id) {
          setSelectedDoc(updated);
        }
        setEditingDoc(null);
        showToast(`บันทึกการแก้ไขเอกสาร ${updated.bookNo} เรียบร้อยแล้ว`, 'success');
        playSuccessSound();

        // Sync changes to Google Sheets if connected
        const token = await getAccessToken();
        if (token && sheetConfig) {
          try {
            await syncAllDocumentsToGoogleSheet(token, sheetConfig.spreadsheetId, allDocs);
          } catch (err) {
            console.warn('Silent sync after edit failed:', err);
          }
        }
      }
      return;
    }

    const newDoc = createNewDocument(docData, currentUser.name);
    const updated = loadAllDocuments();
    setDocuments(updated);
    setAlerts(loadAllAlerts());
    showToast(`ออกเลขทะเบียน ${newDoc.bookNo} เรียบร้อยแล้ว`, 'success');
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });

    // Sync to Google Sheets if connected
    const token = await getAccessToken();
    if (token && sheetConfig) {
      try {
        await appendDocToGoogleSheet(token, sheetConfig.spreadsheetId, newDoc);
      } catch (err) {
        console.warn('Silent append to sheet failed:', err);
      }
    }
  };

  // Update Status
  const handleUpdateStatus = async (newStatus: DocumentStatus, comment?: string) => {
    if (!selectedDoc) return;
    const actionDesc = comment || `เปลี่ยนสถานะเป็น ${STATUS_META[newStatus]?.label || newStatus}`;
    const updated = updateDocument(selectedDoc.id, { status: newStatus }, actionDesc, currentUser.name);
    if (updated) {
      setSelectedDoc(updated);
      setDocuments(loadAllDocuments());
      setAlerts(loadAllAlerts());
      showToast(`อัปเดตสถานะเป็น "${STATUS_META[newStatus]?.label}" แล้ว`, 'success');

      // Sync to Google Sheet
      const token = await getAccessToken();
      if (token && sheetConfig) {
        syncAllDocumentsToGoogleSheet(token, sheetConfig.spreadsheetId, loadAllDocuments());
      }
    }
  };

  // Add Endorsement (การเกษียรหนังสือ)
  const handleAddEndorsement = async (endorsementText: string) => {
    if (!selectedDoc) return;
    const updated = updateDocument(
      selectedDoc.id,
      { endorsement: endorsementText, status: 'PROCESSING' },
      `เกษียรหนังสือสั่งการ: "${endorsementText}"`,
      currentUser.name
    );
    if (updated) {
      setSelectedDoc(updated);
      setDocuments(loadAllDocuments());
      setAlerts(loadAllAlerts());
      showToast('บันทึกคำสั่งการเกษียรหนังสือเรียบร้อยแล้ว', 'success');

      // Sync to Google Sheet
      const token = await getAccessToken();
      if (token && sheetConfig) {
        syncAllDocumentsToGoogleSheet(token, sheetConfig.spreadsheetId, loadAllDocuments());
      }
    }
  };

  // Safe Deletion with MANDATORY Confirmation Modal (Workspace Skill Requirement)
  const handleDeleteRequest = (doc: SarabanDoc) => {
    setConfirmModal({
      isOpen: true,
      title: `ยืนยันการลบเอกสาร ${doc.bookNo}`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${doc.subject}" ออกจากระบบ?\n\nการดำเนินการนี้จะลบประวัติการรับ-ส่งและรายการออกจากฐานข้อมูลถาวร และไม่สามารถกู้คืนได้`,
      onConfirm: async () => {
        const ok = deleteDocument(doc.id);
        if (ok) {
          setDocuments(loadAllDocuments());
          setSelectedDoc(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast(`ลบเอกสาร ${doc.bookNo} เรียบร้อยแล้ว`, 'info');

          // Sync deletion to Google Sheet
          const token = await getAccessToken();
          if (token && sheetConfig) {
            syncAllDocumentsToGoogleSheet(token, sheetConfig.spreadsheetId, loadAllDocuments());
          }
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white pb-20 md:pb-8">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white transition-all animate-in slide-in-from-top-4 backdrop-blur-md print:hidden"
          style={{
            backgroundColor:
              toastMessage.type === 'success'
                ? '#065F46'
                : toastMessage.type === 'error'
                ? '#9F1239'
                : '#1E293B',
          }}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        unreadAlertCount={unreadAlertCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenNewDoc={() => {
          setEditingDoc(null);
          setIsNewDocOpen(true);
        }}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        agencyConfig={agencyConfig}
        sheetConfig={sheetConfig}
        googleUserEmail={googleUserEmail}
        isSyncingSheet={isSyncingSheet}
        onQuickSyncSheet={handleSyncAllToSheet}
        onLogoutGoogle={handleLogoutGoogle}
      />

      {/* Main Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        pendingCounts={pendingCounts}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 print:hidden">
        {activeTab === 'ANALYTICS' ? (
          <AnalyticsDashboard
            documents={documents}
            onFilterStatus={(st) => {
              setActiveTab('ALL');
            }}
            onFilterType={(tp) => {
              setActiveTab(tp as NavTab);
            }}
          />
        ) : (
          <DocumentList
            documents={documents}
            filterType={activeTab}
            onSelectDoc={(doc) => setSelectedDoc(doc)}
            onEditDoc={(doc) => {
              setEditingDoc(doc);
              setIsNewDocOpen(true);
            }}
            onOpenNewDoc={() => {
              setEditingDoc(null);
              setIsNewDocOpen(true);
            }}
            onQuickStatusChange={(doc, newStatus) => {
              setSelectedDoc(doc);
              handleUpdateStatus(newStatus);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-200 text-center text-xs text-slate-500 bg-white/70 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {toThaiNumerals(agencyConfig.fiscalYear)} {agencyConfig.fullName} {agencyConfig.address}</p>
          <p className="text-[11px] text-slate-400">
            ระบบสารบรรณและพัสดุอิเล็กทรอนิกส์ (E-Saraban) รองรับสมาร์ทโฟนและเชื่อมต่อ Google Workspace
          </p>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. New / Edit Document Modal */}
      <NewDocumentModal
        isOpen={isNewDocOpen}
        initialType={activeTab !== 'ALL' && activeTab !== 'ANALYTICS' ? (activeTab as DocumentType) : 'OUTGOING'}
        editingDoc={editingDoc}
        currentUser={currentUser}
        onClose={() => {
          setIsNewDocOpen(false);
          setEditingDoc(null);
        }}
        onSubmit={handleSaveDoc}
        isSyncingWithSheets={!!sheetConfig}
      />

      {/* 2. Document Detail & Action Modal */}
      <DocumentDetailModal
        doc={selectedDoc}
        currentUser={currentUser}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdateStatus={handleUpdateStatus}
        onAddEndorsement={handleAddEndorsement}
        onEditRequest={(doc) => {
          setEditingDoc(doc);
          setIsNewDocOpen(true);
        }}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* 3. Google Sheets Manager Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        isAuthenticated={!!googleUser}
        googleUserEmail={googleUserEmail}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignInRedirect={handleGoogleSignInRedirect}
        onCancelSignIn={handleCancelSignIn}
        isSigningIn={isSigningInGoogle}
        authError={authError}
        onClearAuthError={() => setAuthError(null)}
        sheetConfig={sheetConfig}
        onCreateNewSheet={handleCreateNewSheet}
        onSyncAll={handleSyncAllToSheet}
        isSyncing={isSyncingSheet}
        totalDocsCount={documents.length}
      />

      {/* 4. Realtime Notification Center Drawer */}
      <NotificationCenter
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onSelectDocById={(docId) => {
          const doc = documents.find((d) => d.id === docId);
          if (doc) setSelectedDoc(doc);
        }}
        onMarkAllAsRead={() => {
          markAllAlertsAsRead();
          setAlerts(loadAllAlerts());
        }}
        onMarkAsRead={(alertId) => {
          markAlertAsRead(alertId);
          setAlerts(loadAllAlerts());
        }}
      />

      {/* 5. QR Code / Smartphone Quick Lookup Modal */}
      <QRScanModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        documents={documents}
        onSelectDoc={(doc) => setSelectedDoc(doc)}
      />

      {/* 6. MANDATORY Confirmation Modal for Destructive Actions (Workspace Skill requirement) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="ยืนยันการลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 7. Share & Agency Config Modal */}
      <ShareAndAgencyModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        agencyConfig={agencyConfig}
        onAgencyUpdate={(next) => {
          setAgencyConfig(next);
          showToast(`อัปเดตข้อมูลหน่วยงานเป็น ${next.shortName} เรียบร้อยแล้ว`, 'success');
        }}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
      />

      {/* PRINT SLIP TEMPLATE (Only renders on print) */}
      {selectedDoc && (
        <div className="hidden print:block print-slip">
          <div className="border-4 border-double border-slate-800 p-8 max-w-2xl mx-auto text-black font-serif">
            <div className="text-center pb-4 border-b-2 border-slate-700">
              <h1 className="text-xl font-bold tracking-tight">{agencyConfig.fullName}</h1>
              <p className="text-sm">{agencyConfig.address}</p>
              <h2 className="text-lg font-bold mt-2 bg-slate-200 py-1 rounded">
                บัตรตรวจติดตามงานสารบรรณ / ใบปะหน้าเอกสารราชการ
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ประเภท:</strong> {DOC_TYPE_META[selectedDoc.type].label}
              </div>
              <div>
                <strong>เลขที่หนังสือ:</strong> {selectedDoc.bookNo}
              </div>
              <div>
                <strong>ลงวันที่:</strong> {formatThaiDate(selectedDoc.date)}
              </div>
              <div>
                <strong>ชั้นความเร็ว:</strong> {PRIORITY_META[selectedDoc.speed].label}
              </div>
              <div>
                <strong>จาก:</strong> {selectedDoc.fromDept}
              </div>
              <div>
                <strong>ถึง:</strong> {selectedDoc.toDept}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300">
              <div className="text-sm font-bold">เรื่อง:</div>
              <div className="text-base font-semibold mt-1">{selectedDoc.subject}</div>
            </div>

            {selectedDoc.amount !== undefined && (
              <div className="mt-3 p-2 bg-slate-100 rounded text-sm">
                <strong>วงเงินงบประมาณ:</strong> {formatCurrency(selectedDoc.amount)} (คู่สัญญา: {selectedDoc.contractorOrShop || '-'})
              </div>
            )}

            <div className="mt-6 pt-4 border-t-2 border-slate-400">
              <div className="text-sm font-bold mb-2">คำสั่งการ / การเกษียรหนังสือ (ผอ.{agencyConfig.shortName}):</div>
              <div className="min-h-[90px] border border-dashed border-slate-400 p-3 rounded text-sm italic">
                {selectedDoc.endorsement || '(...........................................................................................................)'}
              </div>
              <div className="text-right mt-4 text-xs">
                ลงชื่อ .................................................... ผอ.{agencyConfig.shortName}<br />
                (....... / ....... / {toThaiNumerals(selectedDoc.year || agencyConfig.fiscalYear)})
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
              <span>ผู้รับผิดชอบ: {selectedDoc.officerInCharge}</span>
              <span>พิมพ์จากระบบสารบรรณ {agencyConfig.shortName} (E-Saraban)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
