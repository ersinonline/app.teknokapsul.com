import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Calendar, DollarSign, Percent, Home, Car, CreditCard, Building2 } from 'lucide-react';

interface LoanCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  monthlyCostRate: number;
  annualCostRate: number;
}

const LoanCalculator: React.FC = () => {
  const [calculationMode, setCalculationMode] = useState<'rate' | 'bank'>('rate');
  const [loanType, setLoanType] = useState('Konut Kredisi');
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [termMonths, setTermMonths] = useState(0);

  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  // Banka teklifleri - Kredi türüne göre oranlar
  const getBankOffers = () => {
    if (loanType === 'Konut Kredisi') {
      return [
        { name: 'Akbank', rate: 2.99, logo: 'https://1000logos.net/wp-content/uploads/2021/06/Akbank-icon.png' },
        { name: 'Kuveyt Türk', rate: 2.99, logo: 'https://www.kuveytturk.com.tr/favicon.ico' },
        { name: 'Yapı Kredi', rate: 3.05, logo: 'https://www.yapikredi.com.tr/favicon.ico' },
        { name: 'İş Bankası', rate: 3.10, logo: 'https://www.ismer.com.tr/images/leftImages/is-bankasi.png' },
        { name: 'Vakıf Katılım', rate: 3.10, logo: 'https://www.vakifkatilim.com.tr/favicon.ico' },
        { name: 'Garanti BBVA', rate: 3.10, logo: 'https://www.garantibbva.com.tr/favicon.ico' },
        { name: 'Türkiye Finans', rate: 3.59, logo: 'https://www.turkiyefinans.com.tr/favicon.ico' },
        { name: 'ING', rate: 3.74, logo: 'https://www.ing.com.tr/favicon.ico' }
      ];
    } else if (loanType === 'Taşıt Kredisi') {
      return [
        { name: 'Akbank', rate: 3.25, logo: 'https://1000logos.net/wp-content/uploads/2021/06/Akbank-icon.png' },
        { name: 'Kuveyt Türk', rate: 3.20, logo: 'https://www.kuveytturk.com.tr/favicon.ico' },
        { name: 'Dünya Katılım', rate: 3.45, logo: 'https://www.dunyakatilim.com.tr/favicon.ico' },
        { name: 'Vakıf Katılım', rate: 3.65, logo: 'https://www.vakifkatilim.com.tr/favicon.ico' },
        { name: 'Garanti BBVA', rate: 3.79, logo: 'https://www.garantibbva.com.tr/favicon.ico' },
        { name: 'İş Bankası', rate: 3.90, logo: 'https://www.ismer.com.tr/images/leftImages/is-bankasi.png' },
        { name: 'Türkiye Finans', rate: 3.99, logo: 'https://www.turkiyefinans.com.tr/favicon.ico' },
        { name: 'Alternatif Bank', rate: 3.79, logo: 'https://www.alternatifbank.com.tr/favicon.ico' },
        { name: 'Şekerbank', rate: 4.00, logo: 'https://www.sekerbank.com.tr/favicon.ico' },
        { name: 'Ziraat Katılım', rate: 4.29, logo: 'https://www.ziraatkatilim.com.tr/favicon.ico' },
        { name: 'Ziraat Bankası', rate: 4.79, logo: 'https://www.ziraatbank.com.tr/favicon.ico' },
        { name: 'Halkbank', rate: 5.15, logo: 'https://www.halkbank.com.tr/favicon.ico' },
        { name: 'Anadolubank', rate: 5.30, logo: 'https://www.anadolubank.com.tr/favicon.ico' },
        { name: 'ALJ Finans', rate: 5.69, logo: 'https://www.aljfinans.com.tr/favicon.ico' },
        { name: 'ICBC Bank Turkey', rate: 6.00, logo: 'https://www.icbc.com.tr/favicon.ico' }
      ];
    } else {
      return [
        { name: 'Alternatif Bank Dijital İhtiyaç Kredisi', rate: 3.59, logo: 'https://www.alternatifbank.com.tr/favicon.ico' },
        { name: 'DenizBank İhtiyaç Kredisi', rate: 3.68, logo: 'https://www.denizbank.com/favicon.ico' },
        { name: 'Enpara.com İhtiyaç Kredisi', rate: 3.84, logo: 'https://www.enpara.com/favicon.ico' },
        { name: 'getirfinans İhtiyaç Kredisi', rate: 3.95, logo: 'https://www.getirfinans.com/favicon.ico' },
        { name: 'Türkiye Finans 3 Ay Ertelemeli Finansman', rate: 4.00, logo: 'https://www.turkiyefinans.com.tr/favicon.ico' },
        { name: 'İş Bankası İhtiyaç Kredisi', rate: 4.10, logo: 'https://www.ismer.com.tr/images/leftImages/is-bankasi.png' },
        { name: 'Garanti BBVA İhtiyaç Kredisi', rate: 4.24, logo: 'https://www.garantibbva.com.tr/favicon.ico' },
        { name: 'Akbank İhtiyaç Kredisi', rate: 4.28, logo: 'https://1000logos.net/wp-content/uploads/2021/06/Akbank-icon.png' },
        { name: 'N Kolay İhtiyaç Kredisi', rate: 4.49, logo: 'https://www.nkolay.com.tr/favicon.ico' },
        { name: 'Ziraat Katılım İhtiyaç Finansmanı', rate: 4.49, logo: 'https://www.ziraatkatilim.com.tr/favicon.ico' },
        { name: 'ICBC Bank Hesaplı Kredi', rate: 4.58, logo: 'https://www.icbc.com.tr/favicon.ico' },
        { name: 'Fibabanka İhtiyaç Kredisi', rate: 4.95, logo: 'https://www.fibabanka.com.tr/favicon.ico' },
        { name: 'Ziraat Bankası Tüketici Kredisi', rate: 4.99, logo: 'https://www.ziraatbank.com.tr/favicon.ico' },
        { name: 'Halkbank Hızlı Kredi', rate: 5.25, logo: 'https://www.halkbank.com.tr/favicon.ico' },
        { name: 'HSBC İhtiyaç Kredisi', rate: 5.49, logo: 'https://www.hsbc.com.tr/favicon.ico' }
      ];
    }
  };

  const loanTypes = [
    { value: 'Konut Kredisi', label: 'Konut Kredisi', icon: Home },
    { value: 'Taşıt Kredisi', label: 'Taşıt Kredisi', icon: Car },
    { value: 'İhtiyaç Kredisi', label: 'İhtiyaç Kredisi', icon: CreditCard }
  ];

  const calculateLoan = () => {
    if (calculationMode === 'rate') {
      if (loanAmount <= 0 || interestRate <= 0 || termMonths <= 0) {
        setCalculation(null);
        return;
      }

      // Convert monthly interest rate from percentage to decimal
      const monthlyRate = interestRate / 100;
      
      // Calculate monthly payment using the formula provided by user:
      // Kredi Tutarı * [Faiz Oranı * (1+Faiz Oranı)^Taksit Sayısı / (1+Faiz Oranı)^Taksit Sayısı - 1]
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
      const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
      const calculatedMonthlyPayment = loanAmount * (numerator / denominator);
      
      const totalPayment = calculatedMonthlyPayment * termMonths;
      const totalInterest = totalPayment - loanAmount;
      
      // Monthly cost rate is the monthly interest rate
      const monthlyCostRate = monthlyRate * 100;
      
      // Annual cost rate calculation based on monthly rate
      const annualCostRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

      setCalculation({
        monthlyPayment: calculatedMonthlyPayment,
        totalPayment,
        totalInterest,
        monthlyCostRate,
        annualCostRate
      });

    } else {
      setCalculation(null);
    }
  };

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, interestRate, termMonths, calculationMode]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `%${rate.toFixed(4)}`;
  };

  const calculateBankOffer = (bankRate: number) => {
    if (loanAmount <= 0 || termMonths <= 0) return null;
    
    const monthlyRate = bankRate / 100;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
    const monthlyPayment = loanAmount * (numerator / denominator);
    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - loanAmount;
    
    return {
      monthlyPayment,
      totalPayment,
      totalInterest
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-gray-100/30 p-2 sm:p-4">
      <div className="w-full space-y-3 sm:space-y-4 animate-fade-in">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 sm:p-5 text-white" style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Kredi Hesaplama</h1>
          </div>
          <p className="text-yellow-100 mb-3 text-sm">
            Kredi detaylarınızı girin ve hesaplama yapın
          </p>
          <div className="flex items-center gap-2 text-xs text-yellow-200">
            <Calculator className="h-3 w-3" />
            <span>Güncel faiz oranları ile hesaplama</span>
          </div>
        </div>

        {/* Hesaplama Türünü Seçin */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5" style={{ color: '#ffb700' }} />
            Hesaplama Türünü Seçin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setCalculationMode('rate')}
              className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                calculationMode === 'rate'
                  ? 'bg-yellow-50 text-yellow-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              style={calculationMode === 'rate' ? { borderColor: '#ffb700' } : {}}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-1.5 rounded-lg mb-1.5 ${
                  calculationMode === 'rate' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Percent className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium mb-1">Faize Göre</h3>
                <p className="text-xs text-gray-600">Faiz oranını girin</p>
              </div>
            </button>
            <button
              onClick={() => setCalculationMode('bank')}
              className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                calculationMode === 'bank'
                  ? 'bg-yellow-50 text-yellow-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-1.5 rounded-lg mb-1.5 ${
                  calculationMode === 'bank' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium mb-1">Bankaya Göre</h3>
                <p className="text-xs text-gray-600">Banka tekliflerini karşılaştır</p>
              </div>
            </button>
          </div>
        </div>

        {/* Kredi Bilgileri - Full Width */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Kredi Bilgileri
          </h2>
            
          <div className="space-y-6">
            {/* Kredi Türü */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kredi Türü
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {loanTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setLoanType(type.value)}
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center hover:scale-105 ${
                        loanType === type.value
                          ? 'bg-yellow-50 text-yellow-700 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      style={loanType === type.value ? { borderColor: '#ffb700' } : {}}
                    >
                      <div className={`p-2 rounded-lg mb-2 ${
                        loanType === type.value ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Kredi Tutarı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kredi Tutarı (₺)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-base transition-all duration-200"
                      style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      placeholder="500000"
                      min="10000"
                      max="10000000"
                      step="10000"
                    />
                </div>
              </div>

              {/* Vade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vade (Ay)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                      type="number"
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-base transition-all duration-200"
                      style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      placeholder="36"
                      min="6"
                      max="360"
                      step="6"
                    />
                </div>
              </div>



              {/* Faiz Oranı - Sadece 'rate' modunda göster */}
              {calculationMode === 'rate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Aylık Faiz Oranı (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-base transition-all duration-200"
                      style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      placeholder="2.5"
                      min="0.1"
                      max="50"
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results and Bank Offers Grid */}
        <div className="grid gap-4 sm:gap-6">
          {/* Results - Sadece 'rate' modunda göster */}
          {calculationMode === 'rate' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Hesaplama Sonuçları
              </h2>

              {calculation ? (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Ana Sonuç */}
                <div className="rounded-xl p-6 text-white mb-6" style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-medium">
                      Aylık Taksit Tutarı
                    </h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold">
                    {formatCurrency(calculation?.monthlyPayment || 0)}
                  </p>
                </div>

                {/* Diğer Sonuçlar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Toplam Ödeme */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-sm font-medium text-green-900">Toplam Ödeme</h3>
                    </div>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(calculation?.totalPayment || 0)}
                    </p>
                  </div>

                  {/* Toplam Faiz */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      </div>
                      <h3 className="text-sm font-medium text-orange-900">Toplam Faiz</h3>
                    </div>
                    <p className="text-xl font-bold text-orange-900">
                      {formatCurrency(calculation?.totalInterest || 0)}
                    </p>
                  </div>

                  {/* Faiz Oranı */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Percent className="h-4 w-4 text-yellow-600" />
                      </div>
                      <h3 className="text-sm font-medium text-yellow-900">
                        Faiz Oranı
                      </h3>
                    </div>
                    <p className="text-xl font-bold text-yellow-900">
                      {formatPercentage(interestRate)}
                    </p>
                  </div>

                  {/* Kredi Türü */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Kredi Türü</h3>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {loanType}
                    </p>
                  </div>
                </div>
              </div>
              ) : (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <Calculator className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 font-medium px-4">
                    📊 Hesaplama için tüm alanları doldurun
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Banka Teklifleri - Sadece 'bank' modunda göster */}
          {calculationMode === 'bank' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-yellow-600" />
                Banka Teklifleri
              </h2>

              {loanAmount > 0 && termMonths > 0 ? (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="text-sm sm:text-base font-medium text-gray-600 mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" style={{ color: '#ffb700' }} />
                    <span>{loanType} için güncel faiz oranları ve taksit hesaplamaları:</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getBankOffers().map((bank) => {
                    const offer = calculateBankOffer(bank.rate);
                    if (!offer) return null;
                    
                    return (
                      <div className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffb700'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                               <img src={bank.logo} alt={bank.name} className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI2ZmYjcwMCIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CPC90ZXh0Pgo8L3N2Zz4K'; }} />
                             </div>
                             <div>
                               <h3 className="font-bold text-gray-900 text-sm">{bank.name}</h3>
                               <p className="text-xs font-medium" style={{ color: '#ffb700' }}>%{bank.rate.toFixed(2)} aylık faiz</p>
                             </div>
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 mb-1 font-medium">Aylık Taksit Tutarı</div>
                            <div className="text-lg font-bold text-green-800">
                              {formatCurrency(offer.monthlyPayment)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Toplam Ödeme</div>
                              <div className="text-xs font-bold text-gray-800">
                                {formatCurrency(offer.totalPayment)}
                              </div>
                            </div>
                            <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                              <div className="text-xs text-red-600 mb-1">Toplam Faiz</div>
                              <div className="text-xs font-bold text-red-800">
                                {formatCurrency(offer.totalInterest)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-1">⚠️ Önemli Bilgilendirme</h4>
                      <p className="text-sm text-yellow-800">
                        Bu oranlar tahmini değerlerdir. Gerçek faiz oranları kredi notunuza, gelir durumunuza ve bankanın güncel politikalarına göre değişiklik gösterebilir. Kesin bilgi için bankayla iletişime geçiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              ) : (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <Building2 className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 px-4">Banka tekliflerini görmek için kredi tutarı ve vade giriniz</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6 text-gray-500 text-xs sm:text-sm bg-white/50 backdrop-blur-sm rounded-xl p-3 sm:p-4">
          <p className="font-medium">💡 Bu hesaplama tahmini değerlerdir. Gerçek kredi koşulları bankaya göre değişiklik gösterebilir.</p>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;