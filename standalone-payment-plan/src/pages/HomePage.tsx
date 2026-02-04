import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, CheckCircle2, FilePlus2, ShieldCheck, Share2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [planId, setPlanId] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-[#ffb700]/10 via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-xs font-semibold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Plan ID ile paylaşılabilir
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                Ödeme planını netleştir,
                <span className="text-[#a06a00]"> en doğru krediyi</span> seç
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-xl">
                Konut, taşıt ve ihtiyaç kredisi tekliflerini karşılaştır; peşinat, ek masraflar ve gelir/taksit uygunluğuyla
                ödeme planını oluştur.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                <div className="bg-white border rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Share2 className="w-4 h-4 text-[#a06a00]" />
                    Paylaşım
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Kolay Paylaşım</div>
                </div>
                <div className="bg-white border rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Calculator className="w-4 h-4 text-[#a06a00]" />
                    Hesaplama
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Teklifleri listele</div>
                </div>
                <div className="bg-white border rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <ShieldCheck className="w-4 h-4 text-[#a06a00]" />
                    Netlik
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Detaylı özet</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/new')}
                  className="w-full bg-[#ffb700] text-white px-4 py-4 rounded-2xl hover:bg-[#e6a500] active:bg-[#d49400] transition-colors flex items-center justify-center"
                >
                  <FilePlus2 className="w-5 h-5 mr-2" />
                  Ödeme Planı Oluştur
                </button>
                <button
                  onClick={() => navigate('/credit')}
                  className="w-full bg-gray-900 text-white px-4 py-4 rounded-2xl hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Kredi Hesapla
                </button>
              </div>

              <div className="my-6 border-t" />

              <div className="text-sm font-semibold text-gray-900">Plan ID ile görüntüle</div>
              <div className="text-xs text-gray-600 mt-1">Birisi sana Plan ID gönderdi mi? Buradan aç.</div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder="Örn: TK123456"
                />
                <button
                  onClick={() => planId.trim() && navigate(`/plan/${planId.trim()}`)}
                  disabled={!planId.trim()}
                  className="bg-gray-900 text-white px-4 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl border p-4">
                  <div className="text-xs text-gray-600">1) Kredi teklifi seç</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">En uygun bankayı bul</div>
                </div>
                <div className="bg-gray-50 rounded-2xl border p-4">
                  <div className="text-xs text-gray-600">2) Planı oluştur</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">Gelir/taksit uyumu</div>
                </div>
                <div className="bg-gray-50 rounded-2xl border p-4">
                  <div className="text-xs text-gray-600">3) Paylaş</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">Plan ID ile erişim</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-gray-500">
            <a href="https://teknotech.info" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
              TeknoTech
            </a>{' '}
            • Ödeme Planı ve Kredi Karşılaştırma
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
