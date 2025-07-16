import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Loader } from 'lucide-react';
import { verifyCheckoutSession } from '../../services/stripe.service';
import { createOrder, ShippingAddress } from '../../services/order.service';
import { createShipment } from '../../../geliver';
import { usePoints as usePointsFunction } from '../../services/points.service';
import { useAuth } from '../../contexts/AuthContext';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const OrderSuccessPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // Remove this line as usePoints is not a hook

  useEffect(() => {
    const processPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (sessionId) {
          // Stripe ödeme doğrulaması
          await verifyCheckoutSession(sessionId);
          
          // localStorage'dan sipariş bilgilerini al
          const pendingOrderData = localStorage.getItem('pendingOrder');
          if (!pendingOrderData) {
            throw new Error('Sipariş bilgileri bulunamadı');
          }
          
          const orderInfo = JSON.parse(pendingOrderData);
          const orderNumber = `ORD-${Date.now()}`;
          
          // Firebase'e sipariş kaydet
          const orderItems: OrderItem[] = orderInfo.cart.map((item: any) => ({
            id: item.product.id,
            name: item.product.urunAdi,
            quantity: item.quantity,
            price: item.product.magazaFiyati
          }));

          const orderAddress: ShippingAddress = {
            fullName: orderInfo.shippingAddress.fullName,
            email: orderInfo.shippingAddress.email,
            phone: orderInfo.shippingAddress.phone,
            address: orderInfo.shippingAddress.address,
            city: orderInfo.shippingAddress.city,
            district: orderInfo.shippingAddress.district,
            postalCode: orderInfo.shippingAddress.postalCode
          };

          await createOrder(user!.uid, {
            orderNumber,
            items: orderItems,
            total: orderInfo.cartTotal,
            shippingCost: orderInfo.selectedShipping.totalAmount,
            grandTotal: orderInfo.finalTotal,
            status: 'processing' as const,
            orderDate: new Date(),
            shippingAddress: orderAddress
          });

          // Geliver'a kargo oluştur
          await createShipment({
            receiverName: orderInfo.shippingAddress.fullName,
            receiverPhone: orderInfo.shippingAddress.phone,
            receiverEmail: orderInfo.shippingAddress.email,
            receiverAddress: orderInfo.shippingAddress.address,
            receiverDistrict: orderInfo.shippingAddress.district,
            receiverCity: orderInfo.shippingAddress.city,
            receiverPostalCode: orderInfo.shippingAddress.postalCode || '34000',
            packages: orderInfo.cart.map((item: any) => ({
              weight: item.product.agirlik || 1,
              length: 20,
              width: 15,
              height: 10,
              quantity: item.quantity
            })),
            selectedOffer: {
              company: orderInfo.selectedShipping.company,
              service: orderInfo.selectedShipping.service,
              price: orderInfo.selectedShipping.totalAmount
            }
          });

          // Puanları kullan
          if (orderInfo.pointsToUse > 0) {
            await usePointsFunction(user!.uid, orderInfo.pointsToUse);
          }

          // Sipariş bilgilerini state'e kaydet
          setOrderData({
            orderNumber,
            total: orderInfo.finalTotal,
            items: orderItems
          });
          
          // localStorage'ı temizle
          localStorage.removeItem('pendingOrder');
        } else {
          // URL'den gelen eski format (state ile)
          const { orderNumber, total, items } = location.state || {};
          if (orderNumber) {
            setOrderData({ orderNumber, total, items });
          } else {
            throw new Error('Sipariş bilgileri bulunamadı');
          }
        }
      } catch (error) {
        console.error('Ödeme işlemi hatası:', error);
        setError('Ödeme işlemi sırasında bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      processPayment();
    } else {
      navigate('/auth/login');
    }
  }, [user, searchParams, location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-600">Ödemeniz işleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h2>
          <p className="text-gray-600 mb-4">{error || 'Sipariş bilgileri bulunamadı.'}</p>
          <button
            onClick={() => navigate('/other/shop-rewards')}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            Alışverişe Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/other/shop-rewards')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sipariş Onayı</h1>
              <p className="text-sm text-gray-600">Siparişiniz başarıyla oluşturuldu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
          {/* Başarı İkonu */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Başarı Mesajı */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Siparişiniz Başarıyla Oluşturuldu!
          </h2>
          <p className="text-gray-600 mb-6">
            Siparişiniz alındı ve işleme konuldu. Kargo takip bilgileri e-posta adresinize gönderilecektir.
          </p>

          {/* Sipariş Bilgileri */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Sipariş Detayları</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Sipariş No:</span>
                <span className="text-yellow-600 font-bold">{orderData.orderNumber}</span>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Sipariş Edilen Ürünler:</h4>
                <div className="space-y-2">
                  {orderData.items?.map((item: OrderItem, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Toplam Tutar:</span>
                  <span className="text-yellow-600">{orderData.total?.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bilgilendirme */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              📧 Sipariş onay e-postası gönderildi<br/>
              📦 Kargo takip bilgileri e-posta ile bildirilecek<br/>
              ⏰ Tahmini teslimat süresi: 2-3 iş günü
            </p>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/other/shop-rewards')}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              Alışverişe Devam Et
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;