import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileAuthHandlerProps {
  onAuthSuccess?: () => void;
  onAuthFailure?: (error: any) => void;
}

/**
 * Mobil uygulamadan gelen kimlik doğrulama durumunu izleyen bileşen
 * Firebase Auth onAuthStateChanged otomatik olarak oturum yönetimini sağlar
 */
export const MobileAuthHandler: React.FC<MobileAuthHandlerProps> = ({
  onAuthSuccess,
  onAuthFailure
}) => {
  const { user, loading, error } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && onAuthSuccess) {
        onAuthSuccess();
      } else if (!user && error && onAuthFailure) {
        onAuthFailure(error);
      }
    }
  }, [user, loading, error, onAuthSuccess, onAuthFailure]);

  // Bileşen görünmez, sadece işlevsellik sağlar
  return null;
};

export default MobileAuthHandler;