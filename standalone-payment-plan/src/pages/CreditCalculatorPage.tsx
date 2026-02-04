import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Check, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../utils';

type CreditQuery = 'konut' | 'tasit' | 'ihtiyac';

type CreditOffer = {
  bankCode: string;
  bankName: string;
  interestRate: string;
  monthlyPayment: number;
  totalPayment: number;
};

const formatBankNameFromCode = (bankCode: string): string => {
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
    'kuveyt-turk': 'Kuveyt Türk'
  };
  const normalized = (bankCode || '').replace(/[^a-zA-Z0-9-]/g, '').trim();
  if (!normalized) return 'Banka';
  return bankMapping[normalized] || normalized.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const sortOffersByInterestRate = (offers: any[]): any[] => {
  return [...offers].sort((a, b) => {
    const aRate = parseFloat(String(a.oran || '').replace('%', '').replace(',', '.')) || 999;
    const bRate = parseFloat(String(b.oran || '').replace('%', '').replace(',', '.')) || 999;
    return aRate - bRate;
  });
};

const parseMoney = (value: string): number => {
  return Math.round(parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0);
};

const fetchCreditOffers = async (query: CreditQuery, amount: number, term: number): Promise<CreditOffer[]> => {
  const apiKey = import.meta.env.VITE_COLLECTAPI_KEY;
  if (!apiKey) {
    console.error('API key missing');
    return [];
  }

  try {
    const response = await fetch(`https://api.collectapi.com/credit/${query}?data.query=${encodeURIComponent(query)}&data.price=${encodeURIComponent(String(amount))}&data.month=${encodeURIComponent(String(term))}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `apikey ${apiKey}`
      }
    });

    const data = await response.json();
    if (!data?.success || !Array.isArray(data?.result)) return [];

    const sorted = sortOffersByInterestRate(data.result);
    return sorted.map((offer: any) => {
      const bankCode = String(offer['bank-code'] || '');
      return {
        bankCode,
        bankName: formatBankNameFromCode(bankCode),
        interestRate: String(offer.oran || ''),
        monthlyPayment: parseMoney(offer.ay),
        totalPayment: parseMoney(offer.tl)
      };
    });
  } catch (err) {
    console.error('Fetch error:', err);
    return [];
  }
};

const CreditCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState<CreditQuery>('konut');
  const [amount, setAmount] = useState<number>(0);
  const [term, setTerm] = useState<number>(query === 'tasit' ? 36 : query === 'ihtiyac' ? 12 : 120);
  const [offers, setOffers] = useState<CreditOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedOffer = useMemo(() => {
    if (!selectedKey) return null;
    return offers.find(o => `${o.bankCode}-${o.interestRate}` === selectedKey) || null;
  }, [offers, selectedKey]);

  const load = async () => {
    if (!amount || amount <= 0 || !term || term <= 0) return;
    setIsLoading(true);
    setOffers([]);
    setSelectedKey(null);
    try {
      const result = await fetchCreditOffers(query, amount, term);
      setOffers(result);
      if (result.length === 0) alert('Teklif bulunamadı. Lütfen tutar/vade değerlerini kontrol edin.');
    } catch {
      alert('Kredi teklifleri alınırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/new')} className="bg-[#ffb700] text-white px-4 py-2 rounded-xl hover:bg-[#e6a500] flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Ödeme Planı Oluştur
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#ffb700]/15 text-[#a06a00] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kredi Hesaplama</h1>
              <div className="text-sm text-gray-600">Konut, taşıt veya ihtiyaç kredisi tekliflerini listeleyin.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Türü</label>
              <select
                value={query}
                onChange={(e) => {
                  const next = e.target.value as CreditQuery;
                  setQuery(next);
                  setTerm(next === 'tasit' ? 36 : next === 'ihtiyac' ? 12 : 120);
                  setOffers([]);
                  setSelectedKey(null);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              >
                <option value="konut">Konut</option>
                <option value="tasit">Taşıt</option>
                <option value="ihtiyac">İhtiyaç</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
              <input
                type="number"
                inputMode="numeric"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
              <input
                type="number"
                inputMode="numeric"
                value={term || ''}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={load}
            disabled={isLoading || amount <= 0 || term <= 0}
            className="mt-4 w-full bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Hesaplanıyor...' : 'Teklifleri Getir'}
          </button>

          {selectedOffer && (
            <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-emerald-800 font-semibold">Seçili Teklif</div>
                  <div className="text-lg font-bold text-gray-900 truncate mt-1">{selectedOffer.bankName}</div>
                  <div className="text-xs text-gray-700 mt-1">Faiz: {selectedOffer.interestRate} • Vade: {term} ay</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-gray-600">Aylık</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedOffer.monthlyPayment)}</div>
                  <div className="text-xs text-gray-600 mt-1">{formatCurrency(selectedOffer.totalPayment)} toplam</div>
                </div>
              </div>
            </div>
          )}

          {offers.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-gray-900 mb-3">Kredi Teklifleri</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {offers.map((offer) => {
                  const key = `${offer.bankCode}-${offer.interestRate}`;
                  const selected = key === selectedKey;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedKey(key)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selected ? 'border-emerald-300 bg-emerald-50' : 'hover:border-[#ffb700] hover:bg-[#fffbeb]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {selected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            <div className="font-semibold text-gray-900 truncate">{offer.bankName}</div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Faiz: {offer.interestRate} • Vade: {term} ay</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(offer.monthlyPayment)}/ay</div>
                          <div className="text-xs text-gray-600">{formatCurrency(offer.totalPayment)} toplam</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCalculatorPage;
