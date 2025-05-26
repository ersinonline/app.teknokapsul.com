import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addVehicle, uploadVehicleDocument } from '../../services/vehicle.service';
import { VehicleFormData } from '../../types/vehicle';

interface VehicleFormProps {
  onClose: () => void;
  onSave: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    lastInspectionDate: '',
    lastMaintenanceDate: '',
    insuranceEndDate: '',
    notes: ''
  });

  const [documents, setDocuments] = useState<{
    insurance?: File;
    inspection?: File;
    maintenance?: File;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Add vehicle first
      const vehicleId = await addVehicle(user.uid, formData);

      // Upload documents if provided
      const uploadPromises = Object.entries(documents).map(([type, file]) => {
        if (file) {
          return uploadVehicleDocument(vehicleId, type as 'insurance' | 'inspection' | 'maintenance', file);
        }
        return Promise.resolve();
      });

      await Promise.all(uploadPromises);

      onSave();
      onClose();
    } catch (err) {
      setError('Araç eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Araç Ekle</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plaka
              </label>
              <input
                type="text"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yıl
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marka
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Son Muayene Tarihi
            </label>
            <input
              type="date"
              value={formData.lastInspectionDate}
              onChange={(e) => setFormData({ ...formData, lastInspectionDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Son Bakım Tarihi
            </label>
            <input
              type="date"
              value={formData.lastMaintenanceDate}
              onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sigorta Bitiş Tarihi
            </label>
            <input
              type="date"
              value={formData.insuranceEndDate}
              onChange={(e) => setFormData({ ...formData, insuranceEndDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sigorta Poliçesi
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setDocuments({ ...documents, insurance: e.target.files?.[0] })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Muayene Belgesi
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setDocuments({ ...documents, inspection: e.target.files?.[0] })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bakım Belgesi
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setDocuments({ ...documents, maintenance: e.target.files?.[0] })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};