import { auth as adminAuth } from '../lib/firebase-admin';

/**
 * Mobil uygulamadan gelen Firebase token'ını doğrulayan API endpoint
 * 
 * Bu fonksiyon, mobil uygulamadan gelen Firebase ID token'ını doğrular ve
 * webview için bir custom token oluşturur.
 */
export async function verifyAndCreateCustomToken(idToken: string) {
  try {
    if (!idToken) {
      throw new Error('ID token gerekli');
    }
    
    // Firebase ID token'ını doğrula
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Webview için custom token oluştur
    const customToken = await adminAuth.createCustomToken(uid);
    
    return { customToken };
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    throw new Error('Geçersiz token');
  }
}