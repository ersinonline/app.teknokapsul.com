import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface MaintenanceBannerProps {
  message?: string;
  type?: 'info' | 'warning' | 'success';
  dismissible?: boolean;
  storageKey?: string;
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({
  message = "Site altyapısı yenilenmektedir. Verileriniz en kısa sürede hesabınıza tanımlanacaktır.",
  type = 'warning',
  dismissible = true,
  storageKey = 'maintenance-banner-dismissed'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage.getItem(storageKey);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (dismissible && storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'info':
        return 'text-blue-800';
      case 'warning':
        return 'text-yellow-800';
      case 'success':
        return 'text-green-800';
      default:
        return 'text-yellow-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'info':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${getBackgroundColor()} px-3 py-2 sm:px-4 sm:py-3 shadow-lg border-t border-gray-200`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center flex-1 min-w-0">
          <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0 ${getIconColor()}`} />
          <p className={`text-xs sm:text-sm font-medium ${getTextColor()} truncate pr-2`}>
            {message}
          </p>
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`ml-2 inline-flex items-center justify-center p-1 rounded-md ${getTextColor()} hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors flex-shrink-0`}
            aria-label="Bildirimi kapat"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MaintenanceBanner;