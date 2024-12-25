import React from 'react';
import { Application } from '../../types/data';

interface RecentApplicationsProps {
  applications: Application[];
}

export const RecentApplications: React.FC<RecentApplicationsProps> = ({ applications }) => {
  // Son başvuruları hesaplamak için `slice` işlemini optimize ettik.
  const recentApplications = applications
    .slice(0, 3)
    .map(app => ({
      id: app.id,
      number: app.id.slice(0, 6), // Başvuru numarasının ilk 6 hanesi
      brand: app.brand, // Marka adı
      details: app.details, // Detay bilgisi
      status: app.status, // Durum bilgisi
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Başlık */}
      <h2 className="text-lg font-semibold mb-4">Son Başvurular</h2>

      {/* Başvuru Listesi */}
      <div className="space-y-4">
        {recentApplications.length > 0 ? (
          recentApplications.map(app => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {app.number} {app.brand && `/ ${app.brand}`}
                </p>
                <p className="text-sm text-gray-500">Başvuru No / Detay</p>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  app.status === 'Onaylandı'
                    ? 'bg-green-100 text-green-800'
                    : app.status === 'Reddedildi'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {app.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Son başvuru bulunamadı.</p>
        )}
      </div>
    </div>
  );
};