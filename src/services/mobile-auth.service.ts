import { signInWithCustomToken, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { verifyAndCreateCustomToken } from '../api/mobile-auth';
import { tokenVerificationService } from './token-verification.service';

/**
 * Mobil uygulama kimlik doğrulama servisi
 * Bu servis, mobil uygulamadan gelen Firebase token'ını işler
 */
class MobileAuthService {
  private static instance: MobileAuthService;

  /**
   * Singleton instance döndürür
   */
  public static getInstance(): MobileAuthService {
    if (!MobileAuthService.instance) {
      MobileAuthService.instance = new MobileAuthService();
    }
    return MobileAuthService.instance;
  }

  /**
   * Mobil uygulamadan gelen Firebase token'ı ile giriş yapar
   * @param token Firebase custom authentication token
   * @returns Promise<void>
   */
  public async signInWithMobileToken(token: string): Promise<void> {
    if (!token) {
      throw new Error('Token boş olamaz');
    }

    try {
      // Firebase custom token ile giriş yap
      const userCredential = await signInWithCustomToken(auth, token);
      console.log('Mobil token ile giriş başarılı:', userCredential.user.uid);
      
      // Başarılı giriş sonrası token'ı localStorage'a kaydet
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('firebaseIdToken', idToken);
      console.log('Yeni ID token localStorage\'a kaydedildi');
      
      return;
    } catch (error: any) {
      console.error('Mobil token ile giriş başarısız:', error);
      
      // Firebase Auth hatalarını daha anlaşılır hale getir
      if (error.code === 'auth/invalid-custom-token') {
        throw new Error('Geçersiz kimlik doğrulama token\'ı');
      } else if (error.code === 'auth/custom-token-mismatch') {
        throw new Error('Token bu proje için geçerli değil');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
      } else {
        throw new Error('Kimlik doğrulama hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  }
  
  /**
   * Mobil uygulamadan gelen ID token'ını doğrular ve webview için custom token oluşturur
   * @param idToken Firebase ID token
   * @returns Promise<string> Firebase custom token
   */
  public async verifyIdTokenAndCreateCustomToken(idToken: string): Promise<string> {
    try {
      // Önce backend'de ID token'ını doğrula
      const verification = await tokenVerificationService.verifyIdToken(idToken);
      
      if (!verification.success || !verification.tokenValid) {
        throw new Error(verification.error || 'Token doğrulama başarısız');
      }
      
      // Token geçerliyse custom token oluştur
      const customTokenResult = await tokenVerificationService.createCustomToken(idToken);
      
      if (!customTokenResult.success || !customTokenResult.customToken) {
        throw new Error(customTokenResult.error || 'Custom token oluşturulamadı');
      }
      
      return customTokenResult.customToken;
    } catch (error) {
      console.error('ID token doğrulama hatası:', error);
      throw error;
    }
  }

  /**
   * ID Token ile direkt giriş yapar (Google credential kullanarak)
   * @param idToken Firebase ID token
   * @returns Promise<void>
   */
  public async signInWithIdToken(idToken: string): Promise<void> {
    try {
      console.log('ID Token ile giriş deneniyor...');
      
      // Google credential oluştur
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Credential ile giriş yap
      const userCredential = await signInWithCredential(auth, credential);
      console.log('✅ ID Token ile giriş başarılı:', userCredential.user.email);
      
      // Token'ı localStorage'a kaydet
      localStorage.setItem('firebaseIdToken', idToken);
      console.log('✅ Token localStorage\'a kaydedildi');
      
    } catch (error: any) {
      console.error('❌ ID Token ile giriş başarısız:', error);
      
      // Firebase Auth hatalarını daha anlaşılır hale getir
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Geçersiz kimlik doğrulama bilgileri');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
      } else {
        throw new Error('Kimlik doğrulama hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    }
  }

  /**
   * URL'den token parametresini alır ve giriş yapar
   * @returns Promise<boolean> Giriş başarılı ise true, değilse false
   */
  public async checkAndSignInWithUrlToken(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('firebase_token');
    
    if (!token) {
      console.log('ℹ️ URL\'de firebase_token parametresi bulunamadı');
      return false;
    }
    
    console.log('🔍 URL\'den Firebase token bulundu:', token.substring(0, 20) + '...');
    
    try {
      // Önce ID Token ile direkt giriş yapmayı dene
      await this.signInWithIdToken(token);
      
      // Token'ı URL'den temizle
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log('✅ URL token ile giriş başarılı');
      return true;
    } catch (error) {
      console.error('❌ ID Token ile giriş başarısız, custom token deneniyor:', error);
      
      try {
        // ID Token başarısız olursa, custom token yöntemini dene
        const customToken = await this.verifyIdTokenAndCreateCustomToken(token);
        await this.signInWithMobileToken(customToken);
        
        // Token'ı URL'den temizle
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        
        console.log('✅ Custom token ile giriş başarılı');
        return true;
      } catch (customTokenError) {
        console.error('❌ Custom token ile giriş de başarısız:', customTokenError);
        // Hata durumunda localStorage'dan token'ı temizle
        localStorage.removeItem('firebaseIdToken');
        return false;
      }
    }
  }

  /**
   * Mobil uygulamadan gelen mesajları dinler
   * @param callback Mesaj alındığında çağrılacak fonksiyon
   */
  public listenForMobileMessages(callback: (data: any) => void): void {
    // Android için
    if (window.AndroidInterface) {
      // Android'den gelen mesajları dinle
      document.addEventListener('AndroidMessage', (event: any) => {
        try {
          const data = JSON.parse(event.detail);
          callback(data);
        } catch (error) {
          console.error('Android mesajı işlenemedi:', error);
        }
      });
    }

    // iOS için
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;
        if (typeof data === 'string' && data.startsWith('{')) {
          const parsedData = JSON.parse(data);
          callback(parsedData);
        }
      } catch (error) {
        console.error('iOS mesajı işlenemedi:', error);
      }
    });
  }
}

// Global interface tanımlamaları
declare global {
  interface Window {
    AndroidInterface?: {
      getAuthData(): string;
    };
  }
}

export const mobileAuthService = MobileAuthService.getInstance();