import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { offlineService } from '../services/offline.service';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  syncPendingData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  addToOfflineQueue: (action: 'create' | 'update' | 'delete', collection: string, data: any, userId: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize offline service
    offlineService.init();

    // Load pending count on mount
    loadPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const [pendingExpenses, pendingIncomes, pendingPayments] = await Promise.all([
        offlineService.getPendingExpenses(),
        offlineService.getPendingIncomes(),
        offlineService.getPendingPayments()
      ]);
      
      const totalPending = (
        (pendingExpenses?.length || 0) +
        (pendingIncomes?.length || 0) +
        (pendingPayments?.length || 0)
      );
      
      setPendingCount(totalPending);
    } catch (error) {
      console.error('Failed to load pending count:', error);
      setPendingCount(0);
    }
  };

  const syncPendingData = async () => {
    try {
      if (!isOnline) {
        console.log('Cannot sync while offline');
        return;
      }

      await offlineService.syncPendingData();
      
      // Reload pending count after sync
      await loadPendingCount();
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  const clearOfflineData = async () => {
    try {
      await offlineService.clearAllOfflineData();
      setPendingCount(0);
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };

  const addToOfflineQueue = async (
    action: 'create' | 'update' | 'delete',
    collection: string,
    data: any,
    userId: string
  ) => {
    try {
      await offlineService.addToSyncQueue(action, collection, data, userId);
      await loadPendingCount();
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  };

  const value: OfflineContextType = {
    isOnline,
    pendingCount,
    syncPendingData,
    clearOfflineData,
    addToOfflineQueue
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineContext;