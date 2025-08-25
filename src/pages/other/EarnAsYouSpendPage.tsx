import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { createPremiumCheckoutSession } from '../../services/stripe.service';

interface CashbackOffer {
  id: string;
  store: string;
  logo: string;
  cashbackRate: number;
  category: string;
  description: string;
  minSpend: number;
  maxCashback: number;
  validUntil: string;
  featured: boolean;
}

interface Transaction {
  id: string;
  store: string;
  amount: number;
  cashback: number;
  date: string;
  status: 'pending' | 'approved' | 'paid';
}

interface UserStats {
  totalCashback: number;
  pendingCashback: number;
  totalTransactions: number;
  favoriteCategory: string;
}

const EarnAsYouSpendPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [userStats] = useState<UserStats>({
    totalCashback: 2450.75,
    pendingCashback: 125.50,
    totalTransactions: 48,
    favoriteCategory: 'Teknoloji'
  });

  const cashbackOffers: CashbackOffer[] = [
    {
      id: '1',
      store: 'TechnoMarket',
      logo: '💻',
      cashbackRate: 8,
      category: 'Teknoloji',
      description: 'Elektronik ürünlerde %8 cashback',
      minSpend: 500,
      maxCashback: 200,
      validUntil: '2024-12-31',
      featured: true
    },
    {
      id: '2',
      store: 'ModaPlus',
      logo: '👗',
      cashbackRate: 12,
      category: 'Moda',
      description: 'Giyim ve aksesuar alışverişlerinde %12 cashback',
      minSpend: 200,
      maxCashback: 150,
      validUntil: '2024-11-30',
      featured: true
    },
    {
      id: '3',
      store: 'YemekSepeti',
      logo: '🍕',
      cashbackRate: 5,
      category: 'Yemek',
      description: 'Online yemek siparişlerinde %5 cashback',
      minSpend: 50,
      maxCashback: 25,
      validUntil: '2024-12-15',
      featured: false
    },
    {
      id: '4',
      store: 'KitapDünyası',
      logo: '📚',
      cashbackRate: 15,
      category: 'Eğitim',
      description: 'Kitap ve eğitim materyallerinde %15 cashback',
      minSpend: 100,
      maxCashback: 75,
      validUntil: '2024-12-20',
      featured: false
    },
    {
      id: '5',
      store: 'SporMax',
      logo: '⚽',
      cashbackRate: 10,
      category: 'Spor',
      description: 'Spor malzemeleri ve fitness ekipmanlarında %10 cashback',
      minSpend: 300,
      maxCashback: 100,
      validUntil: '2024-11-25',
      featured: true
    },
    {
      id: '6',
      store: 'EvDekor',
      logo: '🏠',
      cashbackRate: 7,
      category: 'Ev & Yaşam',
      description: 'Ev dekorasyonu ve mobilya alışverişlerinde %7 cashback',
      minSpend: 400,
      maxCashback: 180,
      validUntil: '2024-12-10',
      featured: false
    }
  ];

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      store: 'TechnoMarket',
      amount: 1250,
      cashback: 100,
      date: '2024-01-15',
      status: 'approved'
    },
    {
      id: '2',
      store: 'ModaPlus',
      amount: 450,
      cashback: 54,
      date: '2024-01-12',
      status: 'pending'
    },
    {
      id: '3',
      store: 'YemekSepeti',
      amount: 85,
      cashback: 4.25,
      date: '2024-01-10',
      status: 'paid'
    }
  ];

  const categories = [
    { id: 'all', name: 'Tümü', icon: '🛍️' },
    { id: 'Teknoloji', name: 'Teknoloji', icon: '💻' },
    { id: 'Moda', name: 'Moda', icon: '👗' },
    { id: 'Yemek', name: 'Yemek', icon: '🍕' },
    { id: 'Eğitim', name: 'Eğitim', icon: '📚' },
    { id: 'Spor', name: 'Spor', icon: '⚽' },
    { id: 'Ev & Yaşam', name: 'Ev & Yaşam', icon: '🏠' }
  ];

  const filteredOffers = cashbackOffers.filter(offer => 
    selectedCategory === 'all' || offer.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'paid': return 'Ödendi';
      default: return 'Bilinmiyor';
    }
  };

  const truncateDescription = (description: string, maxLength: number = 50) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  const handleStartShopping = async (offer: CashbackOffer) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Sepet tutarını al (minimum harcama tutarı)
    const cartAmount = offer.minSpend * 100; // Convert to cents for Stripe

    setLoading(offer.id);
    try {
      // Stripe checkout session oluştur
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/other/earn-success?offer_id=${offer.id}`;
      const cancelUrl = `${baseUrl}/other/earn-as-you-spend`;

      // const session = await createPremiumCheckoutSession({
      //   productId: 'cashback_offer',
      //   userId: user.id,
      //   customerEmail: user.email || '',
      //   successUrl,
      //   cancelUrl,
      //   amount: cartAmount
      // });

      // Stripe checkout sayfasına yönlendir
      // if (session.url) {
      //   window.location.href = session.url;
      // }
    } catch (error) {
      console.error('Ödeme işlemi başlatılırken hata:', error);
      alert('Ödeme işlemi başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
        <div className="w-full px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
            <div className="w-full lg:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Harcadıkça Kazan</h1>
              <p className="text-yellow-900">Alışverişlerinizden cashback kazanın!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{userStats.totalCashback.toLocaleString()} ₺</div>
                <p className="text-xs sm:text-sm text-gray-700">Toplam Kazanç</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{userStats.pendingCashback.toLocaleString()} ₺</div>
                <p className="text-xs sm:text-sm text-gray-700">Bekleyen Cashback</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Kategoriler */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Kategoriler</h3>
              <div className="space-y-1 sm:space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 shadow-sm'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{category.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* İstatistikler */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">İstatistikler</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Toplam İşlem</span>
                  <span className="font-semibold text-sm sm:text-base">{userStats.totalTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Favori Kategori</span>
                  <span className="font-semibold text-yellow-600 text-sm sm:text-base">{userStats.favoriteCategory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Ortalama Cashback</span>
                  <span className="font-semibold text-sm sm:text-base">{(userStats.totalCashback / userStats.totalTransactions).toFixed(1)} ₺</span>
                </div>
              </div>
            </div>

            {/* Son İşlemler */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Son İşlemler</h3>
              <div className="space-y-2 sm:space-y-3">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium truncate">{transaction.store}</span>
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{transaction.amount} ₺</span>
                      <span className="text-xs font-medium text-yellow-600">+{transaction.cashback} ₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="lg:col-span-3">
            {/* Öne Çıkan Teklifler */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Öne Çıkan Teklifler</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cashbackOffers.filter(offer => offer.featured).map(offer => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="text-3xl sm:text-4xl">{offer.logo}</div>
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                          %{offer.cashbackRate} Cashback
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{offer.store}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{truncateDescription(offer.description, 40)}</p>
                      
                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Min. Harcama:</span>
                          <span className="font-medium">{offer.minSpend} ₺</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Max. Cashback:</span>
                          <span className="font-medium">{offer.maxCashback} ₺</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Geçerlilik:</span>
                          <span className="font-medium">{new Date(offer.validUntil).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleStartShopping(offer)}
                        disabled={loading === offer.id}
                        className="w-full py-2.5 sm:py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base shadow-sm"
                      >
                        {loading === offer.id ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                            Stripe ile Öde
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tüm Teklifler */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tüm Cashback Teklifleri</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{filteredOffers.length} teklif</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {filteredOffers.map(offer => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="text-2xl sm:text-3xl flex-shrink-0">{offer.logo}</div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{offer.store}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{offer.category}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold text-yellow-600">%{offer.cashbackRate}</div>
                          <p className="text-xs text-gray-500">cashback</p>
                        </div>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{truncateDescription(offer.description, 60)}</p>
                      
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{offer.minSpend} ₺</div>
                          <div className="text-xs text-gray-500">Min. Harcama</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{offer.maxCashback} ₺</div>
                          <div className="text-xs text-gray-500">Max. Cashback</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <span className="text-xs text-gray-500 order-2 sm:order-1">
                          {new Date(offer.validUntil).toLocaleDateString('tr-TR')} tarihine kadar
                        </span>
                        <button 
                          onClick={() => handleStartShopping(offer)}
                          disabled={loading === offer.id}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-medium shadow-sm order-1 sm:order-2"
                        >
                          {loading === offer.id ? (
                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3" />
                              Öde
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarnAsYouSpendPage;