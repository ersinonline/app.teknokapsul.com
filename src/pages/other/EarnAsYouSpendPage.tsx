import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Harcadıkça Kazan</h1>
              <p className="text-green-100">Alışverişlerinizden cashback kazanın!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{userStats.totalCashback.toLocaleString()} ₺</div>
                <p className="text-sm text-green-100">Toplam Kazanç</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{userStats.pendingCashback.toLocaleString()} ₺</div>
                <p className="text-sm text-green-100">Bekleyen Cashback</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Kategoriler */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Kategoriler</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* İstatistikler */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">İstatistikler</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Toplam İşlem</span>
                  <span className="font-semibold">{userStats.totalTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Favori Kategori</span>
                  <span className="font-semibold text-green-600">{userStats.favoriteCategory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ortalama Cashback</span>
                  <span className="font-semibold">{(userStats.totalCashback / userStats.totalTransactions).toFixed(1)} ₺</span>
                </div>
              </div>
            </div>

            {/* Son İşlemler */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Son İşlemler</h3>
              <div className="space-y-3">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{transaction.store}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{transaction.amount} ₺</span>
                      <span className="text-xs font-medium text-green-600">+{transaction.cashback} ₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="lg:col-span-3">
            {/* Öne Çıkan Teklifler */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Öne Çıkan Teklifler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cashbackOffers.filter(offer => offer.featured).map(offer => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">{offer.logo}</div>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          %{offer.cashbackRate} Cashback
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">{offer.store}</h3>
                      <p className="text-sm text-gray-600 mb-4">{truncateDescription(offer.description)}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Min. Harcama:</span>
                          <span className="font-medium">{offer.minSpend} ₺</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Max. Cashback:</span>
                          <span className="font-medium">{offer.maxCashback} ₺</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Geçerlilik:</span>
                          <span className="font-medium">{new Date(offer.validUntil).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      
                      <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Alışverişe Başla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tüm Teklifler */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Tüm Cashback Teklifleri</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{filteredOffers.length} teklif</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOffers.map(offer => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{offer.logo}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{offer.store}</h3>
                            <p className="text-sm text-gray-600">{offer.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">%{offer.cashbackRate}</div>
                          <p className="text-xs text-gray-500">cashback</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{truncateDescription(offer.description)}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium">{offer.minSpend} ₺</div>
                          <div className="text-xs text-gray-500">Min. Harcama</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium">{offer.maxCashback} ₺</div>
                          <div className="text-xs text-gray-500">Max. Cashback</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(offer.validUntil).toLocaleDateString('tr-TR')} tarihine kadar
                        </span>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          Başla
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