import React, { useState } from 'react';
import { Plus, Car, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Vehicle } from '../../types/vehicle';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { calculateDaysRemaining } from '../../utils/date';
import { VehicleForm } from '../../components/vehicles/VehicleForm';

export const VehiclesPage = () => {
  const { user } = useAuth();
  const { data: vehicles = [], loading, error } = useFirebaseData<Vehicle>('vehicles');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Araçlar yüklenirken bir hata oluştu." />;

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Araçlarım</h1>
        <button
          onClick={() => setIsAddingVehicle(true)}
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Araç Ekle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Araç Bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Henüz araç eklemediniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => {
            const inspectionDays = calculateDaysRemaining(vehicle.nextInspectionDate);
            const maintenanceDays = calculateDaysRemaining(vehicle.nextMaintenanceDate);
            const insuranceDays = calculateDaysRemaining(vehicle.insuranceEndDate);

            const hasWarning = inspectionDays <= 30 || maintenanceDays <= 30 || insuranceDays <= 30;

            return (
              <div 
                key={vehicle.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium">{vehicle.plate}</h3>
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

                  <div className="space-y-2">
                    <p className="text-gray-600">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </p>

                    {/* Warnings */}
                    <div className="space-y-2 mt-4">
                      {inspectionDays <= 30 && (
                        <div className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                          Muayeneye {inspectionDays} gün kaldı
                        </div>
                      )}
                      {maintenanceDays <= 30 && (
                        <div className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                          Bakıma {maintenanceDays} gün kaldı
                        </div>
                      )}
                      {insuranceDays <= 30 && (
                        <div className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                          Sigortanın bitmesine {insuranceDays} gün kaldı
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddingVehicle && (
        <VehicleForm
          onClose={() => setIsAddingVehicle(false)}
          onSave={async () => {
            await reload();
            setIsAddingVehicle(false);
          }}
        />
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedVehicle.plate}</h2>
                <button 
                  onClick={() => setSelectedVehicle(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Vehicle Info */}
              <div>
                <h3 className="text-lg font-medium mb-4">Araç Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Marka</p>
                    <p className="font-medium">{selectedVehicle.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium">{selectedVehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Yıl</p>
                    <p className="font-medium">{selectedVehicle.year}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-medium mb-4">Belgeler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sigorta</p>
                        <p className="text-sm text-gray-500">
                          Bitiş: {new Date(selectedVehicle.insuranceEndDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {selectedVehicle.documents?.insurance && (
                        <a
                          href={selectedVehicle.documents.insurance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Muayene</p>
                        <p className="text-sm text-gray-500">
                          Son: {new Date(selectedVehicle.lastInspectionDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {selectedVehicle.documents?.inspection && (
                        <a
                          href={selectedVehicle.documents.inspection}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <FileText className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedVehicle.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Notlar</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedVehicle.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};