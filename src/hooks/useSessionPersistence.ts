import { useAuth } from '../contexts/AuthContext';

/**
 * Oturum sürekliliğini sağlayan custom hook
 * Firebase Auth otomatik olarak oturum sürekliliğini yönetir
 */
export const useSessionPersistence = () => {
  const { user } = useAuth();

  return {
    isSessionPersistent: !!user
  };
};