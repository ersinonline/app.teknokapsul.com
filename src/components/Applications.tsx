import React from 'react';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { Application } from '../types/data';
import { formatDate } from '../utils/date';

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Onay Bekliyor';
    case 'approved':
      return 'Aktif';
    case 'rejected':
      return 'Reddedildi';
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

export const Applications = () => {
  const { data: applications = [], loading, error } = useFirebaseData<Application>('applications');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Başvurular yüklenirken bir hata oluştu." />;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Başvuru Bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Henüz hiç başvuru yapmadınız.</p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Yeni Başvuru Yap
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Başvurularım</h1>
      </div>

      <div className="grid gap-4">
        {applications.map((application) => (
          <div key={application.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">{application.type}</h3>
                  <p className="text-sm text-gray-600">{application.details}</p>
                  {application.brand && (
                    <p className="text-sm text-gray-500 mt-1">Marka: {application.brand}</p>
                  )}
                  {application.category && (
                    <p className="text-sm text-gray-500 mt-1">Kategori: {application.category}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(application.status)}
                  <span className="text-sm font-medium">{getStatusDisplay(application.status)}</span>
                </div>
                <span className="text-sm text-gray-500">{formatDate(application.date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};