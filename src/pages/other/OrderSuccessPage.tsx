import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderNumber, total, items } = location.state || {};

  if (!orderNumber) {
    navigate('/other/shop-rewards');
    return null;
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
                <span className="text-yellow-600 font-bold">{orderNumber}</span>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Sipariş Edilen Ürünler:</h4>
                <div className="space-y-2">
                  {items?.map((item: OrderItem, index: number) => (
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
                  <span className="text-yellow-600">{total?.toFixed(2)} ₺</span>
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