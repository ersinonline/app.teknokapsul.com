import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  ExternalLink,
  Trash2,
  Search,
  Calendar,
  Truck,
  Copy,
  Check,
  CheckCircle,
  Clock,
  Filter,
  X,
  Grid,
  List
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  addCargoTracking,
  getUserCargoTrackings,
  updateCargoTracking,
  deleteCargoTracking,
  generateTrackingUrl
} from '../../services/cargo.service';
import { CargoTracking, CargoCompany, CARGO_COMPANIES } from '../../types/cargo';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/date';

export const CargoTrackingPage = () => {
  const { user } = useAuth();
  const [cargoList, setCargoList] = useState<CargoTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'delivered' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    trackingNumber: '',
    company: '',
    isDelivered: false
  });

  useEffect(() => {
    if (user) {
      loadCargoList();
    }
  }, [user]);

  const loadCargoList = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserCargoTrackings(user.id);
      setCargoList(data);
    } catch (error) {
      console.error('Error loading cargo list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.trackingNumber || !formData.company) return;

    try {
      await addCargoTracking(user.id, {
        name: formData.name,
        trackingNumber: formData.trackingNumber,
        company: formData.company,
        isDelivered: formData.isDelivered
      });
      
      setFormData({ name: '', trackingNumber: '', company: '', isDelivered: false });
      setShowAddModal(false);
      loadCargoList();
    } catch (error) {
      console.error('Error saving cargo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Bu kargo takibini silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteCargoTracking(user!.id, id);
      loadCargoList();
    } catch (error) {
      console.error('Error deleting cargo:', error);
    }
  };

  const handleTrack = (cargo: CargoTracking) => {
    const company = CARGO_COMPANIES[cargo.company];
    if (!company) return;

    const url = generateTrackingUrl(cargo.trackingNumber, company.url);
    
    if (company.type === 'popup') {
      window.open(url, '_blank', 'width=800,height=600');
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopyTrackingNumber = async (trackingNumber: string, cargoId: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedId(cargoId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const toggleDeliveryStatus = async (cargo: CargoTracking) => {
    if (!user) return;
    
    try {
      await updateCargoTracking(user!.id, cargo.id, {
        isDelivered: !cargo.isDelivered
      });
      loadCargoList();
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', trackingNumber: '', company: '', isDelivered: false });
  };

  const filteredCargos = cargoList.filter((cargo: CargoTracking) => {
    const matchesSearch = cargo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      CARGO_COMPANIES[cargo.company]?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'delivered' && cargo.isDelivered) ||
      (filterStatus === 'pending' && !cargo.isDelivered);
    
    return matchesSearch && matchesFilter;
  });

  const deliveredCargos = filteredCargos.filter((cargo: CargoTracking) => cargo.isDelivered);
  const pendingCargos = filteredCargos.filter((cargo: CargoTracking) => !cargo.isDelivered);

  const renderCargoCard = (cargo: CargoTracking) => {
    const company = CARGO_COMPANIES[cargo.company];
    
    if (viewMode === 'list') {
      return (
        <div
          key={cargo.id}
          className={`bg-white rounded-lg shadow-sm p-4 border transition-all duration-200 hover:shadow-md ${
            cargo.isDelivered 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="w-6 h-6 object-contain rounded flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Package className={`w-6 h-6 flex-shrink-0 ${company?.logo ? 'hidden' : ''} ${
                cargo.isDelivered ? 'text-green-600' : 'text-yellow-600'
              }`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {cargo.name}
                  </h3>
                  {cargo.isDelivered && (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    {cargo.trackingNumber}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{company?.name || cargo.company}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
              {cargo.isDelivered ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3" />
                  Teslim Edildi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3" />
                  Bekliyor
                </span>
              )}
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyTrackingNumber(cargo.trackingNumber, cargo.id)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Takip numarasını kopyala"
                >
                  {copiedId === cargo.id ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
                
                <button
                  onClick={() => handleTrack(cargo)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Takip et"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                <button
                  onClick={() => toggleDeliveryStatus(cargo)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    cargo.isDelivered
                      ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  }`}
                  title={cargo.isDelivered ? 'Teslim edilmedi olarak işaretle' : 'Teslim edildi olarak işaretle'}
                >
                  {cargo.isDelivered ? <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                </button>
                
                <button
                  onClick={() => handleDelete(cargo.id)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Grid view
    return (
      <div
        key={cargo.id}
        className={`bg-white rounded-xl shadow-sm p-6 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
          cargo.isDelivered
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center gap-3 mb-4">
            {company?.logo ? (
              <img 
                src={company.logo} 
                alt={company.name}
                className="w-16 h-16 object-contain rounded-lg border border-gray-200 p-2 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Package className={`w-16 h-16 ${company?.logo ? 'hidden' : ''} ${
              cargo.isDelivered ? 'text-green-600' : 'text-yellow-600'
            } p-3 border border-gray-200 rounded-lg bg-white`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {cargo.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {company?.name || cargo.company}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Takip No:</span>
          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-2 flex-1">
                <span className="truncate">{cargo.trackingNumber}</span>
                <button
                  onClick={() => handleCopyTrackingNumber(cargo.trackingNumber, cargo.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="Takip numarasını kopyala"
                >
                  {copiedId === cargo.id ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="text-sm text-gray-600">{company?.name || cargo.company}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm text-gray-600">Eklendi: {formatDate(cargo.createdAt.toISOString())}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {cargo.isDelivered ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                    Teslim Edildi
                    <CheckCircle className="w-4 h-4" />
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-600 font-medium text-sm">Teslim Bekleniyor</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleTrack(cargo)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex-1 justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Takip Et
            </button>
            
            <button
              onClick={() => toggleDeliveryStatus(cargo)}
              className={`p-2 rounded-lg transition-colors ${
                cargo.isDelivered
                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              title={cargo.isDelivered ? 'Teslim edilmedi olarak işaretle' : 'Teslim edildi olarak işaretle'}
            >
              {cargo.isDelivered ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => handleDelete(cargo.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="w-full px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Kargo Takip
          </h1>
          <p className="text-gray-600">
            Kargolarınızı takip edin ve durumlarını kontrol edin
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Kargo adı, takip numarası veya firma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'delivered' | 'pending')}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none min-w-[100px] w-[100px] sm:min-w-[140px] sm:w-auto"
                >
                  <option value="all">Tümü ({cargoList.length})</option>
                  <option value="pending">Bekleyen ({cargoList.filter((c: CargoTracking) => !c.isDelivered).length})</option>
                  <option value="delivered">Teslim Edilen ({cargoList.filter((c: CargoTracking) => c.isDelivered).length})</option>
                </select>
              </div>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 sm:px-6 py-3 transition-colors flex-1 flex items-center justify-center ${
                    viewMode === 'grid'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Kutu görünümü"
                >
                  <Grid className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 sm:px-6 py-3 transition-colors flex-1 flex items-center justify-center ${
                    viewMode === 'list'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Liste görünümü"
                >
                  <List className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="hidden sm:inline">Yeni Kargo Ekle</span>
                <span className="sm:hidden">Ekle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3 mb-6">
          {/* Toplam Kargo - Geniş */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{cargoList.length}</p>
                <p className="text-sm text-gray-600">Toplam Kargo</p>
              </div>
            </div>
          </div>
          
          {/* Bekleyen ve Teslim Edilen - Yan Yana */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCargos.length}</p>
                  <p className="text-sm text-gray-600">Bekleyen</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{deliveredCargos.length}</p>
                  <p className="text-sm text-gray-600">Teslim</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Lists */}
        {filteredCargos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Arama sonucu bulunamadı' : 'Henüz kargo eklenmemiş'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' ? 'Farklı anahtar kelimeler veya filtreler deneyin' : 'İlk kargonuzu ekleyerek başlayın'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Kargo Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Cargos */}
            {(filterStatus === 'all' || filterStatus === 'pending') && pendingCargos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Teslim Beklenen Kargolar ({pendingCargos.length})
                  </h2>
                </div>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
                }>
                  {pendingCargos.map(renderCargoCard)}
                </div>
              </div>
            )}

            {/* Delivered Cargos */}
            {(filterStatus === 'all' || filterStatus === 'delivered') && deliveredCargos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Teslim Edilen Kargolar ({deliveredCargos.length})
                  </h2>
                </div>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
                }>
                  {deliveredCargos.map(renderCargoCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Cargo Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Yeni Kargo Ekle
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kargo Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Örn: Amazon Siparişi"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Takip Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Takip numarasını girin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kargo Firması
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">Kargo firması seçin</option>
                    {Object.entries(CARGO_COMPANIES).map(([key, company]: [string, CargoCompany]) => (
                      <option key={key} value={key}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDelivered"
                    checked={formData.isDelivered}
                    onChange={(e) => setFormData({ ...formData, isDelivered: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                  />
                  <label htmlFor="isDelivered" className="text-sm text-gray-700">
                    Teslim edildi olarak işaretle
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};