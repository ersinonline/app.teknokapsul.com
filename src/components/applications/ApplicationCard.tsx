import React from 'react';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ApplicationCardProps {
  application: {
    id: string;
    type: string;
    status: string;
    date: string;
    details: string;
  };
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
}) => {
  // Durum simgesi fonksiyonunun iyileştirilmesi
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'İnceleniyor':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Onaylandı':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Reddedildi':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Başvuru Bilgileri */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-purple-500 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{application.type}</h3>
            <p className="text-sm text-gray-600">
              {new Date(application.date).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(application.status)}
          <span className="text-sm font-medium text-gray-800">
            {application.status}
          </span>
        </div>
      </div>

      {/* Başvuru Detayları */}
      <p className="mt-4 text-gray-600">{application.details}</p>
    </div>
  );
};