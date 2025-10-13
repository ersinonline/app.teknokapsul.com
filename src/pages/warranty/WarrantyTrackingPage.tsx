import { useState } from 'react';
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
  invoiceUrl?: string;
  userId: string;
  createdAt: Date;
}

export const WarrantyTrackingPage = () => {
  const { user } = useAuth();
  const { data: warranties = [], loading, error, reload } = useFirebaseData<Warranty>('warranties');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDelete = async (warrantyId: string) => {
    if (!user) return;
    if (window.confirm('Bu garanti kaydını silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'teknokapsul', user.id, 'warranties', warrantyId));
        await reload();
      } catch (error) {
        console.error('Error deleting warranty:', error);
      }
    }
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setIsFormOpen(true);
  };

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
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-xl font-semibold text-gray-900">Garanti Takibi</h1>
            <button
              onClick={() => setIsFormOpen(true)}
              className="ml-auto flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#ffb700' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Garanti Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4 space-y-6">
        {/* Statistics */}
        <div className="space-y-3">
          {/* Toplam Ürün - Geniş */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Toplam Ürün</p>
              </div>
            </div>
          </div>
          
          {/* Aktif ve Yakında Bitiyor - Yan Yana */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-sm text-gray-600">Aktif</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
                  <p className="text-sm text-gray-600">Yakında Bitiyor</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Süresi Dolmuş - Geniş (sadece varsa göster) */}
          {stats.expired > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                  <p className="text-sm text-gray-600">Süresi Dolmuş</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#ffb700]/10 p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#ffb700] rounded-xl shadow-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Arama ve Filtreleme</h2>
                <p className="text-gray-600 text-sm">Garantilerinizi kolayca bulun</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ürün, marka veya model ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent appearance-none bg-white"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <option value="">Tüm Kategoriler</option>
                  {Array.from(new Set(warranties.map(w => w.category))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent appearance-none bg-white"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#ffb700'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="expiring_soon">Yakında Bitiyor</option>
                  <option value="expired">Süresi Dolmuş</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Warranty List */}
        {filteredWarranties.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {warranties.length === 0 ? 'Henüz garanti kaydınız yok' : 'Arama kriterlerinize uygun garanti bulunamadı'}
            </h3>
            <p className="text-gray-500 mb-4">
              {warranties.length === 0 
                ? 'İlk garanti kaydınızı oluşturmak için yukarıdaki "Yeni Garanti Ekle" butonunu kullanın.'
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarranties.map(warranty => (
              <WarrantyCard
                key={warranty.id}
                warranty={warranty}
                status={getWarrantyStatus(warranty)}
                onDelete={() => handleDelete(warranty.id)}
                onEdit={() => handleEdit(warranty)}
              />
            ))}
          </div>
        )}

        {/* Warranty Form Modal */}
        {isFormOpen && (
          <WarrantyForm
            warranty={editingWarranty}
            onClose={() => {
              setIsFormOpen(false);
              setEditingWarranty(null);
            }}
            onSave={async () => {
              await reload();
              setIsFormOpen(false);
              setEditingWarranty(null);
            }}
          />
        )}
      </div>
    </div>
  );
};