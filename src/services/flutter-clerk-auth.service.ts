import { useClerk, useUser } from '@clerk/clerk-react';
import { auth } from '../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

/**
 * Flutter uygulamasından Clerk token entegrasyonu servisi
 * 
 * Bu servis Flutter uygulamasından gelen Clerk session token'ını işler ve
 * web uygulamasında otomatik giriş sağlar.
 */
export class FlutterClerkAuthService {
  private static instance: FlutterClerkAuthService;
  private clerk: any;
  private isInitialized = false;

  constructor() {
    this.initializeClerk();
  }

  static getInstance(): FlutterClerkAuthService {
    if (!FlutterClerkAuthService.instance) {
      FlutterClerkAuthService.instance = new FlutterClerkAuthService();
    }
    return FlutterClerkAuthService.instance;
  }

  private async initializeClerk() {
    try {
      // Clerk'in yüklenmesini bekle
      if (typeof window !== 'undefined' && window.Clerk) {
        this.clerk = window.Clerk;
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Clerk initialization error:', error);
    }
  }

  /**
   * Flutter'dan gelen Clerk session token'ını işler
   */
  async processFlutterClerkToken(sessionToken: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initializeClerk();
      }

      if (!sessionToken) {
        throw new Error('Session token gerekli');
      }

      // Clerk session'ını restore et
      const session = await this.restoreClerkSession(sessionToken);
      
      if (session) {
        // Firebase ile entegrasyon için custom token oluştur
        const firebaseToken = await this.createFirebaseCustomToken(session);
        
        if (firebaseToken) {
          // Firebase'e giriş yap
          await signInWithCustomToken(auth, firebaseToken);
        }

        return {
          success: true,
          message: 'Flutter Clerk token başarıyla işlendi',
          user: session.user
        };
      }

      throw new Error('Geçersiz session token');
    } catch (error) {
      console.error('Flutter Clerk token işleme hatası:', error);
      return {
        success: false,
        message: `Token işleme hatası: ${error}`
      };
    }
  }

  /**
   * Clerk session'ını restore eder
   */
  private async restoreClerkSession(sessionToken: string): Promise<any> {
    try {
      // Clerk session'ını token ile restore et
      const response = await fetch('/api/clerk/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken })
      });

      if (!response.ok) {
        throw new Error('Session doğrulama başarısız');
      }

      const sessionData = await response.json();
      return sessionData.session;
    } catch (error) {
      console.error('Session restore hatası:', error);
      return null;
    }
  }

  /**
   * Clerk session'ından Firebase custom token oluşturur
   */
  private async createFirebaseCustomToken(session: any): Promise<string | null> {
    try {
      const response = await fetch('/api/firebase/create-custom-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: session.user.id,
          email: session.user.emailAddresses[0]?.emailAddress,
          displayName: session.user.fullName
        })
      });

      if (!response.ok) {
        throw new Error('Firebase custom token oluşturulamadı');
      }

      const data = await response.json();
      return data.customToken;
    } catch (error) {
      console.error('Firebase custom token hatası:', error);
      return null;
    }
  }

  /**
   * Flutter'dan gelen auth mesajlarını dinler
   */
  setupFlutterAuthListener() {
    if (typeof window === 'undefined') return;

    // Flutter'dan gelen mesajları dinle
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'flutter_clerk_auth') {
        const { sessionToken } = event.data;
        await this.processFlutterClerkToken(sessionToken);
      }
    });

    // Android WebView interface
    if (window.FlutterInterface?.getClerkToken) {
      const checkForToken = async () => {
        try {
          const tokenData = window.FlutterInterface?.getClerkToken();
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            if (parsed.sessionToken) {
              await this.processFlutterClerkToken(parsed.sessionToken);
            }
          }
        } catch (error) {
          console.error('Flutter interface error:', error);
        }
      };

      // Sayfa yüklendiğinde ve periyodik olarak kontrol et
      checkForToken();
      setInterval(checkForToken, 1000);
    }

    // iOS WebView interface
    if (window.webkit?.messageHandlers?.clerkAuth) {
      window.webkit.messageHandlers.clerkAuth.postMessage({
        type: 'request_token'
      });
    }
  }

  /**
   * URL parametrelerinden Clerk token'ını okur
   */
  async processUrlClerkToken(): Promise<boolean> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clerkToken = urlParams.get('clerk_token');
      
      if (clerkToken) {
        const result = await this.processFlutterClerkToken(clerkToken);
        
        if (result.success) {
          // URL'den token parametresini temizle
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('clerk_token');
          window.history.replaceState({}, '', newUrl.toString());
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('URL token işleme hatası:', error);
      return false;
    }
  }
}

// Global instance
export const flutterClerkAuthService = FlutterClerkAuthService.getInstance();

// TypeScript için window interface genişletmesi
declare global {
  interface Window {
    FlutterInterface?: {
      getClerkToken(): string;
    };
    webkit?: {
      messageHandlers?: {
        clerkAuth?: {
          postMessage(message: any): void;
        };
      };
    };
  }
}