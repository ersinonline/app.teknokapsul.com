import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, CreditCard } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getUserPoints } from '../../services/points.service';
import { getUserOrders, Order } from '../../services/order.service';

interface Product {
  id: string;
  urunAdi: string;
  aciklama: string;
  magazaFiyati: number;
  piyasaFiyati: number;
  kategori: string;
  resim1: string;
  stokAdedi: number;
  marka: string;
  stokKodu: string;
  barkod: string;
  agirlik: number;
  kdvOrani: number;
  magaza: string;
  paraBirimi: string;
  fiyat: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}



export const ShopRewardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(40);

  const [userPoints, setUserPoints] = useState({ totalPoints: 0, availablePoints: 0, usedPoints: 0 });
  const [pointsToUse, setPointsToUse] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);



  // Firebase'den ürünleri çek ve puan sistemi yükle
  useEffect(() => {
    const loadUserPoints = async () => {
      if (user) {
        try {
          const points = await getUserPoints(user.uid);
          setUserPoints(points);
        } catch (error) {
          console.error('Puanlar yüklenirken hata:', error);
        }
      }
    };

    const loadRecentOrders = async () => {
      if (user) {
        try {
          const orders = await getUserOrders(user.uid);
          // Son 3 siparişi al
          const sortedOrders = orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          }).slice(0, 3);
          setRecentOrders(sortedOrders);
        } catch (error) {
          console.error('Siparişler yüklenirken hata:', error);
        }
      }
    };

    fetchProducts();
    loadUserPoints();
    loadRecentOrders();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'shop');
      const q = query(productsRef, orderBy('urunAdi', 'asc'));
      const productsSnapshot = await getDocs(q);
      
      const productsData: Product[] = [];
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          ...data
        } as Product);
      });
      
      setProducts(productsData);
      console.log('✅ Ürünler yüklendi:', productsData.length);
    } catch (error) {
      console.error('❌ Ürünler yüklenirken hata:', error);
    }
  };

  // Kategoriler kaldırıldı

  // Sepete ürün ekleme
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Sepetten ürün çıkarma
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Ürün miktarını güncelleme
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };



  // Sipariş verme
  const placeOrder = () => {
    if (cart.length === 0) return;
    
    // CheckoutPage'e yönlendir
    navigate('/other/checkout', {
      state: {
        cart,
        cartTotal,
        pointsToUse
      }
    });
  };





  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.aciklama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Sayfalandırma hesaplamaları
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sepet toplamı
  const cartTotal = cart.reduce((total, item) => total + (item.product.magazaFiyati * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Harcadıkça Kazan</h1>
                <p className="text-sm text-gray-600">Alışveriş yap, puan kazan!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Arama */}
              <div className="relative flex-1 lg:flex-none">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{backgroundColor: 'transparent'}}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full lg:w-64"
                />
              </div>
              
              {/* Sepet */}
              <button
                onClick={() => setShowCart(true)}
                style={{backgroundColor: '#ffb700'}}
                className="relative p-2 text-white rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Ana İçerik */}
        <div className="space-y-8">
          {/* Son Verilen Siparişler */}
          {user && recentOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Son Verilen Siparişler</h2>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Tümünü Gör
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {recentOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">#{order.orderNumber}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'delivered' ? 'Teslim Edildi' :
                         order.status === 'shipped' ? 'Kargoda' :
                         order.status === 'processing' ? 'Hazırlanıyor' :
                         'Beklemede'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {order.items.length} ürün
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₺{order.grandTotal.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || 
                         new Date(order.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Tüm Ürünler */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Tüm Ürünler</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{filteredProducts.length} ürün</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {currentProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col items-center mb-4">
                        {product.resim1 ? (
                          <img 
                            src={product.resim1} 
                            alt={product.urunAdi}
                            className="w-32 h-32 object-cover rounded-lg mb-2"
                            onError={(e) => {
                               e.currentTarget.style.display = 'none';
                               (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                             }}
                          />
                        ) : null}
                        <div className="text-8xl mb-2" style={{display: product.resim1 ? 'none' : 'block'}}>📦</div>

                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 text-center">{product.urunAdi}</h3>
                      

                      
                      <div className="text-center mb-4">
                        <span className="text-sm text-gray-600">Stok: {product.stokAdedi} adet</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">₺{product.magazaFiyati.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stokAdedi <= 0}
                          style={{backgroundColor: product.stokAdedi > 0 ? '#ffb700' : undefined}}
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          {product.stokAdedi > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Sayfalandırma */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  
                  {(() => {
                    const getVisiblePages = () => {
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 1);
                      const endPage = Math.min(totalPages, startPage + 2);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      
                      return pages;
                    };
                    
                    return getVisiblePages().map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={currentPage === page ? {backgroundColor: '#ffb700'} : {}}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Sepet Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Sepetim</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Sepetiniz boş</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {item.product.resim1 ? (
                          <img 
                            src={item.product.resim1} 
                            alt={item.product.urunAdi}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                               e.currentTarget.style.display = 'none';
                               (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                             }}
                          />
                        ) : null}
                        <div className="text-2xl" style={{display: item.product.resim1 ? 'none' : 'block'}}>📦</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.urunAdi}</h4>
                          <p className="text-sm text-gray-600">₺{item.product.magazaFiyati.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Stok: {item.product.stokAdedi} adet</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-4 border-t">
                  {/* Puan Kullanma */}
                  {user && userPoints.availablePoints > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Puan Kullan (Mevcut: {userPoints.availablePoints} puan)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={Math.min(userPoints.availablePoints, Math.floor(cartTotal * 100))}
                            value={pointsToUse}
                            onChange={(e) => setPointsToUse(Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            placeholder="Kullanılacak puan"
                          />
                          <button
                            onClick={() => setPointsToUse(Math.min(userPoints.availablePoints, Math.floor(cartTotal * 100)))}
                            className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                          >
                            Tümünü Kullan
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          100 puan = 1₺ • Kullanılacak: {(pointsToUse * 0.01).toFixed(2)}₺
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ara Toplam:</span>
                      <span>₺{cartTotal.toFixed(2)}</span>
                    </div>
                    {pointsToUse > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>Puan İndirimi:</span>
                        <span>-₺{(pointsToUse * 0.01).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">Toplam:</span>
                      <span className="text-lg font-bold">₺{Math.max(0, cartTotal - (pointsToUse * 0.01)).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={placeOrder}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Sipariş Ver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ShopRewardsPage;