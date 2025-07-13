import React, { useState } from 'react';
import { Plus, Search, AlertCircle, CheckCircle, Clock, Shield, Package, Filter } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { WarrantyForm } from '../../components/warranty/WarrantyForm';
import { WarrantyCard } from '../../components/warranty/WarrantyCard';

interface Warranty {
  id: string;
  productName: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyPeriod: number; // months
  warrantyEndDate: Date;
  category: string;
  purchasePrice: number;
  store?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
}

export const WarrantyTrackingPage = () => {
  const { user } = useAuth();
  const { data: warranties = [], loading, error, reload } = useFirebaseData<Warranty>('warranties');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDelete = async (warrantyId: string) => {
    if (!user) return;
    if (window.confirm('Bu garanti kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'teknokapsul', user.uid, 'warranties', warrantyId));
        await reload();
      } catch (error) {
        console.error('Error deleting warranty:', error);
      }
    }
  };

  const categories = Array.from(new Set(warranties.map(warranty => warranty.category)));

  // Calculate warranty status
  const getWarrantyStatus = (warranty: Warranty): 'active' | 'expired' | 'expiring_soon' => {
    const now = new Date();
    const endDate = warranty.warrantyEndDate instanceof Date ? warranty.warrantyEndDate : new Date(warranty.warrantyEndDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'active';
  };

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = 
      warranty.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warranty.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warranty.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || warranty.category === selectedCategory;
    
    const status = getWarrantyStatus(warranty);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: warranties.length,
    active: warranties.filter(w => getWarrantyStatus(w) === 'active').length,
    expiringSoon: warranties.filter(w => getWarrantyStatus(w) === 'expiring_soon').length,
    expired: warranties.filter(w => getWarrantyStatus(w) === 'expired').length
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Garanti bilgileri yüklenirken bir hata oluştu." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Garanti Takibi</h1>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            style={{ backgroundColor: '#ffb700' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yeni Garanti Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Toplam Ürün</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Aktif Garanti</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Yakında Bitiyor</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Süresi Dolmuş</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5" style={{ color: '#ffb700' }} />
            <h2 className="text-lg font-semibold text-gray-900">Arama ve Filtreleme</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Ürün, marka, model ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">Tüm kategoriler</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900"
              style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#ffb700'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="all">Tüm durumlar</option>
              <option value="active">Aktif</option>
              <option value="expiring_soon">Yakında bitiyor</option>
              <option value="expired">Süresi dolmuş</option>
            </select>
          </div>
        </div>

        {/* Warranties List */}
        {filteredWarranties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || selectedCategory || statusFilter !== 'all' 
                  ? 'Arama kriterlerinize uygun garanti bulunamadı' 
                  : 'Henüz garanti kaydı yok'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory || statusFilter !== 'all'
                  ? 'Farklı arama terimleri veya filtreler deneyebilirsiniz.'
                  : 'İlk garanti kaydınızı oluşturmak için yukarıdaki "Yeni Garanti Ekle" butonunu kullanın.'
                }
              </p>
              {(searchTerm || selectedCategory || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                    setStatusFilter('all');
                  }}
                  className="font-medium"
                  style={{ color: '#ffb700' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e6a500'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#ffb700'}
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarranties.map(warranty => (
              <WarrantyCard
                key={warranty.id}
                warranty={warranty}
                status={getWarrantyStatus(warranty)}
                onDelete={() => handleDelete(warranty.id)}
              />
            ))}
          </div>
        )}

        {/* Warranty Form Modal */}
        {isFormOpen && (
          <WarrantyForm
            onClose={() => setIsFormOpen(false)}
            onSave={async () => {
              await reload();
              setIsFormOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};