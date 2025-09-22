import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { AuthContextType } from '../types/auth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSessionPersistence } from '../hooks/useSessionPersistence';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Session persistence hook'unu kullan
  const { isSessionPersistent } = useSessionPersistence();

  // Mobil cihaz algılama
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
                           window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobil cihazlarda auth state'ini zorla güncelleme ve oturum sürekliliği
  useEffect(() => {
    if (isMobile) {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Sayfa görünür olduğunda state'i güncelle
          setForceUpdate(prev => prev + 1);
        }
      };

      const handleFocus = () => {
        // Sayfa focus aldığında state'i güncelle
        setForceUpdate(prev => prev + 1);
      };

      const handlePageShow = () => {
        // Sayfa gösterildiğinde state'i güncelle (back/forward navigation)
        setForceUpdate(prev => prev + 1);
      };

      // Storage event listener - diğer sekmelerden oturum değişikliklerini dinle
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === '__clerk_db_jwt' || e.key?.startsWith('__clerk')) {
          setForceUpdate(prev => prev + 1);
        }
      };

      // Periyodik oturum kontrolü (her 30 saniyede bir)
      const sessionCheckInterval = setInterval(() => {
        setForceUpdate(prev => prev + 1);
      }, 30000);

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('pageshow', handlePageShow);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(sessionCheckInterval);
      };
    }
  }, [isMobile]);

  const signOut = async () => {
    try {
      await clerkSignOut();
      // Çıkış sonrası state temizlenir, yönlendirme router tarafından yapılır
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Clerk için basitleştirilmiş token doğrulama
  const verifyToken = async () => {
    return {
      success: !!isSignedIn,
      tokenValid: !!isSignedIn,
      error: null as string | null
    };
  };

  // Clerk için basitleştirilmiş oturum kontrolü
  const checkSession = async () => {
    return {
      success: !!isLoaded,
      sessionValid: !!isSignedIn,
      error: null as string | null
    };
  };

  // Clerk için token yenileme (otomatik olarak yapılır)
  const refreshToken = async () => {
    return {
      success: !!isSignedIn,
      tokenValid: !!isSignedIn,
      error: null as string | null
    };
  };

  const value = {
    user: clerkUser || null,
    loading: !isLoaded,
    error: null,
    tokenValid: isSignedIn || false,
    sessionChecked: isLoaded,
    signOut,
    verifyToken,
    checkSession,
    refreshToken,
    isWebView: isMobile && /webview|wv/i.test(navigator.userAgent),
    isMobile,
    forceUpdate, // Mobil cihazlarda state güncellemesi için
    isSessionPersistent // Session persistence durumu
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoaded ? children : <LoadingSpinner />}
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