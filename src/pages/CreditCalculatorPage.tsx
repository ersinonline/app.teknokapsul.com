import React, { useState } from 'react';
import { Building, Car, Home, Calculator, TrendingUp, PiggyBank, Plus } from 'lucide-react';

interface CreditBidResult {
  'bank-code': string;
  status: string;
  oran: string;
  tl: string;
  ay: string;
  url: string;
}



const CreditCalculatorPage: React.FC = () => {
  const [creditAmount, setCreditAmount] = useState<number>(10000);
  const [creditMonth, setCreditMonth] = useState<number>(12);
  const [creditType, setCreditType] = useState<string>('ihtiyac');
  const [creditBidResults, setCreditBidResults] = useState<CreditBidResult[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('ihtiyac');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
  const baseURL = 'https://api.collectapi.com/credit/';

  const formatBankName = (bankCode: string): string => {
    const bankMapping: { [key: string]: string } = {
      'ing-bank': 'ING Bank',
      'cepteteb': 'CEPTETEB',
      'teb': 'TEB',
      'garanti-bbva': 'Garanti BBVA',
      'isbank': 'İş Bankası',
      'akbank': 'Akbank',
      'qnb-finansbank': 'QNB Finansbank',
      'enparacom': 'Enpara.com',
      'burgan-bank': 'Burgan Bank',
      'aktif-bank': 'Aktif Bank',
      'halkbank': 'Halkbank',
      'hayat-finans': 'Hayat Finans',
      'vakifbank': 'Vakıfbank',
      'yapi-kredi': 'Yapı Kredi',
      'ziraat-bankasi': 'Ziraat Bankası',
      'albaraka-turk': 'Albaraka Türk',
      'denizbank': 'Denizbank',
      'fibabanka': 'Fibabanka',
      'odeabank': 'Odeabank',
      'sekerbank': 'Şekerbank',
      'turkiye-finans': 'Türkiye Finans',
      'kuveyt-turk': 'Kuveyt Türk',
      'ihtiyac-kredisi': 'İhtiyaç Kredisi',
      'konut-kredisi': 'Konut Kredisi',
      'tasit-kredisi': 'Taşıt Kredisi'
    };
    return bankMapping[bankCode] || bankCode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };



  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    return numAmount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' TL';
  };

  const sortByInterestRate = (results: CreditBidResult[]): CreditBidResult[] => {
    return results.sort((a, b) => {
      const rateA = parseFloat(a.oran.replace('%', '').replace(',', '.'));
      const rateB = parseFloat(b.oran.replace('%', '').replace(',', '.'));
      return rateA - rateB; // En düşük faiz oranından en yükseğe
    });
  };

  const getCreditBid = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}creditBid?data.price=${creditAmount}&data.month=${creditMonth}&data.query=${creditType}`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        const sortedResults = sortByInterestRate(data.result);
        setCreditBidResults(sortedResults);
        showNotification('success', 'Kredi teklifleri başarıyla getirildi!');
      } else {
        showNotification('error', 'Kredi teklifleri getirilemedi.');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-teal-600" />
            <h1 className="text-lg font-semibold text-gray-900">Kredi Hesaplama</h1>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Ekle</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}
        
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <br></br>
            <br></br>
            <h1 className="text-3xl font-bold text-gray-900">Kredi Karşılaştırma Platformu</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            En uygun kredi tekliflerini karşılaştırın, faiz oranlarını analiz edin ve size en uygun krediyi bulun.
          </p>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="grid w-full grid-cols-3 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('ihtiyac')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ihtiyac' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              İhtiyaç Kredisi
            </button>
            <button
              onClick={() => setActiveTab('konut')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'konut' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-4 h-4" />
              Konut Kredisi
            </button>
            <button
              onClick={() => setActiveTab('tasit')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tasit' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Car className="w-4 h-4" />
              Taşıt Kredisi
            </button>
          </div>

          {/* İhtiyaç Kredisi Tab */}
          {activeTab === 'ihtiyac' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">İhtiyaç Kredisi Hesaplama</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="creditAmount" className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                    <input
                      id="creditAmount"
                      type="number"
                      min="1000"
                      step="1000"
                      value={creditAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="creditMonth" className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                    <input
                      id="creditMonth"
                      type="number"
                      min="1"
                      max="60"
                      value={creditMonth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreditType('ihtiyac');
                    getCreditBid();
                  }}
                  disabled={loading}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{backgroundColor: '#ffb700'}}
                >
                  {loading ? 'Yükleniyor...' : 'İhtiyaç Kredisi Tekliflerini Getir'}
                </button>

                {creditBidResults.length > 0 && creditType === 'ihtiyac' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">İhtiyaç Kredisi Teklifleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditBidResults.map((result, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatBankName(result['bank-code'])}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {result.oran}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Kredi Türü:</span>
                              <span className="text-sm font-medium text-gray-900">{result.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Toplam Tutar:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(result.tl)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Aylık Taksit:</span>
                              <span className="text-sm font-medium" style={{color: '#ffb700'}}>{formatCurrency(result.ay)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Konut Kredisi Tab */}
          {activeTab === 'konut' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Konut Kredisi Hesaplama</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="konutCreditAmount" className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                    <input
                      id="konutCreditAmount"
                      type="number"
                      min="50000"
                      step="10000"
                      value={creditAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="konutCreditMonth" className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                    <input
                      id="konutCreditMonth"
                      type="number"
                      min="12"
                      max="240"
                      value={creditMonth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreditType('konut');
                    getCreditBid();
                  }}
                  disabled={loading}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
                  style={{backgroundColor: '#ffb700'}}
                >
                  {loading ? 'Yükleniyor...' : 'Konut Kredisi Tekliflerini Getir'}
                </button>

                {creditBidResults.length > 0 && creditType === 'konut' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Konut Kredisi Teklifleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditBidResults.map((result, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatBankName(result['bank-code'])}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {result.oran}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Kredi Türü:</span>
                              <span className="text-sm font-medium text-gray-900">{result.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Toplam Tutar:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(result.tl)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Aylık Taksit:</span>
                              <span className="text-sm font-medium text-blue-600">{formatCurrency(result.ay)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Taşıt Kredisi Tab */}
          {activeTab === 'tasit' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Taşıt Kredisi Hesaplama</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="tasitCreditAmount" className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                    <input
                      id="tasitCreditAmount"
                      type="number"
                      min="10000"
                      step="5000"
                      value={creditAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="tasitCreditMonth" className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                    <input
                      id="tasitCreditMonth"
                      type="number"
                      min="6"
                      max="72"
                      value={creditMonth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreditType('tasit');
                    getCreditBid();
                  }}
                  disabled={loading}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
                  style={{backgroundColor: '#ffb700'}}
                >
                  {loading ? 'Yükleniyor...' : 'Taşıt Kredisi Tekliflerini Getir'}
                </button>

                {creditBidResults.length > 0 && creditType === 'tasit' && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Taşıt Kredisi Teklifleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {creditBidResults.map((result, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatBankName(result['bank-code'])}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {result.oran}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Kredi Türü:</span>
                              <span className="text-sm font-medium text-gray-900">{result.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Toplam Tutar:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(result.tl)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Aylık Taksit:</span>
                              <span className="text-sm font-medium text-blue-600">{formatCurrency(result.ay)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-sm border mt-8">
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Gelişmiş Kredi Karşılaştırma Platformu
              </h2>
              <p className="text-gray-600 mb-6 max-w-4xl mx-auto">
                Kredi Karşılaştırma Platformumuz, çeşitli bankaların kredi tekliflerini kolayca karşılaştırmanıza, 
                analiz etmenize ve size en uygun krediyi bulmanıza olanak tanıyan güçlü bir web tabanlı araçtır.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Anlık Karşılaştırma</h3>
                  <p className="text-sm text-gray-600">
                    Farklı bankalardan yüzlerce kredi teklifini anında karşılaştırın
                  </p>
                </div>
                
                <div className="text-center">
                  <Calculator className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Detaylı Analiz</h3>
                  <p className="text-sm text-gray-600">
                    Toplam geri ödeme tutarı ve aylık taksitleri hesaplayın
                  </p>
                </div>
                
                <div className="text-center">
                  <Building className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Çoklu Kredi Türü</h3>
                  <p className="text-sm text-gray-600">
                    İhtiyaç, konut ve taşıt kredilerini tek platformda
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCalculatorPage;