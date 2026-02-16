import React, { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Package, CheckCircle, Search, Tag, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getActiveDigitalCodes, createDigitalOrder, getUserDigitalOrders, DigitalCode, DigitalOrder } from '../../services/digitalCode.service';
import { simulatePayment } from '../../services/iyzico.service';

const EarnAsYouSpendPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DigitalCode[]>([]);
  const [orders, setOrders] = useState<DigitalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ productName: string; price: number; paymentId: string } | null>(null);

  useEffect(() => {
    loadProducts();
    if (user) loadOrders();
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getActiveDigitalCodes();
      setProducts(data);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    try {
      const data = await getUserDigitalOrders(user.uid);
      setOrders(data);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    }
  };

  const handleBuyNow = async (product: DigitalCode) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBuyingId(product.id!);
    try {
      // İyzico ile ödeme (şimdilik simüle)
      const result = await simulatePayment(user.uid, product.id!, product.name, product.price);

      if (result.success) {
        // Sipariş oluştur
        await createDigitalOrder({
          userId: user.uid,
          productId: product.id!,
          productName: product.name,
          productCategory: product.category,
          price: product.price,
          status: 'completed',
          paymentId: result.paymentId,
          paymentMethod: 'iyzico'
        });

        setLastOrder({ productName: product.name, price: product.price, paymentId: result.paymentId });
        setShowSuccessModal(true);
        await loadOrders();
      }
    } catch (error) {
      console.error('Satın alma hatası:', error);
      alert('Ödeme işlemi sırasında bir hata oluştu.');
    } finally {
      setBuyingId(null);
    }
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Beklemede';
      case 'failed': return 'Başarısız';
      case 'refunded': return 'İade Edildi';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dijital Kodlar</h1>
              <p className="text-white/60 text-xs">Anında dijital ürün satın alın</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{products.length}</p>
              <p className="text-white/50 text-[10px]">Ürün</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{orders.length}</p>
              <p className="text-white/50 text-[10px]">Siparişim</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
        {/* Tabs */}
        <div className="bank-card p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'products' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Ürünler
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Siparişlerim ({orders.length})
            </button>
          </div>
        </div>

        {activeTab === 'products' ? (
          <>
            {/* Search */}
            <div className="bank-card p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat === 'all' ? 'Tümü' : cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bank-card p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'Aramanızla eşleşen ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bank-card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="text-[10px] text-primary font-medium uppercase tracking-wide">{product.category}</span>
                          </div>
                          <h3 className="font-semibold text-foreground text-sm leading-tight">{product.name}</h3>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-lg font-bold text-primary">{product.price.toLocaleString('tr-TR')} ₺</p>
                          {product.stock > 0 && (
                            <p className="text-[10px] text-green-600">Stokta: {product.stock}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyNow(product)}
                        disabled={buyingId === product.id || product.stock <= 0}
                        className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {buyingId === product.id ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                            Ödeme yapılıyor...
                          </>
                        ) : product.stock <= 0 ? (
                          'Stokta Yok'
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            Hemen Satın Al
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Orders Tab */
          <>
            {orders.length === 0 ? (
              <div className="bank-card p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">Henüz siparişiniz yok.</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-medium"
                >
                  Ürünlere Göz At
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bank-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm">{order.productName}</h4>
                        <p className="text-xs text-muted-foreground">{order.productCategory}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {order.createdAt?.seconds
                          ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Tarih yok'}
                      </span>
                      <span className="font-bold text-foreground">{order.price.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    {order.code && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-[10px] text-green-600 font-medium mb-0.5">Dijital Kodunuz:</p>
                        <p className="text-sm font-mono font-bold text-green-800 select-all">{order.code}</p>
                      </div>
                    )}
                    {order.paymentId && (
                      <p className="text-[10px] text-muted-foreground mt-1">Ödeme ID: {order.paymentId}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Satın Alma Başarılı!</h3>
            <p className="text-sm text-muted-foreground mb-1">{lastOrder.productName}</p>
            <p className="text-xl font-bold text-primary mb-4">{lastOrder.price.toLocaleString('tr-TR')} ₺</p>
            <p className="text-xs text-muted-foreground mb-4">Ödeme ID: {lastOrder.paymentId}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSuccessModal(false); setActiveTab('orders'); }}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
              >
                Siparişlerime Git
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarnAsYouSpendPage;