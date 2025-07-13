import React, { useState } from 'react';
import { ArrowLeft, MapPin, Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getShippingQuote, createShipment } from '../../../geliver';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder, OrderItem, ShippingAddress } from '../../services/order.service';
import { usePoints } from '../../services/points.service';

interface CartItem {
  product: {
    id: string;
    urunAdi: string;
    magazaFiyati: number;
    agirlik: number;
  };
  quantity: number;
}

interface ShippingOption {
  company: string;
  service: string;
  deliveryTime: string;
  totalAmount: number;
}

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, cartTotal, pointsToUse } = location.state || { cart: [], cartTotal: 0, pointsToUse: 0 };
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: ''
  });
  
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Adres, 2: Kargo, 3: Ödeme

  const getShippingQuotesForOrder = async () => {
    if (!shippingAddress.fullName || !shippingAddress.email || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.district) {
      alert('Lütfen kargo fiyatı almak için tüm zorunlu alanları doldurun! (İlçe alanı zorunludur)');
      return;
    }

    setLoadingQuotes(true);
    try {
      const quotes = await getShippingQuote({
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        address: shippingAddress.address,
        district: shippingAddress.district,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || '34000',
        items: cart.map((item: CartItem) => ({
          name: item.product.urunAdi,
          quantity: item.quantity
        }))
      });
      
      const formattedQuotes = quotes.map((quote: any) => ({
        company: quote.company,
        service: quote.service,
        deliveryTime: quote.deliveryTime,
        totalAmount: quote.price
      }));
      setShippingOptions(formattedQuotes);
      console.log('✅ Kargo fiyatları alındı:', quotes);
    } catch (error) {
      console.error('❌ Kargo fiyatı alınırken hata:', error);
      alert('Kargo fiyatı alınırken bir hata oluştu!');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const completeOrder = async () => {
    if (!user) {
      alert('Sipariş vermek için giriş yapmalısınız!');
      return;
    }
    
    if (!selectedShipping) {
      alert('Lütfen önce kargo seçeneğini seçin!');
      return;
    }

    setIsCompleting(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const pointsDiscount = pointsToUse * 0.01; // 100 puan = 1 TL
      const finalTotal = (cartTotal + selectedShipping.totalAmount) - pointsDiscount;

      // Firebase'e sipariş kaydet
      const orderItems: OrderItem[] = cart.map((item: CartItem) => ({
        id: item.product.id,
        name: item.product.urunAdi,
        quantity: item.quantity,
        price: item.product.magazaFiyati
      }));

      const orderAddress: ShippingAddress = {
        fullName: shippingAddress.fullName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        district: shippingAddress.district,
        postalCode: shippingAddress.postalCode
      };

      await createOrder(user.uid, {
        orderNumber,
        items: orderItems,
        total: cartTotal,
        shippingCost: selectedShipping.totalAmount,
        grandTotal: finalTotal,
        status: 'pending' as const,
        orderDate: new Date(),
        shippingAddress: orderAddress
      });

      // Geliver'a kargo oluştur
      await createShipment({
        receiverName: shippingAddress.fullName,
        receiverPhone: shippingAddress.phone,
        receiverEmail: shippingAddress.email,
        receiverAddress: shippingAddress.address,
        receiverDistrict: shippingAddress.district,
        receiverCity: shippingAddress.city,
        receiverPostalCode: shippingAddress.postalCode || '34000',
        packages: cart.map((item: CartItem) => ({
          weight: item.product.agirlik || 1,
          length: 20,
          width: 15,
          height: 10,
          quantity: item.quantity
        })),
        selectedOffer: {
          company: selectedShipping.company,
          service: selectedShipping.service,
          price: selectedShipping.totalAmount
        }
      });

      // Puanları kullan
      if (pointsToUse > 0) {
        await usePoints(user.uid, pointsToUse);
      }

      // Sipariş başarı sayfasına yönlendir
      navigate('/other/order-success', {
        state: {
          orderNumber,
          total: finalTotal,
          items: orderItems
        }
      });
    } catch (error) {
      console.error('❌ Sipariş oluşturulurken hata:', error);
      alert('Sipariş oluşturulurken bir hata oluştu!');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ödeme ve Teslimat</h1>
              <p className="text-sm text-gray-600">Sipariş bilgilerinizi tamamlayın</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Taraf - Formlar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teslimat Adresi */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Teslimat Adresi</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ad Soyad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="E-posta adresi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Telefon numarası"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Şehir"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                  <input
                    type="text"
                    value={shippingAddress.district}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="İlçe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Posta kodu"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                  <textarea
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Detaylı adres bilgisi"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (shippingAddress.fullName && shippingAddress.email && shippingAddress.phone && 
                      shippingAddress.city && shippingAddress.district && shippingAddress.address) {
                    getShippingQuotesForOrder();
                    setCurrentStep(2);
                  } else {
                    alert('Lütfen tüm zorunlu alanları doldurun!');
                  }
                }}
                disabled={loadingQuotes}
                style={{backgroundColor: '#ffb700'}}
                className="mt-4 w-full py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loadingQuotes ? 'Kargo Fiyatları Alınıyor...' : 'Devam Et'}
              </button>
            </div>

            {/* Kargo Seçenekleri */}
            {currentStep >= 2 && shippingOptions.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold">Kargo Seçenekleri</h2>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Adresi Düzenle
                  </button>
                </div>
                
                <div className="space-y-3">
                  {shippingOptions.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedShipping(option);
                        setCurrentStep(3);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping === option
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{option.company}</h3>
                          <p className="text-sm text-gray-600">{option.service}</p>
                          <p className="text-sm text-gray-500">{option.deliveryTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{option.totalAmount.toFixed(2)}₺</p>
                          <p className="text-xs text-gray-500">Seç ve devam et</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ Taraf - Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm border sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Sipariş Özeti</h2>
              
              <div className="space-y-3 mb-4">
                {cart.map((item: CartItem) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.urunAdi} x{item.quantity}</span>
                    <span>{(item.product.magazaFiyati * item.quantity).toFixed(2)}₺</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span>{cartTotal.toFixed(2)}₺</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Kargo:</span>
                  <span>{selectedShipping ? selectedShipping.totalAmount.toFixed(2) + '₺' : 'Seçilmedi'}</span>
                </div>
                
                {pointsToUse > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Puan İndirimi:</span>
                    <span>-{(pointsToUse * 0.01).toFixed(2)}₺</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Toplam:</span>
                    <span>
                      {selectedShipping 
                        ? Math.max(0, (cartTotal + selectedShipping.totalAmount) - (pointsToUse * 0.01)).toFixed(2)
                        : cartTotal.toFixed(2)
                      }₺
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={completeOrder}
                disabled={!selectedShipping || isCompleting}
                style={{backgroundColor: selectedShipping && !isCompleting ? '#ffb700' : undefined}}
                className="w-full mt-6 py-3 text-white rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isCompleting ? 'Sipariş Oluşturuluyor...' : 'Siparişi Tamamla'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;