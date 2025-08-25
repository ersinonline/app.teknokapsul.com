import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { initializeNotifications } from '../../services/notification.service';

export const NotificationPrompt: React.FC = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = React.useState(true);

  const handleEnableNotifications = async () => {
    if (!user) return;

    try {
      await initializeNotifications(user.id);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 max-w-sm bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Bell className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Bildirimleri Etkinleştir</h3>
          <p className="mt-1 text-sm text-gray-500">
            Önemli güncellemeler ve hatırlatıcılar için bildirimleri açın.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleEnableNotifications}
              className="flex-1 bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-700"
            >
              Bildirimleri Aç
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              Daha Sonra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};