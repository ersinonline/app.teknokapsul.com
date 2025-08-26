import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileSettings = () => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.imageUrl || '');
  const [displayName, setDisplayName] = useState(user?.fullName || '');

  const handleProfileUpdate = async () => {
    // Profil güncelleme işlemleri
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Profil Ayarları</h2>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profil"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <button className="absolute bottom-0 right-0 bg-yellow-600 text-white p-1 rounded-full">
            <User className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Ad Soyad
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={handleProfileUpdate}
        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
      >
        Profili Güncelle
      </button>
    </div>
  );
};