import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 z-50">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>İnternet bağlantısı yok - Offline modda çalışıyorsunuz</span>
          </div>
        </div>
      )}

      {/* Online Notification */}
      {showNotification && isOnline && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wifi className="w-4 h-4" />
            <span>İnternet bağlantısı yeniden kuruldu</span>
          </div>
        </div>
      )}
    </>
  );
};