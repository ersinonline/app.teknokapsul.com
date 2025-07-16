import { useState } from 'react';
import { Lock, Shield } from 'lucide-react';

export const SecuritySettings = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Güvenlik Ayarları</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">İki Faktörlü Doğrulama</p>
              <p className="text-sm text-gray-600">Hesabınızı daha güvenli hale getirin</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
                  <Lock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium">Oturum Geçmişi</p>
              <p className="text-sm text-gray-600">Aktif oturumlarınızı görüntüleyin</p>
            </div>
          </div>
          <button className="text-yellow-600 hover:text-yellow-700">
            Görüntüle
          </button>
        </div>
      </div>
    </div>
  );
};