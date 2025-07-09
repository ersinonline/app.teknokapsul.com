import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

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

  if (!showNotification && isOnline) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-100 border border-green-300 text-green-800'
        : 'bg-red-100 border border-red-300 text-red-800'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Bağlantı yeniden kuruldu</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Çevrimdışı mod aktif</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-xs mt-1 opacity-75">
          Veriler yerel olarak saklanıyor
        </p>
      )}
    </div>
  );
};

export default OfflineIndicator;