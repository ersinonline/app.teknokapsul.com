import React, { useState } from 'react';
import { Package, Building, AlertCircle, CheckCircle, Clock, Trash2, FileText } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Warranty {
  id: string;
  productName: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyPeriod: number;
  warrantyEndDate: Date;
  category: string;
  purchasePrice: number;
  store?: string;
  notes?: string;
  createdAt: Date;
  userId: string;
}

interface WarrantyCardProps {
  warranty: Warranty;
  status: 'active' | 'expired' | 'expiring_soon';
  onDelete: () => void;
}

export const WarrantyCard: React.FC<WarrantyCardProps> = ({ warranty, status, onDelete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = async () => {
    if (!user || !confirm('Bu garanti kaydını silmek istediğinizden emin misiniz?')) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'warranties', warranty.id));
      onDelete();
    } catch (error) {
      console.error('Error deleting warranty:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | any) => {
    let d;
    
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date === 'object' && date !== null && 'seconds' in date && typeof (date as any).seconds === 'number') {
      // Firestore Timestamp
      d = new Date((date as any).seconds * 1000);
    } else if (date) {
      d = new Date(date);
    } else {
      return 'Tarih yok';
    }
    
    if (isNaN(d.getTime())) {
      return 'Geçersiz tarih';
    }
    
    return d.toLocaleDateString('tr-TR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getDaysUntilExpiry = () => {
    const now = new Date();
    let endDate;
    
    if (warranty.warrantyEndDate instanceof Date) {
      endDate = warranty.warrantyEndDate;
    } else if (warranty.warrantyEndDate && typeof warranty.warrantyEndDate === 'object' && warranty.warrantyEndDate !== null && 'seconds' in warranty.warrantyEndDate && typeof (warranty.warrantyEndDate as any).seconds === 'number') {
      // Firestore Timestamp
      endDate = new Date((warranty.warrantyEndDate as any).seconds * 1000);
    } else if (warranty.warrantyEndDate) {
      endDate = new Date(warranty.warrantyEndDate);
    } else {
      return 0;
    }
    
    if (isNaN(endDate.getTime())) {
      return 0;
    }
    
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Aktif'
        };
      case 'expiring_soon':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Yakında Bitiyor'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Süresi Dolmuş'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${statusConfig.borderColor} transition-all duration-200 hover:shadow-xl`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{warranty.productName}</h3>
            <p className="text-sm text-gray-600">{warranty.brand} {warranty.model && `- ${warranty.model}`}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            <span className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{warranty.category}</span>
        </div>

        {/* Warranty Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Satın Alma:</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(warranty.purchaseDate)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Garanti Bitiş:</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(warranty.warrantyEndDate)}</span>
          </div>
          
          {status !== 'expired' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kalan Süre:</span>
              <span className={`text-sm font-medium ${
                daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {daysUntilExpiry} gün
              </span>
            </div>
          )}
          
          {warranty.purchasePrice > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fiyat:</span>
              <span className="text-sm font-medium text-gray-900">{formatPrice(warranty.purchasePrice)}</span>
            </div>
          )}
        </div>

        {/* Serial Number */}
        {warranty.serialNumber && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Seri Numarası</p>
            <p className="text-sm font-mono text-gray-900">{warranty.serialNumber}</p>
          </div>
        )}

        {/* Store */}
        {warranty.store && (
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{warranty.store}</span>
          </div>
        )}

        {/* Notes */}
        {warranty.notes && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ffb700'}
            >
              <FileText className="w-4 h-4" />
              {showDetails ? 'Notları Gizle' : 'Notları Göster'}
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{warranty.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Sil</span>
          </button>
        </div>
      </div>
    </div>
  );
};