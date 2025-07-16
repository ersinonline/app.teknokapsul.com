import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContextType } from '../types/auth';
import { signOut as firebaseSignOut, getRedirectResult } from 'firebase/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
        // Clear errors when user state changes successfully
        if (user) {
          setError(null);
        }
      },
      (error) => {
        console.error('Authentication error:', error);
        setError('Authentication error occurred');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      setError('Error during sign-out');
    }
  };

  const value = {
    user,
    loading,
    error,
    signOut
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