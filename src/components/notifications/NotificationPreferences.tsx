import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface NotificationSettings {
  paymentReminders: boolean;
  subscriptionReminders: boolean;
  statusUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    paymentReminders: true,
    subscriptionReminders: true,
    statusUpdates: true,
    emailNotifications: true,
    pushNotifications: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, 'teknokapsul', user.uid, 'notifications', 'settings');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSettings(docSnap.data() as NotificationSettings);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setError('Bildirim ayarları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!user) return;

    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };

    try {
      await setDoc(doc(db, 'teknokapsul', user.uid, 'notifications', 'settings'), newSettings);
      setSettings(newSettings);
      setSuccess('Bildirim ayarları güncellendi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Bildirim ayarları güncellenirken bir hata oluştu');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg font-medium">Bildirim Ayarları</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Bildirim Türleri</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Ödeme Hatırlatıcıları</p>
                <p className="text-xs text-gray-500">Yaklaşan ödemeleriniz için bildirim alın</p>
              </div>
              <button
                onClick={() => handleToggle('paymentReminders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.paymentReminders ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.paymentReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Abonelik Hatırlatıcıları</p>
                <p className="text-xs text-gray-500">Aboneliklerinizin bitiş tarihleri için bildirim alın</p>
              </div>
              <button
                onClick={() => handleToggle('subscriptionReminders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.subscriptionReminders ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.subscriptionReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Durum Güncellemeleri</p>
                <p className="text-xs text-gray-500">Başvuru ve sipariş durumları için bildirim alın</p>
              </div>
              <button
                onClick={() => handleToggle('statusUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.statusUpdates ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.statusUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Bildirim Kanalları</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">E-posta Bildirimleri</p>
                <p className="text-xs text-gray-500">Bildirimleri e-posta olarak alın</p>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Push Bildirimleri</p>
                <p className="text-xs text-gray-500">Tarayıcı bildirimleri alın</p>
              </div>
              <button
                onClick={() => handleToggle('pushNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushNotifications ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};