import React, { useState } from 'react';
import { Plus, Car, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Vehicle } from '../../types/vehicle';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { calculateDaysRemaining } from '../../utils/date';

export const VehiclesPage = () => {
  const { user } = useAuth();
  const { data: vehicles = [], loading, error } = useFirebaseData<Vehicle>('vehicles');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Araçlar yüklenirken bir hata oluştu." />;

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
              <div key={vehicle.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium">{vehicle.plate}</h3>
                    </div>
                    {hasWarning && (
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                    )}
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

                    {/* Documents */}
                    <div className="flex gap-2 mt-4">
                      {vehicle.documents?.insurance && (
                        <a
                          href={vehicle.documents.insurance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Sigorta
                        </a>
                      )}
                      {vehicle.documents?.inspection && (
                        <a
                          href={vehicle.documents.inspection}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Muayene
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Form Modal will be added here */}
    </div>
  );
};