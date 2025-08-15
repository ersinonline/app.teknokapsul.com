/**
 * İş Bankası OAuth 2.0 entegrasyonu servisi
 * 
 * Bu servis İş Bankası OAuth 2.0 akışını yönetir:
 * 1. Authorization URL oluşturma
 * 2. Authorization code'u access token ile değiştirme
 * 3. Kullanıcı bilgilerini alma
 * 4. Firebase Authentication ile entegrasyon
 */

import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface IsBankOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
  verified: boolean;
}

class IsBankOAuthService {
  private static instance: IsBankOAuthService;
  private config: IsBankOAuthConfig;

  constructor() {
    // İş Bankası OAuth yapılandırması
    // Bu bilgiler İş Bankası Developer Portal'dan alınmalı
    this.config = {
      clientId: process.env.VITE_ISBANK_CLIENT_ID || '',
      clientSecret: process.env.VITE_ISBANK_CLIENT_SECRET || '',
      redirectUri: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/auth/callback/isbank'
        : 'https://app.teknokapsul.info/auth/callback/isbank',
      scope: 'openid profile email phone',
      authorizationUrl: 'https://api.isbank.com.tr/oauth2/authorize',
      tokenUrl: 'https://api.isbank.com.tr/oauth2/token',
      userInfoUrl: 'https://api.isbank.com.tr/oauth2/userinfo'
    };
  }

  /**
   * Singleton instance döndürür
   */
  public static getInstance(): IsBankOAuthService {
    if (!IsBankOAuthService.instance) {
      IsBankOAuthService.instance = new IsBankOAuthService();
    }
    return IsBankOAuthService.instance;
  }

  /**
   * İş Bankası OAuth authorization URL'ini oluşturur
   */
  public getAuthorizationUrl(): string {
    const state = this.generateState();
    const nonce = this.generateNonce();
    
    // State ve nonce'u localStorage'da sakla (güvenlik için)
    localStorage.setItem('isbank_oauth_state', state);
    localStorage.setItem('isbank_oauth_nonce', nonce);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state: state,
      nonce: nonce
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Authorization code'u access token ile değiştirir
   */
  public async exchangeCodeForToken(code: string, state: string): Promise<TokenResponse> {
    // State doğrulaması
    const savedState = localStorage.getItem('isbank_oauth_state');
    if (!savedState || savedState !== state) {
      throw new Error('Invalid state parameter');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
      }

      const tokenData: TokenResponse = await response.json();
      
      // State ve nonce'u temizle
      localStorage.removeItem('isbank_oauth_state');
      localStorage.removeItem('isbank_oauth_nonce');

      return tokenData;
    } catch (error) {
      console.error('İş Bankası token exchange hatası:', error);
      throw error;
    }
  }

  /**
   * Access token ile kullanıcı bilgilerini alır
   */
  public async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await fetch(this.config.userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`User info request failed: ${response.status} - ${errorData}`);
      }

      const userInfo: UserInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('İş Bankası user info hatası:', error);
      throw error;
    }
  }

  /**
   * İş Bankası OAuth ile Firebase Authentication entegrasyonu
   */
  public async signInWithIsBank(code: string, state: string): Promise<void> {
    try {
      // 1. Authorization code'u access token ile değiştir
      const tokenResponse = await this.exchangeCodeForToken(code, state);
      
      // 2. Kullanıcı bilgilerini al
      const userInfo = await this.getUserInfo(tokenResponse.access_token);
      
      // 3. Backend'e İş Bankası kullanıcı bilgilerini gönder ve Firebase custom token al
      const customToken = await this.createFirebaseCustomToken(userInfo, tokenResponse);
      
      // 4. Firebase'de custom token ile giriş yap
      await signInWithCustomToken(auth, customToken);
      
      console.log('İş Bankası OAuth girişi başarılı:', userInfo.email);
    } catch (error) {
      console.error('İş Bankası OAuth giriş hatası:', error);
      throw error;
    }
  }

  /**
   * İş Bankası kullanıcı bilgileri ile Firebase custom token oluşturur
   */
  private async createFirebaseCustomToken(userInfo: UserInfo, tokenResponse: TokenResponse): Promise<string> {
    try {
      // Backend endpoint'ine İş Bankası kullanıcı bilgilerini gönder
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://127.0.0.1:5001/superapp-37db4/us-central1'
        : 'https://us-central1-superapp-37db4.cloudfunctions.net';

      const response = await fetch(`${baseUrl}/createIsBankUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInfo,
          tokenResponse
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Firebase custom token creation failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.customToken) {
        throw new Error('Custom token creation failed: ' + (result.error || 'Unknown error'));
      }

      return result.customToken;
    } catch (error) {
      console.error('Firebase custom token oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Güvenli rastgele state parametresi oluşturur
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Güvenli rastgele nonce parametresi oluşturur
   */
  private generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * İş Bankası OAuth girişini başlatır (kullanıcıyı İş Bankası'na yönlendirir)
   */
  public initiateLogin(): void {
    const authUrl = this.getAuthorizationUrl();
    window.location.href = authUrl;
  }
}

// Singleton instance export
export const isBankOAuthService = IsBankOAuthService.getInstance();
export default IsBankOAuthService;