import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { AuthContextType } from '../types/auth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const signOut = async () => {
    try {
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
    isWebView: false // Clerk için WebView desteği şimdilik false
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