import React, { useState } from 'react';
import { Plus, Building2, FileText, AlertTriangle } from 'lucide-react';
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Evler yüklenirken bir hata oluştu." />;

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
              <div key={home.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                    {hasWarning && (
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                    )}
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

                      {/* Documents */}
                      <div className="flex gap-2 mt-4">
                        {home.documents.contract && (
                          <a
                            href={home.documents.contract}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Kontrat
                          </a>
                        )}
                        {home.documents.bills && home.documents.bills.length > 0 && (
                          <button className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            <FileText className="w-4 h-4 mr-1" />
                            Faturalar ({home.documents.bills.length})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Home Form Modal will be added here */}
    </div>
  );
};