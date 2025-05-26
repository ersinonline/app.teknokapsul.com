import React, { useState } from 'react';
import { Plus, Building2, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Home } from '../../types/home';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { calculateDaysRemaining } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

export const HomesPage = () => {
  const { user } = useAuth();
  const { data: homes = [], loading, error } = useFirebaseData<Home>('homes');
  const [isAddingHome, setIsAddingHome] = useState(false);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Evler yüklenirken bir hata oluştu." />;

  const handleHomeClick = (home: Home) => {
    setSelectedHome(home);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Evlerim</h1>
        <button
          onClick={() => setIsAddingHome(true)}
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ev Ekle
        </button>
      </div>

      {homes.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ev Bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Henüz ev eklemediniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homes.map(home => {
            const isRental = home.type === 'rental';
            const contractDays = isRental ? calculateDaysRemaining(home.contractEndDate || '') : null;
            const hasWarning = isRental && contractDays !== null && contractDays <= 30;

            return (
              <div 
                key={home.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleHomeClick(home)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{home.type === 'rental' ? 'Kiralık' : 'Mülk'}</h3>
                        <p className="text-sm text-gray-600">{home.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasWarning && (
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {isRental && (
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        Kira: {formatCurrency(home.rentAmount || 0)}
                      </p>
                      <p className="text-gray-600">
                        Ödeme Günü: Her ayın {home.rentDueDay}. günü
                      </p>

                      {/* Contract Warning */}
                      {hasWarning && (
                        <div className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded mt-4">
                          Kontrat bitimine {contractDays} gün kaldı
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Home Detail Modal */}
      {selectedHome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedHome.type === 'rental' ? 'Kiralık Ev' : 'Mülk'}
                </h2>
                <button 
                  onClick={() => setSelectedHome(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Home Info */}
              <div>
                <h3 className="text-lg font-medium mb-4">Ev Bilgileri</h3>
                <p className="text-gray-600">{selectedHome.address}</p>
                
                {selectedHome.type === 'rental' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Kira Tutarı</p>
                      <p className="font-medium">{formatCurrency(selectedHome.rentAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ödeme Günü</p>
                      <p className="font-medium">Her ayın {selectedHome.rentDueDay}. günü</p>
                    </div>
                    {selectedHome.contractStartDate && (
                      <div>
                        <p className="text-sm text-gray-500">Kontrat Başlangıç</p>
                        <p className="font-medium">
                          {new Date(selectedHome.contractStartDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                    {selectedHome.contractEndDate && (
                      <div>
                        <p className="text-sm text-gray-500">Kontrat Bitiş</p>
                        <p className="font-medium">
                          {new Date(selectedHome.contractEndDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-medium mb-4">Belgeler</h3>
                <div className="space-y-4">
                  {selectedHome.documents?.contract && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Kira Sözleşmesi</p>
                          <p className="text-sm text-gray-500">
                            {selectedHome.contractStartDate && `Başlangıç: ${new Date(selectedHome.contractStartDate).toLocaleDateString('tr-TR')}`}
                          </p>
                        </div>
                        <a
                          href={selectedHome.documents.contract}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedHome.documents?.bills && selectedHome.documents.bills.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-medium">Faturalar</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedHome.documents.bills.map((bill, index) => (
                          <a
                            key={index}
                            href={bill}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center"
                          >
                            <FileText className="w-5 h-5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedHome.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Notlar</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedHome.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};