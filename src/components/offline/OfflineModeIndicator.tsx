import React from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOffline } from '../../contexts/OfflineContext';

interface OfflineModeIndicatorProps {
  className?: string;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ className = '' }) => {
  const { isOnline, pendingCount, syncPendingData } = useOffline();

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online and no pending data
  }

  const handleSync = async () => {
    if (isOnline && pendingCount > 0) {
      await syncPendingData();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {!isOnline ? (
        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
          <WifiOff className="w-4 h-4" />
          <span>Çevrimdışı</span>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>{pendingCount} bekleyen veri</span>
          </div>
          <button
            onClick={handleSync}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Senkronize Et</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Senkronize</span>
        </div>
      )}
    </div>
  );
};

export default OfflineModeIndicator;