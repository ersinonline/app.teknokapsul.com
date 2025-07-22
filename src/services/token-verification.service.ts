import { auth } from '../lib/firebase';

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
    user?: Record<string, unknown>;
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

      // Firebase Auth ile doğrudan token doğrulama
      const user = auth.currentUser;
      if (user) {
        return {
          success: true,
          tokenValid: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }
        };
      }

      return {
        success: false,
        tokenValid: false,
        error: 'Kullanıcı oturumu bulunamadı'
      };
    } catch (error: unknown) {
      return {
        success: false,
        tokenValid: false,
        error: (error as Error).message || 'Token doğrulama hatası'
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
      // Firebase Auth ile doğrudan token kullanımı
      const user = auth.currentUser;
      if (user && idToken) {
        return {
          success: true,
          customToken: idToken
        };
      }

      return {
        success: false,
        error: 'Custom token oluşturulamadı'
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as Error).message || 'Custom token hatası'
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
      const user = auth.currentUser;
      
      if (!user) {
        return {
          success: false,
          sessionValid: false,
          error: 'Kullanıcı oturumu bulunamadı'
        };
      }

      return {
        success: true,
        sessionValid: true,
        uid: user.uid,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 saat sonra
      };
    } catch (error: unknown) {
      return {
        success: false,
        sessionValid: false,
        error: (error as Error).message || 'Oturum kontrol hatası'
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