import React, { useState, useEffect } from 'react';
import { Crown, Users, Calendar, Trash2, Search, Filter } from 'lucide-react';
import { 
  getAllPremiumSubscriptions, 
  updateSubscriptionStatus, 
  extendUserSubscription 
} from '../services/premium.service';
import { PremiumSubscription } from '../types/premium';

interface PremiumSubscriptionWithUser extends PremiumSubscription {
  userEmail?: string;
  userName?: string;
}

const AdminPremiumPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PremiumSubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<PremiumSubscriptionWithUser | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await getAllPremiumSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('Abonelikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (subscriptionId: string, newStatus: 'active' | 'cancelled') => {
    try {
      await updateSubscriptionStatus(subscriptionId, newStatus);
      await loadSubscriptions();
      setSuccess(`Abonelik durumu ${newStatus === 'active' ? 'aktif' : 'iptal'} olarak güncellendi.`);
    } catch (error: any) {
      setError(error.message || 'Durum güncellenirken bir hata oluştu.');
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await extendUserSubscription(selectedSubscription.id, extendDays);
      await loadSubscriptions();
      setSuccess(`Abonelik ${extendDays} gün uzatıldı.`);
      setShowExtendModal(false);
      setSelectedSubscription(null);
      setExtendDays(30);
    } catch (error: any) {
      setError(error.message || 'Abonelik uzatılırken bir hata oluştu.');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      sub.status === statusFilter ||
      (statusFilter === 'expired' && new Date(sub.endDate) < new Date());

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (subscription: PremiumSubscriptionWithUser) => {
    const isExpired = new Date(subscription.endDate) < new Date();
    
    if (isExpired) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Süresi Dolmuş
        </span>
      );
    }

    if (subscription.status === 'active') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Aktif
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
        İptal Edilmiş
      </span>
    );
  };

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Premium Abonelik Yönetimi
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Kullanıcı premium aboneliklerini yönetin ve kontrol edin.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {subscriptions.length}
                </div>
                <div className="text-sm text-gray-500">Toplam Abonelik</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter(s => s.status === 'active' && new Date(s.endDate) > new Date()).length}
                </div>
                <div className="text-sm text-gray-500">Aktif Abonelik</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter(s => new Date(s.endDate) < new Date()).length}
                </div>
                <div className="text-sm text-gray-500">Süresi Dolmuş</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-gray-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter(s => s.status === 'cancelled').length}
                </div>
                <div className="text-sm text-gray-500">İptal Edilmiş</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="E-posta, isim veya ID ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="cancelled">İptal Edilmiş</option>
                <option value="expired">Süresi Dolmuş</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Abonelikler yükleniyor...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Abonelik bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Başlangıç
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Bitiş
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kalan Gün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => {
                    const daysRemaining = getDaysRemaining(subscription.endDate);
                    return (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.userName || 'Bilinmiyor'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subscription.userEmail || subscription.userId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {subscription.planId === 'monthly' ? 'Aylık Premium' : subscription.planId}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₺{subscription.totalAmount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(subscription)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(subscription.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(subscription.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            daysRemaining > 7 
                              ? 'text-green-600'
                              : daysRemaining > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {daysRemaining > 0 ? `${daysRemaining} gün` : 'Süresi dolmuş'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {subscription.status === 'active' ? (
                              <button
                                onClick={() => handleStatusUpdate(subscription.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                İptal Et
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusUpdate(subscription.id, 'active')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Aktifleştir
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowExtendModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Uzat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Extend Subscription Modal */}
      {showExtendModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Abonelik Uzat
              </h3>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>{selectedSubscription.userName || selectedSubscription.userEmail}</strong> kullanıcısının aboneliğini uzatın.
              </p>
              <p className="text-sm text-gray-500">
                Mevcut bitiş tarihi: {formatDate(selectedSubscription.endDate)}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uzatılacak Gün Sayısı
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedSubscription(null);
                  setExtendDays(30);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleExtendSubscription}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Uzat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPremiumPage;