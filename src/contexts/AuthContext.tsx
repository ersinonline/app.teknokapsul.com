import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { AuthContextType } from '../types/auth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { isWebView, sendMessageToApp, getWebViewType } from '../utils/webview';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [isWebViewEnv, setIsWebViewEnv] = useState(false);
  
  useEffect(() => {
    setIsWebViewEnv(isWebView());
    
    // WebView içindeyse ana uygulamaya bilgi gönder
    if (isWebView()) {
      sendMessageToApp({
        type: 'webview_ready',
        url: window.location.href,
        userAgent: navigator.userAgent,
        webViewType: getWebViewType()
      });
    }
  }, []);

  const signOut = async () => {
    try {
      // WebView içindeyse ana uygulamaya çıkış bilgisi gönder
      if (isWebViewEnv) {
        sendMessageToApp({
          type: 'user_signed_out',
          timestamp: Date.now()
        });
      }
      
      await clerkSignOut();
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

  // WebView içinde giriş durumu değişikliklerini izle
  useEffect(() => {
    if (isWebViewEnv && isLoaded) {
      if (isSignedIn && clerkUser) {
        sendMessageToApp({
          type: 'user_signed_in',
          user: {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
          },
          timestamp: Date.now()
        });
      }
    }
  }, [isSignedIn, clerkUser, isLoaded, isWebViewEnv]);
  
  const value = {
    user: clerkUser || null,
    isWebView: isWebViewEnv,
    loading: !isLoaded,
    error: null,
    tokenValid: isSignedIn || false,
    sessionChecked: isLoaded,
    signOut,
    verifyToken,
    checkSession,
    refreshToken
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