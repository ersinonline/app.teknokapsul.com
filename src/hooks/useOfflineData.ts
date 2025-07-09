import { useState, useEffect } from 'react';

export const useOfflineData = (key: string, initialData: any = null) => {
  const [data, setData] = useState(initialData);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // LocalStorage'dan veri yükle
  useEffect(() => {
    const savedData = localStorage.getItem(`offline_${key}`);
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (error) {
        console.error('Offline data parse error:', error);
      }
    }
  }, [key]);

  // Online/offline durumunu takip et
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Veriyi güncelle ve offline durumda localStorage'a kaydet
  const updateData = (newData: any) => {
    setData(newData);
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(newData));
    } catch (error) {
      console.error('Offline data save error:', error);
    }
  };

  // Offline verileri temizle
  const clearOfflineData = () => {
    localStorage.removeItem(`offline_${key}`);
    setData(initialData);
  };

  // Offline durumda veri senkronizasyonu için kuyruğa ekle
  const queueForSync = (action: string, payload: any) => {
    if (isOffline) {
      const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      syncQueue.push({
        id: Date.now(),
        action,
        payload,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('sync_queue', JSON.stringify(syncQueue));
    }
  };

  // Online olduğunda senkronizasyon kuyruğunu işle
  const processSyncQueue = async () => {
    if (!isOffline) {
      const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
      if (syncQueue.length > 0) {
        // Burada API çağrıları yapılabilir
        console.log('Processing sync queue:', syncQueue);
        localStorage.removeItem('sync_queue');
      }
    }
  };

  return {
    data,
    isOffline,
    updateData,
    clearOfflineData,
    queueForSync,
    processSyncQueue
  };
};