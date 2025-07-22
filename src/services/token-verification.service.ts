import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';

/**
 * Token doğrulama ve oturum yönetimi servisi
 */
class TokenVerificationService {
  private static instance: TokenVerificationService;
  private baseUrl: string;

  constructor() {
    // Firebase Functions emülatörü veya production URL'i
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:5001/superapp-37db4/us-central1'
      : 'https://us-central1-superapp-37db4.cloudfunctions.net';
  }

  /**
   * Singleton instance döndürür
   */
  public static getInstance(): TokenVerificationService {
    if (!TokenVerificationService.instance) {
      TokenVerificationService.instance = new TokenVerificationService();
    }
    return TokenVerificationService.instance;
  }

  /**
   * Mevcut kullanıcının ID token'ını alır
   */
  private async getCurrentUserIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('ID token alınamadı:', error);
      return null;
    }
  }

  /**
   * Backend'de ID token'ını doğrular ve kullanıcı bilgilerini alır
   */
  public async verifyIdToken(idToken?: string): Promise<{
    success: boolean;
    user?: any;
    tokenValid?: boolean;
    error?: string;
  }> {
    try {
      const token = idToken || await this.getCurrentUserIdToken();
      
      if (!token) {
        return {
          success: false,
          tokenValid: false,
          error: 'Token bulunamadı'
        };
      }

      const response = await fetch(`${this.baseUrl}/verifyIdToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          tokenValid: false,
          error: data.error || 'Token doğrulama başarısız'
        };
      }

      return data;
    } catch (error: any) {
      console.error('Token doğrulama hatası:', error);
      return {
        success: false,
        tokenValid: false,
        error: error.message || 'Ağ hatası'
      };
    }
  }

  /**
   * WebView için custom token oluşturur
   */
  public async createCustomToken(idToken: string): Promise<{
    success: boolean;
    customToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/createCustomToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Custom token oluşturulamadı'
        };
      }

      return data;
    } catch (error: any) {
      console.error('Custom token oluşturma hatası:', error);
      return {
        success: false,
        error: error.message || 'Ağ hatası'
      };
    }
  }

  /**
   * Kullanıcı oturum durumunu kontrol eder
   */
  public async checkSession(idToken?: string): Promise<{
    success: boolean;
    sessionValid: boolean;
    uid?: string;
    exp?: number;
    error?: string;
  }> {
    try {
      const token = idToken || await this.getCurrentUserIdToken();
      
      if (!token) {
        return {
          success: false,
          sessionValid: false,
          error: 'Token bulunamadı'
        };
      }

      const response = await fetch(`${this.baseUrl}/checkSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token })
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Oturum kontrol hatası:', error);
      return {
        success: false,
        sessionValid: false,
        error: error.message || 'Ağ hatası'
      };
    }
  }

  /**
   * Token'ın geçerlilik süresini kontrol eder
   */
  public async isTokenExpired(idToken?: string): Promise<boolean> {
    try {
      const sessionCheck = await this.checkSession(idToken);
      
      if (!sessionCheck.sessionValid) {
        return true;
      }

      if (sessionCheck.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return sessionCheck.exp < currentTime;
      }

      return false;
    } catch (error) {
      console.error('Token süre kontrolü hatası:', error);
      return true; // Hata durumunda token'ı geçersiz say
    }
  }

  /**
   * Otomatik token yenileme
   */
  public async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }

      // Token'ı zorla yenile
      await user.getIdToken(true);
      
      // Yeni token ile doğrulama yap
      const verification = await this.verifyIdToken();
      return verification.success && (verification.tokenValid || false);
    } catch (error) {
      console.error('Token yenileme hatası:', error);
      return false;
    }
  }
}

// Singleton instance export et
export const tokenVerificationService = TokenVerificationService.getInstance();
export default TokenVerificationService;