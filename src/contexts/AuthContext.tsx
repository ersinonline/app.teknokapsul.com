import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContextType } from '../types/auth';
import { signOut as firebaseSignOut, getRedirectResult } from 'firebase/auth';
import { webViewAuthService } from '../services/webview-auth.service';
import { tokenVerificationService } from '../services/token-verification.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);

  useEffect(() => {
    // Handle redirect result from OAuth providers
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect authentication successful:', result.user);
          // Clear any previous errors on successful authentication
          setError(null);
        }
      } catch (error: any) {
        console.error('Redirect authentication error:', error);
        if (error.code === 'auth/unauthorized-domain') {
          setError('Bu domain henüz yetkilendirilmemiş. Lütfen sistem yöneticisi ile iletişime geçin.');
        } else if (error.code === 'auth/popup-closed-by-user') {
          // Don't show error for user-cancelled actions
          console.log('User cancelled authentication');
        } else if (error.code === 'auth/network-request-failed') {
          setError('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
        } else {
          setError('Giriş yapılırken bir hata oluştu.');
        }
      }
    };

    handleRedirectResult();
    
    // WebView kimlik doğrulama dinleyicisini başlat
    webViewAuthService.listenForWebViewAuth();

    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {
        setUser(user);
        
        if (user) {
          // Kullanıcı giriş yaptığında token'ı backend'de doğrula
          try {
            const verification = await tokenVerificationService.verifyIdToken();
            setTokenValid(verification.success && (verification.tokenValid || false));
            
            if (!verification.success) {
              console.warn('Token doğrulama başarısız:', verification.error);
              setError('Oturum doğrulama hatası');
            } else {
              setError(null);
            }
          } catch (error) {
            console.error('Token doğrulama hatası:', error);
            setTokenValid(false);
            setError('Token doğrulama hatası');
          }
        } else {
          setTokenValid(false);
          setError(null);
        }
        
        setSessionChecked(true);
        setLoading(false);
      },
      (error) => {
        console.error('Authentication error:', error);
        setError('Authentication error occurred');
        setTokenValid(false);
        setSessionChecked(true);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setTokenValid(false);
      setSessionChecked(false);
    } catch (error) {
      console.error('Sign-out error:', error);
      setError('Error during sign-out');
    }
  };

  // Token doğrulama fonksiyonu
  const verifyToken = async () => {
    try {
      const verification = await tokenVerificationService.verifyIdToken();
      setTokenValid(verification.success && (verification.tokenValid || false));
      return verification;
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      setTokenValid(false);
      return { success: false, tokenValid: false, error: 'Token doğrulama hatası' };
    }
  };

  // Oturum durumu kontrol fonksiyonu
  const checkSession = async () => {
    try {
      const sessionCheck = await tokenVerificationService.checkSession();
      setTokenValid(sessionCheck.sessionValid);
      return sessionCheck;
    } catch (error) {
      console.error('Oturum kontrol hatası:', error);
      setTokenValid(false);
      return { success: false, sessionValid: false, error: 'Oturum kontrol hatası' };
    }
  };

  // Token yenileme fonksiyonu
  const refreshToken = async () => {
    try {
      const refreshed = await tokenVerificationService.refreshTokenIfNeeded();
      setTokenValid(refreshed);
      return refreshed;
    } catch (error) {
      console.error('Token yenileme hatası:', error);
      setTokenValid(false);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    tokenValid,
    sessionChecked,
    signOut,
    verifyToken,
    checkSession,
    refreshToken,
    isWebView: webViewAuthService.isWebView
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>TeknoKapsül uygulaması yükleniyor...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};