import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with required Google Workspace Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// Memory-only cache for OAuth token (Never in localStorage as required by security policy)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function mapAuthErrorToThai(error: any): string {
  const code = error?.code || '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป (Pop-up) กรุณากดอนุญาตป๊อปอัปของเว็บไซต์นี้ หรือเปิดในแท็บเบราว์เซอร์ใหม่แล้วลองอีกครั้ง';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการเสร็จสิ้น กรุณากดปุ่มเข้าสู่ระบบและเลือกบัญชี Google ให้เรียบร้อย';
    case 'auth/unauthorized-domain':
      return `โดเมน "${hostname}" ยังไม่ได้รับอนุญาตใน Firebase Authentication (กรุณาเพิ่มโดเมนนี้ใน Firebase Console → Authentication → Settings → Authorized domains)`;
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิดใช้งาน Google Sign-In ในโปรเจกต์ Firebase นี้';
    case 'auth/network-request-failed':
      return 'การเชื่อมต่อเครือข่ายขัดข้อง ไม่สามารถติดต่อเซิร์ฟเวอร์ Google ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
    case 'auth/timeout':
      return 'การเข้าสู่ระบบใช้เวลานานเกินกำหนด (หน้าต่างป๊อปอัปอาจถูกซ่อนหรือเปิดจากแอป LINE/Facebook) กรุณากดเปิดในเบราว์เซอร์ Chrome/Safari แล้วลองใหม่';
    default:
      return error?.message || 'ไม่สามารถเข้าสู่ระบบ Google ได้ กรุณาลองใหม่อีกครั้ง';
  }
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token expired from memory reload; needs interaction to get token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const checkRedirectAuthResult = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) return null;
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Redirect Sign-In Error:', error);
    throw error;
  }
};

export const resetSignInFlag = () => {
  isSigningIn = false;
};

export const googleSignIn = async (
  timeoutMs = 35000
): Promise<{ user: User; accessToken: string } | null> => {
  let timeoutId: number | undefined;

  try {
    isSigningIn = true;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        const timeoutErr: any = new Error('Sign-in popup timed out');
        timeoutErr.code = 'auth/timeout';
        reject(timeoutErr);
      }, timeoutMs);
    });

    const result = await Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise,
    ]);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่พบ Access Token จากการเข้าสู่ระบบ Google กรุณาลองใหม่อีกครั้ง');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  isSigningIn = true;
  await signInWithRedirect(auth, provider);
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
