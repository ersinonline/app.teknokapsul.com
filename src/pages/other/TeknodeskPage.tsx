import React from 'react';
import { HelpCircle, Wrench, Settings, Users, MessageSquare, Clock } from 'lucide-react';

const TeknodeskPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-xl">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">TeknoDesk</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Teknik destek ve müşteri hizmetleri yönetim sistemi
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <Wrench className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Yakında Geliyor!</h2>
          <p className="text-xl text-gray-600 mb-8">
            TeknoDesk ile teknik destek süreçlerinizi profesyonelce yönetin
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Yönetimi</h3>
            <p className="text-gray-600 text-sm">
              Müşteri taleplerinizi organize edin ve takip edin
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ekip Yönetimi</h3>
            <p className="text-gray-600 text-sm">
              Destek ekibinizi koordine edin ve performansı izleyin
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Zaman Takibi</h3>
            <p className="text-gray-600 text-sm">
              Çözüm sürelerini ölçün ve raporlayın
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Otomasyon</h3>
            <p className="text-gray-600 text-sm">
              Rutin işlemleri otomatikleştirin
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bilgi Bankası</h3>
            <p className="text-gray-600 text-sm">
              Sık sorulan soruları ve çözümleri organize edin
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Canlı Destek</h3>
            <p className="text-gray-600 text-sm">
              Gerçek zamanlı müşteri desteği sağlayın
            </p>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Geliştirme Durumu</h3>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full" style={{width: '25%'}}></div>
              </div>
              <p className="text-gray-600 mb-6">
                TeknoDesk şu anda aktif geliştirme aşamasındadır. 
                Temel özellikler tamamlandığında sizlere duyurulacaktır.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Tamamlanan:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• UI/UX Tasarım</li>
                    <li>• Veritabanı Şeması</li>
                    <li>• Temel Mimari</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Geliştiriliyor:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Ticket Sistemi</li>
                    <li>• Kullanıcı Yönetimi</li>
                    <li>• API Entegrasyonları</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Sorularınız için: 
            <a href="mailto:info@teknokapsul.com" className="text-blue-600 hover:text-blue-800 font-medium">
              info@teknokapsul.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeknodeskPage;