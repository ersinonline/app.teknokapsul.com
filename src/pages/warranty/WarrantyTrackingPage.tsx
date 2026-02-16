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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Garanti Takibi</h1>
                <p className="text-white/60 text-xs">{stats.total} ürün</p>
              </div>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <CheckCircle className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{stats.active}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Aktif</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{stats.expiringSoon}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Yakında</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <AlertCircle className="w-4 h-4 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold text-lg">{stats.expired}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Dolmuş</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Search and Filter */}
        <div className="bank-card p-3 mb-4">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Ürün, marka ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-xs bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Tüm Kategoriler</option>
              {Array.from(new Set(warranties.map(w => w.category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-xs bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="expiring_soon">Yakında Bitiyor</option>
              <option value="expired">Süresi Dolmuş</option>
            </select>
          </div>
        </div>

        {/* Warranty List */}
        {filteredWarranties.length === 0 ? (
          <div className="bank-card p-10 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {warranties.length === 0 ? 'Henüz garanti kaydı yok' : 'Sonuç bulunamadı'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {warranties.length === 0 ? 'İlk garanti kaydınızı oluşturun.' : 'Farklı filtreler deneyin.'}
            </p>
            {(searchTerm || selectedCategory || statusFilter !== 'all') && (
              <button onClick={() => { setSearchTerm(''); setSelectedCategory(null); setStatusFilter('all'); }} className="text-xs font-medium text-primary">
                Filtreleri temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
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
            onClose={() => { setIsFormOpen(false); setEditingWarranty(null); }}
            onSave={async () => { await reload(); setIsFormOpen(false); setEditingWarranty(null); }}
          />
        )}
      </div>
    </div>
  );
};