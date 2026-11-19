// IndexedDB storage + Blob URL helpers for reliable PDF & image viewing/persistence

const DB_NAME = 'banri_saraban_files_db';
const STORE_NAME = 'attachments';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'docId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAttachmentToIDB(
  docId: string,
  fileName: string,
  dataUrl: string
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        docId,
        fileName,
        dataUrl,
        updatedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Could not save attachment to IndexedDB:', err);
  }
}

export async function getAttachmentFromIDB(docId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const record = await new Promise<{ docId: string; dataUrl: string } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(docId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    );
    db.close();
    return record?.dataUrl || null;
  } catch (err) {
    console.warn('Could not read attachment from IndexedDB:', err);
    return null;
  }
}

export async function deleteAttachmentFromIDB(docId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Could not delete attachment from IndexedDB:', err);
  }
}

export function inferMimeType(dataUrl: string, fileName?: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  if (match && match[1]) {
    return match[1];
  }
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

/**
 * Converts a data: URL into a browser Blob URL so it can be viewed in <iframe>,
 * opened in a new tab, or downloaded without hitting Chrome/iframe data-URL blocks.
 */
export function dataUrlToBlobUrl(
  sourceUrl: string,
  fileName?: string
): { url: string; mimeType: string; isObjectUrl: boolean } {
  if (!sourceUrl.startsWith('data:')) {
    return {
      url: sourceUrl,
      mimeType: inferMimeType(sourceUrl, fileName),
      isObjectUrl: false,
    };
  }

  const commaIndex = sourceUrl.indexOf(',');
  if (commaIndex === -1) {
    return { url: sourceUrl, mimeType: 'application/octet-stream', isObjectUrl: false };
  }

  const header = sourceUrl.slice(0, commaIndex);
  const body = sourceUrl.slice(commaIndex + 1);
  const mimeType = inferMimeType(sourceUrl, fileName);
  const isBase64 = header.includes(';base64');

  let byteArray: Uint8Array;
  if (isBase64) {
    const binary = atob(body.replace(/\s/g, ''));
    byteArray = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i);
    }
  } else {
    const decoded = decodeURIComponent(body);
    byteArray = new TextEncoder().encode(decoded);
  }

  const blob = new Blob([byteArray.buffer as ArrayBuffer], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  return { url: blobUrl, mimeType, isObjectUrl: true };
}

/**
 * Resolves the actual view URL (handling both inline data URLs and idb: pointers)
 */
export async function resolveDocumentAttachment(
  docId: string,
  attachmentUrl?: string,
  attachmentName?: string
): Promise<{ url: string; mimeType: string; isObjectUrl: boolean } | null> {
  let rawUrl = attachmentUrl;
  if (!rawUrl || rawUrl.startsWith('idb:')) {
    const fromIdb = await getAttachmentFromIDB(docId);
    if (fromIdb) {
      rawUrl = fromIdb;
    } else {
      return null;
    }
  }
  return dataUrlToBlobUrl(rawUrl, attachmentName);
}
