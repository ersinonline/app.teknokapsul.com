import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContextType } from '../types/auth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign-out error:', err);
      window.location.href = '/login';
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('E-posta veya şifre hatalı.');
      } else if (code === 'auth/too-many-requests') {
        setError('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      } else {
        setError(err.message || 'Giriş yapılırken bir hata oluştu.');
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      const code = err.code;
      if (code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor.');
      } else if (code === 'auth/weak-password') {
        setError('Şifre en az 6 karakter olmalıdır.');
      } else if (code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi.');
      } else {
        setError(err.message || 'Kayıt olurken bir hata oluştu.');
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
      } else {
        setError(err.message || 'Şifre sıfırlama e-postası gönderilemedi.');
      }
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    tokenValid: !!user,
    sessionChecked: !loading,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isWebView: isMobile && /webview|wv/i.test(navigator.userAgent),
    isMobile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <LoadingSpinner />}
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