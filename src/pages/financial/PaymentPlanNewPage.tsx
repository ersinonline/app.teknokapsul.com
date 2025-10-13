import React, { useState } from 'react';
import { Home, Car, CreditCard, Building, Calculator, CheckCircle, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DownPayment {
  id: string;
  amount: number;
  description: string;
}

interface CreditBidResult {
  'bank-code': string;
  status: string;
  oran: string;
  tl: string;
  ay: string;
  url: string;
}

interface SelectedCredit {
  id: string;
  type: string;
  bankCode: string;
  bankName: string;
  amount: number;
  interestRate: string;
  monthlyPayment: number;
  totalPayment: number;
  totalAmount: number;
  term: number;
}

interface AdditionalExpenses {
  titleDeedFee: number;
  loanAllocationFee: number;
  appraisalFee: number;
  mortgageEstablishmentFee: number;
  daskInsurancePremium: number;
  total: number;
}

const PaymentPlanNewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form states
  const [currentStep, setCurrentStep] = useState<'type' | 'price' | 'down-payments' | 'housing-credit' | 'personal-credits' | 'plan-summary'>('type');
  const [planType, setPlanType] = useState<'housing' | 'vehicle'>('housing');
  const [price, setPrice] = useState<number>(0);
  const [downPayments, setDownPayments] = useState<DownPayment[]>([]);
  const [newDownPayment, setNewDownPayment] = useState({ amount: 0, description: '' });
  
  // Housing/Vehicle credit states
  const [selectedCredits, setSelectedCredits] = useState<SelectedCredit[]>([]);
  
  // Personal credit states
  const [personalCredits, setPersonalCredits] = useState<SelectedCredit[]>([]);
  const [personalCreditOffers, setPersonalCreditOffers] = useState<SelectedCredit[]>([]);
  const [personalCreditTerm, setPersonalCreditTerm] = useState<number>(12);
  const [personalCreditAmount, setPersonalCreditAmount] = useState<number>(0);
  
  // Plan save states
  const [planName, setPlanName] = useState<string>('');
  const [shareEmail, setShareEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);


  const [isCalculating, setIsCalculating] = useState(false);
  const [vehicleCreditOffers, setVehicleCreditOffers] = useState<SelectedCredit[]>([]);
  const [housingCreditOffers, setHousingCreditOffers] = useState<SelectedCredit[]>([]);
  const [housingCreditAmount, setHousingCreditAmount] = useState<number>(0);
  const [housingCreditTerm, setHousingCreditTerm] = useState<number>(120);
  const [vehicleCreditAmount, setVehicleCreditAmount] = useState<number>(0);
  const [vehicleCreditTerm, setVehicleCreditTerm] = useState<number>(36);

  // Vehicle credit limits calculation
  const getVehicleCreditLimit = (vehiclePrice: number): number => {
    if (vehiclePrice >= 400000.01 && vehiclePrice <= 800000) {
      return vehiclePrice * 0.5; // 50%
    } else if (vehiclePrice >= 800000.01 && vehiclePrice <= 1200000) {
      return vehiclePrice * 0.3; // 30%
    } else if (vehiclePrice >= 1200000.01 && vehiclePrice <= 2000000) {
      return vehiclePrice * 0.2; // 20%
    }
    return 0; // 2M üstü için taşıt kredisi yok
  };

  // Format bank name
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
      'kuveyt-turk': 'Kuveyt Türk'
    };
    return bankMapping[bankCode] || bankCode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Sort by interest rate
  const sortByInterestRate = (results: any[]): any[] => {
    return results.sort((a, b) => {
      const rateA = parseFloat(a.oran.replace('%', '').replace(',', '.'));
      const rateB = parseFloat(b.oran.replace('%', '').replace(',', '.'));
      return rateA - rateB;
    });
  };

  // Validate personal credit limits
  const validatePersonalCreditLimits = (amount: number, term: number): boolean => {
    if (amount <= 125000 && term <= 36) return true; // 125k'ya kadar 3 yıl
    if (amount <= 250000 && term <= 24) return true; // 250k'ya kadar 2 yıl
    if (amount <= 500000 && term <= 12) return true; // 500k'ya kadar 1 yıl
    return false; // 500k üstü verilmiyor
  };

  // Calculate personal credit
  const calculatePersonalCredit = async () => {
    if (personalCreditAmount <= 0) {
      alert('Lütfen geçerli bir kredi tutarı girin.');
      return;
    }
    
    // Validate credit limits
    if (!validatePersonalCreditLimits(personalCreditAmount, personalCreditTerm)) {
      alert(`İhtiyaç kredisi sınırları:\n- 125.000 TL'ye kadar: 3 yıl\n- 250.000 TL'ye kadar: 2 yıl\n- 500.000 TL'ye kadar: 1 yıl\n- 500.000 TL üstü kredi verilmemektedir.`);
      return;
    }
    
    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${personalCreditAmount}&data.month=${personalCreditTerm}&data.query=ihtiyac`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        const sortedResults = sortByInterestRate(data.result);
        const offers: SelectedCredit[] = sortedResults.map((offer: CreditBidResult, index: number) => ({
          id: `personal-${Date.now()}-${index}`,
          type: 'ihtiyac',
          bankCode: offer['bank-code'],
          bankName: formatBankName(offer['bank-code']),
          amount: personalCreditAmount,
          interestRate: offer.oran,
          monthlyPayment: Math.round(parseFloat(offer.ay.replace(/[^\d.-]/g, ''))),
          totalPayment: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          totalAmount: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          term: personalCreditTerm
        }));
        
        setPersonalCreditOffers(offers);
      } else {
        // Fallback to mock data if API fails
        const mockOffers: SelectedCredit[] = [
          {
            id: `pc-${Date.now()}-1`,
            type: 'ihtiyac',
            bankCode: 'garanti-bbva',
            bankName: 'Garanti BBVA',
            amount: personalCreditAmount,
            interestRate: '2.89',
            monthlyPayment: Math.round(personalCreditAmount * 0.035),
            totalPayment: Math.round(personalCreditAmount * 1.4),
            totalAmount: Math.round(personalCreditAmount * 1.4),
            term: personalCreditTerm
          },
          {
            id: `pc-${Date.now()}-2`,
            type: 'ihtiyac',
            bankCode: 'isbank',
            bankName: 'İş Bankası',
            amount: personalCreditAmount,
            interestRate: '3.15',
            monthlyPayment: Math.round(personalCreditAmount * 0.038),
            totalPayment: Math.round(personalCreditAmount * 1.45),
            totalAmount: Math.round(personalCreditAmount * 1.45),
            term: personalCreditTerm
          }
        ];
        setPersonalCreditOffers(mockOffers);
      }
    } catch (error) {
      console.error('Error calculating personal credit:', error);
      // Fallback to mock data
      const mockOffers: SelectedCredit[] = [
        {
          id: `pc-${Date.now()}-1`,
          type: 'ihtiyac',
          bankCode: 'garanti-bbva',
          bankName: 'Garanti BBVA',
          amount: personalCreditAmount,
          interestRate: '2.89',
          monthlyPayment: Math.round(personalCreditAmount * 0.035),
          totalPayment: Math.round(personalCreditAmount * 1.4),
          totalAmount: Math.round(personalCreditAmount * 1.4),
          term: personalCreditTerm
        }
      ];
      setPersonalCreditOffers(mockOffers);
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate vehicle credit
  const calculateVehicleCredit = async () => {
    if (vehicleCreditAmount <= 0) {
      alert('Lütfen geçerli bir kredi tutarı girin.');
      return;
    }
    
    const maxAmount = getVehicleCreditLimit(price);
    if (vehicleCreditAmount > maxAmount) {
      alert(`Bu fiyat aralığında maksimum ${formatCurrency(maxAmount)} taşıt kredisi kullanabilirsiniz.`);
      return;
    }

    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${vehicleCreditAmount}&data.month=${vehicleCreditTerm}&data.query=tasit`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        const sortedResults = sortByInterestRate(data.result);
        const offers: SelectedCredit[] = sortedResults.map((offer: any, index: number) => ({
          id: `vehicle-${index}`,
          type: 'tasit',
          bankCode: offer['bank-code'],
          bankName: formatBankName(offer['bank-code']),
          amount: vehicleCreditAmount,
          interestRate: offer.oran,
          monthlyPayment: Math.round(parseFloat(offer.ay.replace(/[^\d.-]/g, ''))),
          totalPayment: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          totalAmount: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          term: vehicleCreditTerm
        }));
        
        setVehicleCreditOffers(offers);
      } else {
        // Fallback to mock data if API fails
        const mockOffers: SelectedCredit[] = [
          {
            id: 'vehicle-mock-1',
            type: 'tasit',
            bankCode: 'garanti-bbva',
            bankName: 'Garanti BBVA',
            amount: vehicleCreditAmount,
            interestRate: '2.89',
            monthlyPayment: Math.round(vehicleCreditAmount * 0.025),
            totalPayment: Math.round(vehicleCreditAmount * 1.5),
            totalAmount: Math.round(vehicleCreditAmount * 1.5),
            term: vehicleCreditTerm
          }
        ];
        setVehicleCreditOffers(mockOffers);
      }
    } catch (error) {
      console.error('Taşıt kredisi hesaplama hatası:', error);
      alert('Taşıt kredisi hesaplanırken bir hata oluştu.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate housing credit
  const calculateHousingCredit = async () => {
    if (housingCreditAmount <= 0) {
      alert('Lütfen geçerli bir kredi tutarı girin.');
      return;
    }

    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${housingCreditAmount}&data.month=${housingCreditTerm}&data.query=konut`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        const sortedResults = sortByInterestRate(data.result);
        const offers: SelectedCredit[] = sortedResults.map((offer: any, index: number) => ({
          id: `housing-${index}`,
          type: 'konut',
          bankCode: offer['bank-code'],
          bankName: formatBankName(offer['bank-code']),
          amount: housingCreditAmount,
          interestRate: offer.oran,
          monthlyPayment: Math.round(parseFloat(offer.ay.replace(/[^\d.-]/g, ''))),
          totalPayment: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          totalAmount: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          term: housingCreditTerm
        }));
        
        setHousingCreditOffers(offers);
      } else {
        // Fallback to mock data if API fails
        const mockOffers: SelectedCredit[] = [
          {
            id: 'housing-mock-1',
            type: 'konut',
            bankCode: 'garanti-bbva',
            bankName: 'Garanti BBVA',
            amount: housingCreditAmount,
            interestRate: '1.89',
            monthlyPayment: Math.round(housingCreditAmount * 0.015),
            totalPayment: Math.round(housingCreditAmount * 1.8),
            totalAmount: Math.round(housingCreditAmount * 1.8),
            term: housingCreditTerm
          }
        ];
        setHousingCreditOffers(mockOffers);
      }
    } catch (error) {
      console.error('Konut kredisi hesaplama hatası:', error);
      alert('Konut kredisi hesaplanırken bir hata oluştu.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate remaining amount after down payments
  const totalDownPayment = downPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const selectedHousingVehicleCreditAmount = selectedCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPersonalCreditAmount = personalCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPersonalCreditMonthly = personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0);
  
  // Toplam ödeme kontrolü - peşinat + krediler = ev/araç değeri
  const totalPayments = totalDownPayment + selectedHousingVehicleCreditAmount + totalPersonalCreditAmount;
  const remainingAmount = price - totalPayments;
  const isExactMatch = Math.abs(remainingAmount) < 1; // 1 TL tolerans
  const isOverPaid = remainingAmount < -1;
  
  // Eski hesaplamalar (geriye uyumluluk için)
  const remainingAfterDownPayment = price - totalDownPayment - selectedHousingVehicleCreditAmount;
  const actualCreditAmount = selectedCredits.reduce((sum, credit) => sum + credit.amount, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateAdditionalExpenses = (housePrice: number): AdditionalExpenses => {
    const titleDeedFee = housePrice * 0.04; // %4 tapu masrafı
    const loanAllocationFee = 500; // 500 TL kredi tahsis ücreti
    const appraisalFee = 15874; // 15.874 TL ekspertiz ücreti
    const mortgageEstablishmentFee = 2700; // 2.700 TL ipotek tesis ücreti
    const daskInsurancePremium = 1500; // 1.500 TL DASK sigorta primi (yıllık)
    
    const total = titleDeedFee + loanAllocationFee + appraisalFee + mortgageEstablishmentFee + daskInsurancePremium;
    
    return {
      titleDeedFee,
      loanAllocationFee,
      appraisalFee,
      mortgageEstablishmentFee,
      daskInsurancePremium,
      total
    };
  };

  const addDownPayment = () => {
    if (newDownPayment.amount > 0 && newDownPayment.description.trim()) {
      const downPayment: DownPayment = {
        id: Date.now().toString(),
        amount: newDownPayment.amount,
        description: newDownPayment.description.trim()
      };
      setDownPayments([...downPayments, downPayment]);
      setNewDownPayment({ amount: 0, description: '' });
    }
  };

  const removeDownPayment = (id: string) => {
    setDownPayments(downPayments.filter(dp => dp.id !== id));
  };

  const shareViaEmail = async (plan: any, email: string) => {
    try {
      // Firebase Functions'dan email gönderme servisini çağır
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../lib/firebase');
      
      const sendPaymentPlanEmail = httpsCallable(functions, 'sendPaymentPlanEmail');
      
      // Ek masrafları hesapla
      const additionalExpenses = planType === 'housing' ? calculateAdditionalExpenses(plan.price) : null;
      
      const planData = {
        name: plan.name,
        housePrice: plan.price,
        totalDownPayment: plan.downPayments.reduce((sum: number, dp: any) => sum + dp.amount, 0),
        housingCredit: plan.housingCredit,
        personalCredits: plan.personalCredits,
        totalMonthlyPayment: plan.totalMonthlyPayment,
        additionalExpenses,
        createdAt: plan.createdAt.toISOString()
      };
      
      const result = await sendPaymentPlanEmail({ to: email, planData });
      console.log('Email gönderildi:', result);
      
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      // Hata durumunda kullanıcıya bilgi ver ama işlemi durdurmayalım
      alert('Email gönderilirken bir sorun oluştu, ancak plan başarıyla kaydedildi.');
    }
  };

  const savePlan = async () => {
    if (!planName.trim() || !user) return;
    
    setIsSaving(true);
    try {
      const additionalExpenses = planType === 'housing' ? calculateAdditionalExpenses(price) : null;
      
      const planData = {
        name: planName.trim(),
        type: planType,
        price: price,
        downPayments: downPayments,
        housingCredit: selectedCredits.find(c => c.type === 'konut' || c.type === 'tasit') || null,
        personalCredits: personalCredits,
        monthlyPayments: [], // Will be calculated
        totalMonthlyPayment: selectedCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0) + totalPersonalCreditMonthly,
        additionalExpenses: additionalExpenses,
        createdAt: new Date(),
        sharedWith: shareEmail.trim() || null,
        userId: user.id
      };
      
      const docRef = await addDoc(collection(db, `teknokapsul/${user.id}/paymentPlans`), planData);
      
      const newPlan = {
        id: docRef.id,
        ...planData
      };
      
      // Send email if provided
      if (shareEmail?.trim()) {
        await shareViaEmail(newPlan, shareEmail);
      }
      
      alert(`Plan başarıyla kaydedildi! ${shareEmail ? 'Email gönderildi.' : ''}`);
      
      // Navigate to the created plan's detail page
      navigate(`/payment-plan/${docRef.id}`);
    } catch (error) {
      console.error('Plan kaydedilirken hata:', error);
      alert('Plan kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'type', label: 'Tip', shortLabel: 'Tip', icon: planType === 'vehicle' ? Car : Home },
      { key: 'price', label: planType === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı', shortLabel: 'Fiyat', icon: planType === 'vehicle' ? Car : Home },
      { key: 'down-payments', label: 'Peşinatlar', shortLabel: 'Peşinat', icon: CreditCard },
      { key: 'housing-credit', label: planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi', shortLabel: planType === 'vehicle' ? 'Taşıt' : 'Konut', icon: Building },
      { key: 'personal-credits', label: 'İhtiyaç Kredisi', shortLabel: 'İhtiyaç', icon: Calculator },
      { key: 'plan-summary', label: 'Plan Özeti', shortLabel: 'Özet', icon: CheckCircle }
    ];

    return (
      <div className="mb-8">
        <div className="flex justify-center overflow-x-auto pb-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
            {steps.map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-[#ffb700] text-white' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.label}
                    </span>
                    <span className="sm:hidden text-sm font-medium">
                      {step.shortLabel}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="relative flex items-center justify-center mb-3">
            <button
              onClick={() => navigate('/payment-plan')}
              className="absolute left-0 sm:left-2 p-2 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center">
              <div className="bg-[#ffb700] p-2 sm:p-3 rounded-full mr-2 sm:mr-3">
                {planType === 'vehicle' ? <Car className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <Home className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                Yeni Ödeme Planı
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2 sm:px-4">
            {planType === 'vehicle' ? 'Araç alımınız' : 'Ev alımınız'} için detaylı ödeme planı oluşturun.
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border p-4 sm:p-6">
          {/* Type Selection Step */}
          {currentStep === 'type' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Tipini Seçin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => setPlanType('housing')}
                  className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation ${
                    planType === 'housing'
                      ? 'border-[#ffb700] bg-[#ffb700]/5'
                      : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                  }`}
                >
                  <Home className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${
                    planType === 'housing' ? 'text-[#ffb700]' : 'text-gray-400'
                  }`} />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Konut</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Ev, daire veya konut alımı için ödeme planı oluşturun
                  </p>
                </button>
                
                <button
                  onClick={() => setPlanType('vehicle')}
                  className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation ${
                    planType === 'vehicle'
                      ? 'border-[#ffb700] bg-[#ffb700]/5'
                      : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                  }`}
                >
                  <Car className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${
                    planType === 'vehicle' ? 'text-[#ffb700]' : 'text-gray-400'
                  }`} />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Taşıt</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Araba, motosiklet veya taşıt alımı için ödeme planı oluşturun
                  </p>
                </button>
              </div>
              
              <div className="mt-6 sm:mt-8 text-center">
                <button
                  onClick={() => setCurrentStep('price')}
                  className="w-full sm:w-auto bg-[#ffb700] text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-[#e6a500] active:bg-[#d49400] transition-colors font-medium touch-manipulation"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* Price Step */}
          {currentStep === 'price' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {planType === 'vehicle' ? 'Araç Fiyatını Girin' : 'Ev Fiyatını Girin'}
              </h2>
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {planType === 'vehicle' ? 'Araç Fiyatı (TL)' : 'Ev Fiyatı (TL)'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-base sm:text-lg touch-manipulation"
                  placeholder={planType === 'vehicle' ? 'Örn: 800000' : 'Örn: 5000000'}
                />
                
                {planType === 'vehicle' && price > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Taşıt Kredisi Limitleri:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {price >= 400000.01 && price <= 800000 && (
                        <p>• Bu fiyat aralığında maksimum %50 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price >= 800000.01 && price <= 1200000 && (
                        <p>• Bu fiyat aralığında maksimum %30 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price >= 1200000.01 && price <= 2000000 && (
                        <p>• Bu fiyat aralığında maksimum %20 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price > 2000000 && (
                        <p>• 2 milyon TL üstü araçlar için taşıt kredisi kullanılamaz. İhtiyaç kredisi kullanabilirsiniz.</p>
                      )}
                      {price < 400000.01 && price > 0 && (
                        <p>• Bu fiyat aralığında taşıt kredisi kullanılamaz. İhtiyaç kredisi kullanabilirsiniz.</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
                  <button
                    onClick={() => setCurrentStep('type')}
                    className="w-full sm:w-auto bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors touch-manipulation"
                  >
                    Geri
                  </button>
                  <button
                    onClick={() => setCurrentStep('down-payments')}
                    disabled={!price || price <= 0}
                    className="w-full sm:w-auto bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] active:bg-[#d49400] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    Devam Et
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Down Payments Step */}
          {currentStep === 'down-payments' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Peşinat Ödemelerini Ekleyin</h2>
              
              {/* Add new down payment */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-4">Yeni Peşinat Ekle</h3>
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={newDownPayment.amount || ''}
                      onChange={(e) => setNewDownPayment({...newDownPayment, amount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent touch-manipulation"
                      placeholder="Örn: 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <input
                      type="text"
                      value={newDownPayment.description}
                      onChange={(e) => setNewDownPayment({...newDownPayment, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent touch-manipulation"
                      placeholder="Örn: İlk peşinat"
                    />
                  </div>
                  <div className="sm:flex sm:items-end">
                    <button
                      onClick={addDownPayment}
                      disabled={!newDownPayment.amount || !newDownPayment.description.trim()}
                      className="w-full bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a500] active:bg-[#d49400] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center touch-manipulation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>

              {/* Down payments list */}
              {downPayments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Eklenen Peşinatlar</h3>
                  <div className="space-y-3">
                    {downPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{payment.description}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{formatCurrency(payment.amount)}</p>
                        </div>
                        <button
                          onClick={() => removeDownPayment(payment.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Toplam Peşinat: {formatCurrency(totalDownPayment)}</p>
                    <p className="text-sm text-gray-600">Kalan Tutar: {formatCurrency(remainingAfterDownPayment)}</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setCurrentStep('price')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('housing-credit')}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  Devam Et
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Housing/Vehicle Credit Step */}
          {currentStep === 'housing-credit' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}
              </h2>
              
              {/* Manual Input Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {planType === 'vehicle' ? 'Taşıt Kredisi Bilgileri' : 'Konut Kredisi Bilgileri'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                    <input
                      type="number"
                      value={planType === 'vehicle' ? vehicleCreditAmount || '' : housingCreditAmount || ''}
                      max={planType === 'vehicle' ? getVehicleCreditLimit(price) : undefined}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (planType === 'vehicle') {
                          const maxLimit = getVehicleCreditLimit(price);
                          if (value <= maxLimit) {
                            setVehicleCreditAmount(value);
                          } else {
                            setVehicleCreditAmount(maxLimit);
                            alert(`Bu fiyat aralığında maksimum ${formatCurrency(maxLimit)} taşıt kredisi kullanabilirsiniz.`);
                          }
                        } else {
                          setHousingCreditAmount(value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                    <select
                      value={planType === 'vehicle' ? vehicleCreditTerm : housingCreditTerm}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (planType === 'vehicle') {
                          setVehicleCreditTerm(value);
                        } else {
                          setHousingCreditTerm(value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    >
                      {planType === 'vehicle' ? (
                        <>
                          <option value={12}>12 Ay</option>
                          <option value={24}>24 Ay</option>
                          <option value={36}>36 Ay</option>
                          <option value={48}>48 Ay</option>
                          <option value={60}>60 Ay</option>
                        </>
                      ) : (
                        <>
                          <option value={60}>60 Ay (5 Yıl)</option>
                          <option value={120}>120 Ay (10 Yıl)</option>
                          <option value={180}>180 Ay (15 Yıl)</option>
                          <option value={240}>240 Ay (20 Yıl)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={planType === 'vehicle' ? calculateVehicleCredit : calculateHousingCredit}
                      disabled={isCalculating || (planType === 'vehicle' ? vehicleCreditAmount <= 0 : housingCreditAmount <= 0)}
                      className="w-full bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isCalculating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Hesaplanıyor...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4 mr-2" />
                          Hesapla
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Credit Limits Info */}
                {planType === 'vehicle' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Taşıt Kredisi Limitleri:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {price >= 400000.01 && price <= 800000 && (
                        <p>• Bu fiyat aralığında maksimum %50 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price >= 800000.01 && price <= 1200000 && (
                        <p>• Bu fiyat aralığında maksimum %30 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price >= 1200000.01 && price <= 2000000 && (
                        <p>• Bu fiyat aralığında maksimum %20 taşıt kredisi kullanabilirsiniz: {formatCurrency(getVehicleCreditLimit(price))}</p>
                      )}
                      {price > 2000000 && (
                        <p>• 2 milyon TL üstü araçlar için taşıt kredisi kullanılamaz. İhtiyaç kredisi kullanabilirsiniz.</p>
                      )}
                      {price < 400000.01 && price > 0 && (
                        <p>• Bu fiyat aralığında taşıt kredisi kullanılamaz. İhtiyaç kredisi kullanabilirsiniz.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Credit Offers */}
              {((planType === 'vehicle' && vehicleCreditOffers.length > 0) || 
                (planType === 'housing' && housingCreditOffers.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {planType === 'vehicle' ? 'Taşıt Kredisi Teklifleri' : 'Konut Kredisi Teklifleri'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {(planType === 'vehicle' ? vehicleCreditOffers : housingCreditOffers).map((offer) => {
                      const isSelected = selectedCredits.some(c => c.id === offer.id);
                      return (
                        <div key={offer.id} className={`p-3 sm:p-4 border rounded-lg transition-all duration-300 ${
                          isSelected 
                            ? 'border-green-500 bg-green-50 shadow-lg' 
                            : 'border-gray-200 hover:border-[#ffb700] hover:shadow-md active:border-[#ffb700]'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900 text-sm">{offer.bankName}</h4>
                            <span className="text-xs font-medium text-[#ffb700] bg-[#ffb700]/10 px-2 py-1 rounded">%{offer.interestRate}</span>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600 mb-4">
                            <div className="flex justify-between">
                              <span>Kredi Tutarı:</span>
                              <span className="font-medium">{formatCurrency(offer.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vade:</span>
                              <span className="font-medium">{offer.term} ay</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Aylık Taksit:</span>
                              <span className="font-medium">{formatCurrency(offer.monthlyPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Toplam Ödeme:</span>
                              <span className="font-medium">{formatCurrency(offer.totalPayment)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (isSelected) {
                                // Seçili krediyi kaldır
                                if (planType === 'vehicle') {
                                  setSelectedCredits(selectedCredits.filter(c => c.type !== 'tasit'));
                                } else {
                                  setSelectedCredits(selectedCredits.filter(c => c.type !== 'konut'));
                                }
                              } else {
                                // Sadece bu krediyi seç (aynı türdeki diğerlerini temizle)
                                if (planType === 'vehicle') {
                                  setSelectedCredits([...selectedCredits.filter(c => c.type !== 'tasit'), offer]);
                                } else {
                                  setSelectedCredits([...selectedCredits.filter(c => c.type !== 'konut'), offer]);
                                }
                                // Teklifleri temizle - yeniden hesaplama gerektirecek
                                 if (planType === 'vehicle') {
                                   setVehicleCreditOffers([]);
                                 } else {
                                   setHousingCreditOffers([]);
                                 }
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 touch-manipulation ${
                              isSelected
                                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md'
                                : 'bg-[#ffb700] text-white hover:bg-[#e6a500] active:bg-[#d49400] hover:shadow-md'
                            }`}
                          >
                            {isSelected ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Seçildi
                              </div>
                            ) : (
                              'Bu Krediyi Seç'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Credits */}
              {selectedCredits.some(c => c.type === (planType === 'vehicle' ? 'tasit' : 'konut')) && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-green-800">Seçildi - {planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</h3>
                  </div>
                  {selectedCredits
                    .filter(c => c.type === (planType === 'vehicle' ? 'tasit' : 'konut'))
                    .map((credit) => (
                      <div key={credit.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-green-900">{credit.bankName}</h4>
                          <span className="text-sm font-medium text-green-700">%{credit.interestRate}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                          <div>
                            <p>Kredi Tutarı: {formatCurrency(credit.amount)}</p>
                            <p>Vade: {credit.term} ay</p>
                          </div>
                          <div>
                            <p>Aylık Taksit: {formatCurrency(credit.monthlyPayment)}</p>
                            <p>Toplam Ödeme: {formatCurrency(credit.totalPayment)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCredits(selectedCredits.filter(c => c.id !== credit.id));
                          }}
                          className="mt-3 flex items-center text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Kaldır
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setCurrentStep('down-payments')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('personal-credits')}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  {remainingAfterDownPayment > 0 ? 'İhtiyaç Kredisine Geç' : 'Devam Et'}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Personal Credits Step */}
          {currentStep === 'personal-credits' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">İhtiyaç Kredileri</h2>
              
              {/* Remaining Amount Info */}
              {(remainingAfterDownPayment - totalPersonalCreditAmount) > 0 && (
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-800">
                    Kalan tutar: <span className="font-semibold">{formatCurrency(remainingAfterDownPayment - totalPersonalCreditAmount)}</span>
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    İhtiyaç kredisi ile maksimum 500.000 TL'ye kadar finansman sağlayabilirsiniz.
                  </p>
                </div>
              )}

              {/* Manual Input Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">İhtiyaç Kredisi Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                    <input
                      type="number"
                      value={personalCreditAmount || ''}
                      onChange={(e) => setPersonalCreditAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: 100000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                    <select
                      value={personalCreditTerm}
                      onChange={(e) => setPersonalCreditTerm(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    >
                      <option value={12}>12 ay (1 yıl)</option>
                      <option value={24}>24 ay (2 yıl)</option>
                      <option value={36}>36 ay (3 yıl)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={calculatePersonalCredit}
                      disabled={isCalculating || personalCreditAmount <= 0}
                      className="w-full bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isCalculating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Hesaplanıyor...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4 mr-2" />
                          Hesapla
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Credit Limits Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">İhtiyaç Kredisi Limitleri:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• 125.000 TL'ye kadar: Maksimum 36 ay vade</p>
                    <p>• 250.000 TL'ye kadar: Maksimum 24 ay vade</p>
                    <p>• 500.000 TL'ye kadar: Maksimum 12 ay vade</p>
                    <p>• 500.000 TL üstü kredi verilmemektedir</p>
                  </div>
                </div>
              </div>

              {/* Credit Offers */}
              {personalCreditOffers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">İhtiyaç Kredisi Teklifleri</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {personalCreditOffers.map((offer) => {
                      const isSelected = personalCredits.some(c => c.id === offer.id);
                      return (
                        <div 
                          key={offer.id} 
                          className={`p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-lg' 
                              : 'border-gray-200 hover:border-[#ffb700] active:border-[#ffb700]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm">{offer.bankName}</h4>
                            <span className="text-xs font-bold text-[#ffb700] bg-[#ffb700]/10 px-2 py-1 rounded">%{offer.interestRate}</span>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600 mb-4">
                            <div className="flex justify-between">
                              <span>Tutar:</span>
                              <span className="font-medium">{formatCurrency(offer.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vade:</span>
                              <span className="font-medium">{offer.term} ay</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Aylık:</span>
                              <span className="font-medium">{formatCurrency(offer.monthlyPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Toplam:</span>
                              <span className="font-medium">{formatCurrency(offer.totalPayment)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (isSelected) {
                                // Seçili krediyi kaldır
                                setPersonalCredits(personalCredits.filter(c => c.id !== offer.id));
                              } else {
                                // Bu krediyi ekle (birden fazla kredi seçilebilir)
                                setPersonalCredits([...personalCredits, offer]);
                                // Teklifleri temizle - yeniden hesaplama gerektirecek
                                setPersonalCreditOffers([]);
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center touch-manipulation ${
                              isSelected
                                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                                : 'bg-[#ffb700] text-white hover:bg-[#e6a500] active:bg-[#d49400]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Seçildi
                              </>
                            ) : (
                              'Bu Krediyi Seç'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Personal Credits */}
              {personalCredits.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-green-800">Seçildi - İhtiyaç Kredileri</h3>
                  </div>
                  <div className="space-y-3">
                    {personalCredits.map((credit) => (
                      <div key={credit.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-green-900">{credit.bankName}</h4>
                          <button
                            onClick={() => setPersonalCredits(personalCredits.filter(c => c.id !== credit.id))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                          <div>
                            <p>Kredi Tutarı: {formatCurrency(credit.amount)}</p>
                            <p>Faiz Oranı: %{credit.interestRate}</p>
                          </div>
                          <div>
                            <p>Aylık Taksit: {formatCurrency(credit.monthlyPayment)}</p>
                            <p>Toplam Ödeme: {formatCurrency(credit.totalPayment)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setCurrentStep('housing-credit')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('plan-summary')}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  Plan Özetine Geç
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Plan Summary Step */}
          {currentStep === 'plan-summary' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Özeti</h2>
              
              {/* Plan Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{planType === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(price)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Peşinat</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(totalDownPayment)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(actualCreditAmount)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">İhtiyaç Kredileri</p>
                    <p className="text-lg font-semibold text-orange-600">{formatCurrency(totalPersonalCreditAmount)}</p>
                  </div>
                </div>
                
                {/* Ödeme Durumu Kontrolü */}
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  isExactMatch 
                    ? 'bg-green-50 border-green-200' 
                    : isOverPaid 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Toplam Ödeme</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPayments)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">Durum</p>
                      <p className={`text-lg font-semibold ${
                        isExactMatch 
                          ? 'text-green-600' 
                          : isOverPaid 
                          ? 'text-red-600' 
                          : 'text-yellow-600'
                      }`}>
                        {isExactMatch 
                          ? '✓ Tam Eşit' 
                          : isOverPaid 
                          ? `⚠ ${formatCurrency(Math.abs(remainingAmount))} Fazla` 
                          : `⚠ ${formatCurrency(remainingAmount)} Eksik`
                        }
                      </p>
                    </div>
                  </div>
                  {!isExactMatch && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className={`text-sm ${
                        isOverPaid ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {isOverPaid 
                          ? '⚠️ Toplam ödeme tutarı araç/ev değerini aşıyor. Lütfen kredi tutarlarını azaltın.' 
                          : '⚠️ Toplam ödeme tutarı araç/ev değerinden az. Lütfen eksik tutarı tamamlayın.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Plan */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Planı Kaydet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Adı *
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder={`Örn: ${planType === 'vehicle' ? 'Araç' : 'Ev'} Alım Planı 2024`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email ile Paylaş (İsteğe bağlı)
                    </label>
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
                <button
                  onClick={savePlan}
                  disabled={!planName.trim() || isSaving || !isExactMatch}
                  className="mt-4 w-full sm:w-auto bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Planı Kaydet
                    </>
                  )}
                </button>
                {!isExactMatch && (
                  <p className="mt-2 text-sm text-red-600">
                    ⚠️ Plan kaydedilebilmesi için peşinat + krediler toplamının {planType === 'vehicle' ? 'araç' : 'ev'} değerine tam eşit olması gerekir.
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setCurrentStep('personal-credits')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanNewPage;