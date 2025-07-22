// Firebase import'ları mobile-auth.service.ts üzerinden kullanılıyor
import { mobileAuthService } from './mobile-auth.service';

interface WebViewAuthData {
  token?: string;
  uid?: string;
}

/**
 * WebView kimlik doğrulama servisi
 * Bu servis, mobil uygulamadan webview'a geçişte otomatik giriş yapılmasını sağlar
 */
class WebViewAuthService {
  private static instance: WebViewAuthService;
  public isWebView: boolean;

  constructor() {
    // WebView tespiti
    this.isWebView = this.detectWebView();
  }

  /**
   * Singleton instance döndürür
   */
  public static getInstance(): WebViewAuthService {
    if (!WebViewAuthService.instance) {
      WebViewAuthService.instance = new WebViewAuthService();
    }
    return WebViewAuthService.instance;
  }

  /**
   * Tarayıcının WebView olup olmadığını kontrol eder
   */
  private detectWebView(): boolean {
    const userAgent = navigator.userAgent;
    return /wv|WebView|Android.*Version\/[.\d]+.*Chrome|iPhone.*AppleWebKit.*Mobile.*Safari|iPad.*AppleWebKit.*Mobile.*Safari/.test(userAgent);
  }

  /**
   * WebView'dan gelen kimlik bilgilerini dinler
   */
  public listenForWebViewAuth(): void {
    if (!this.isWebView) {
      console.log('Bu bir WebView değil, WebView kimlik doğrulama dinleyicisi başlatılmadı');
      return;
    }

    console.log('WebView kimlik doğrulama dinleyicisi başlatıldı');
    
    // Android için
    if (window.AndroidInterface) {
      try {
        const authData = window.AndroidInterface.getAuthData();
        if (authData) {
          this.handleWebViewAuthData(JSON.parse(authData)).catch(error => {
            console.error('Android WebView auth işleme hatası:', error);
          });
        }
      } catch (error) {
        console.error('Android WebView auth data alınamadı:', error);
      }
    }

    // Mobil uygulamadan gelen mesajları dinle
    mobileAuthService.listenForMobileMessages((data) => {
      if (data.type === 'auth_data' && data.data) {
        this.handleWebViewAuthData(data.data).catch(error => {
          console.error('Mobil mesaj auth işleme hatası:', error);
        });
      }
    });

    // iOS için
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;
        if (typeof data === 'string' && data.startsWith('{')) {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'auth_data') {
            this.handleWebViewAuthData(parsedData.data).catch(error => {
              console.error('iOS WebView auth işleme hatası:', error);
            });
          }
        }
      } catch (error) {
        console.error('iOS WebView message işlenemedi:', error);
      }
    });

    // URL parametrelerinden token kontrolü
    this.checkURLForAuthToken();
  }

  /**
   * URL'den token parametresini kontrol eder
   */
  private async checkURLForAuthToken(): Promise<void> {
    try {
      // MobileAuthService'i kullanarak URL'den token kontrolü yap
      const success = await mobileAuthService.checkAndSignInWithUrlToken();
      
      if (success) {
        console.log('URL token ile giriş başarılı');
      }
    } catch (error) {
      console.error('URL token kontrolü sırasında hata:', error);
    }
  }

  /**
   * WebView'dan gelen kimlik bilgilerini işler
   */
  private async handleWebViewAuthData(authData: WebViewAuthData): Promise<void> {
    console.log('WebView auth data alındı:', authData);
    
    if (authData.token) {
      // Token doğrudan geldiyse (custom token), direkt giriş yap
      await this.signInWithToken(authData.token);
    } else if (authData.uid) {
      console.log('UID alındı, ancak token olmadan giriş yapılamaz:', authData.uid);
      // Burada UID ile custom token oluşturma işlemi yapılabilir
      // Örnek: const customToken = await createCustomTokenWithUID(authData.uid);
      // await this.signInWithToken(customToken);
    }
  }

  /**
   * Firebase custom token ile giriş yapar
   */
  private async signInWithToken(token: string): Promise<void> {
    try {
      // MobileAuthService'i kullanarak token ile giriş yap
      await mobileAuthService.signInWithMobileToken(token);
      console.log('WebView token ile giriş başarılı');
    } catch (error) {
      console.error('WebView token ile giriş başarısız:', error);
    }
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

export const webViewAuthService = WebViewAuthService.getInstance();