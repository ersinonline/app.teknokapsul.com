import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, Plus, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getShippingQuote } from '../../../geliver';
import { useAuth } from '../../contexts/AuthContext';
import { createPremiumCheckoutSession } from '../../services/stripe.service';
import { getSavedAddresses, saveAddress, SavedAddress } from '../../services/user.service';
import AddressAutocomplete from '../../components/AddressAutocomplete';

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
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<SavedAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  // Address saving is now automatic, no need for user confirmation
  
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Adres, 2: Kargo, 3: Ödeme

  // Kayıtlı adresleri yükle
  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    }
  }, [user]);

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    try {
      const addresses = await getSavedAddresses(user.uid);
      setSavedAddresses(addresses);
      
      // Default adresi otomatik seç
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress && !selectedSavedAddress) {
        setSelectedSavedAddress(defaultAddress);
        setShippingAddress({
          fullName: defaultAddress.fullName,
          email: defaultAddress.email,
          phone: defaultAddress.phone,
          address: defaultAddress.address,
          city: defaultAddress.city,
          district: defaultAddress.district,
          postalCode: defaultAddress.postalCode || ''
        });
      }
    } catch (error) {
      console.error('Kayıtlı adresler yüklenemedi:', error);
    }
  };

  const handleSavedAddressSelect = (address: SavedAddress) => {
    setSelectedSavedAddress(address);
    setShippingAddress({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode || ''
    });
    setShowAddressForm(false);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    
    try {
      await saveAddress(user.uid, {
        fullName: shippingAddress.fullName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        district: shippingAddress.district,
        postalCode: shippingAddress.postalCode,
        isDefault: savedAddresses.length === 0 // İlk adres ise default yap
      });
      
      // Kayıtlı adresleri yeniden yükle
      await loadSavedAddresses();
    } catch (error) {
      console.error('Adres kaydedilemedi:', error);
    }
  };

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

  const proceedToPayment = async () => {
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
      const pointsDiscount = pointsToUse * 0.01; // 100 puan = 1 TL
      const finalTotal = (cartTotal + selectedShipping.totalAmount) - pointsDiscount;
      const amountInCents = Math.round(finalTotal * 100); // Stripe için kuruş cinsinden

      // Sipariş bilgilerini localStorage'a kaydet (ödeme sonrası kullanmak için)
      const orderData = {
        cart,
        cartTotal,
        shippingAddress,
        selectedShipping,
        pointsToUse,
        finalTotal
      };
      localStorage.setItem('pendingOrder', JSON.stringify(orderData));

      // Stripe checkout session oluştur
      const session = await createPremiumCheckoutSession({
        userId: user.uid,
        productId: 'order_payment', // Sipariş ödemesi için özel product ID
        customerEmail: user.email || shippingAddress.email,
        amount: amountInCents,
        successUrl: `${window.location.origin}/other/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/other/checkout`
      });

      // Stripe ödeme sayfasına yönlendir
      window.location.href = session.url;
    } catch (error) {
      console.error('❌ Ödeme sayfasına yönlendirilirken hata:', error);
      alert('Ödeme sayfasına yönlendirilirken bir hata oluştu!');
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
              
              {/* Kayıtlı Adresler */}
              {user && savedAddresses.length > 0 && !showAddressForm && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-700">Kayıtlı Adreslerim</h3>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Adres Ekle
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => handleSavedAddressSelect(address)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSavedAddress?.id === address.id
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{address.fullName}</span>
                              {address.isDefault && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  Varsayılan
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {address.address}, {address.district}, {address.city}
                            </p>
                            <p className="text-xs text-gray-500">
                              {address.phone} • {address.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Yeni Adres Formu veya Adres Düzenleme */}
              {(showAddressForm || savedAddresses.length === 0 || selectedSavedAddress) && (
                <div>
                  {savedAddresses.length > 0 && showAddressForm && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-700">Yeni Adres Ekle</h3>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        ← Kayıtlı Adreslerime Dön
                      </button>
                    </div>
                  )}
                  
                  {selectedSavedAddress && !showAddressForm && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Seçili Adres</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {selectedSavedAddress.fullName} - {selectedSavedAddress.address}, {selectedSavedAddress.district}, {selectedSavedAddress.city}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedSavedAddress(null);
                          setShowAddressForm(true);
                        }}
                        className="text-xs text-green-600 hover:text-green-700 mt-1"
                      >
                        Farklı adres kullan
                      </button>
                    </div>
                  )}
              
                  {/* Adres Formu - sadece gerektiğinde göster */}
                  {(showAddressForm || savedAddresses.length === 0 || !selectedSavedAddress) && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres * (Google ile ara)</label>
                  <AddressAutocomplete
                    value={shippingAddress.address}
                    onChange={(value) => setShippingAddress(prev => ({ ...prev, address: value }))}
                    onAddressSelect={(addressData) => {
                      setShippingAddress(prev => ({
                        ...prev,
                        address: addressData.fullAddress,
                        city: addressData.city || prev.city,
                        district: addressData.district || prev.district,
                        postalCode: addressData.postalCode || prev.postalCode
                      }));
                    }}
                    placeholder="Adres aramaya başlayın..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Google haritalardan adres seçebilir veya manuel olarak yazabilirsiniz
                  </p>
                </div>
                  
                      {/* Adresler otomatik olarak kaydedilir */}
                      {user && !selectedSavedAddress && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            ℹ️ Bu adres otomatik olarak kaydedilecek ve gelecek siparişlerinizde kullanabileceksiniz.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={async () => {
                  if (shippingAddress.fullName && shippingAddress.email && shippingAddress.phone && 
                      shippingAddress.city && shippingAddress.district && shippingAddress.address) {
                    // Adresi otomatik kaydet (kullanıcıya sormadan)
                    if (user && !selectedSavedAddress) {
                      await handleSaveAddress();
                    }
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
                onClick={proceedToPayment}
                disabled={!selectedShipping || isCompleting}
                style={{backgroundColor: selectedShipping && !isCompleting ? '#ffb700' : undefined}}
                className="w-full mt-6 py-3 text-white rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isCompleting ? 'Ödeme Sayfasına Yönlendiriliyor...' : 'Ödemeye Geç'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;