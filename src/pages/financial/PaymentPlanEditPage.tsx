import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Home, Car, CreditCard, Building, Calculator, CheckCircle, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DownPayment {
  id: string;
  amount: number;
  description: string;
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
}

interface PaymentPlan {
  id: string;
  name: string;
  type: 'housing' | 'vehicle';
  price: number;
  downPayments: DownPayment[];
  housingCredit: SelectedCredit | null;
  personalCredits: SelectedCredit[];
  monthlyPayments: any[];
  totalMonthlyPayment: number;
  createdAt: any;
  sharedWith: string | null;
  userId: string;
}

const PaymentPlanEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [currentStep, setCurrentStep] = useState<'type' | 'price' | 'down-payments' | 'housing-credit' | 'personal-credits' | 'plan-summary'>('type');
  const [planType, setPlanType] = useState<'housing' | 'vehicle'>('housing');
  const [price, setPrice] = useState<number>(0);
  const [downPayments, setDownPayments] = useState<DownPayment[]>([]);
  const [newDownPayment, setNewDownPayment] = useState({ amount: 0, description: '' });
  
  // Plan save states
  const [planName, setPlanName] = useState<string>('');
  const [shareEmail, setShareEmail] = useState<string>('');
  
  // Credit states (simplified for now)
  const [selectedCredit, setSelectedCredit] = useState<SelectedCredit | null>(null);
  const [personalCredits, setPersonalCredits] = useState<SelectedCredit[]>([]);

  const calculateAdditionalExpenses = (housePrice: number): AdditionalExpenses => {
    return {
      titleDeedFee: housePrice * 0.004, // %0.4
      loanAllocationFee: housePrice * 0.001, // %0.1
      appraisalFee: Math.min(housePrice * 0.002, 5000), // %0.2, max 5000 TL
      mortgageEstablishmentFee: housePrice * 0.0015, // %0.15
      daskInsurancePremium: Math.min(housePrice * 0.0005, 1000) // %0.05, max 1000 TL
    };
  };



  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) {
        setError('Plan ID bulunamadı');
        setLoading(false);
        return;
      }

      try {
          if (!user) return;
          const docRef = doc(db, `teknokapsul/${user.id}/paymentPlans`, id);
          const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const planData = { id: docSnap.id, ...docSnap.data() } as PaymentPlan;
          
          // Check if user has permission to edit
          if (user && user.id !== planData.userId) {
            setError('Bu planı düzenleme yetkiniz yok');
            setLoading(false);
            return;
          }
          
          // Set form data
          setPlanType(planData.type);
          setPrice(planData.price);
          setDownPayments(planData.downPayments || []);
          setPlanName(planData.name);
          setShareEmail(planData.sharedWith || '');
          setSelectedCredit(planData.housingCredit);
          setPersonalCredits(planData.personalCredits || []);
        } else {
          setError('Plan bulunamadı');
        }
      } catch (err) {
        console.error('Plan yüklenirken hata:', err);
        setError('Plan yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, user]);

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

  // Calculate remaining amount after down payments
  const totalDownPayment = downPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const remainingAfterDownPayment = price - totalDownPayment;
  const actualCreditAmount = selectedCredit ? selectedCredit.amount : 0;
  const totalPersonalCreditAmount = personalCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPersonalCreditMonthly = personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
        createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString()
      };
      
      const result = await sendPaymentPlanEmail({ to: email, planData });
      console.log('Email gönderildi:', result);
      
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      // Hata durumunda kullanıcıya bilgi ver ama işlemi durdurmayalım
      alert('Email gönderilirken bir sorun oluştu, ancak plan başarıyla güncellendi.');
    }
  };

  const savePlan = async () => {
    if (!planName.trim() || !user || !id) return;
    
    setSaving(true);
    try {
      const additionalExpenses = planType === 'housing' ? calculateAdditionalExpenses(price) : null;
      
      const planData = {
        name: planName.trim(),
        type: planType,
        price: price,
        downPayments: downPayments,
        housingCredit: selectedCredit,
        personalCredits: personalCredits,
        monthlyPayments: [], // Will be calculated
        totalMonthlyPayment: (selectedCredit?.monthlyPayment || 0) + totalPersonalCreditMonthly,
        additionalExpenses: additionalExpenses,
        sharedWith: shareEmail.trim() || null,
        updatedAt: new Date()
      };
      
      const docRef = doc(db, `teknokapsul/${user.id}/paymentPlans`, id);
      await updateDoc(docRef, planData);
      
      const updatedPlan = {
        id: id,
        ...planData,
        createdAt: new Date() // Use current date as fallback
      };
      
      // Send email if provided
      if (shareEmail?.trim()) {
        await shareViaEmail(updatedPlan, shareEmail);
      }
      
      alert(`Plan başarıyla güncellendi! ${shareEmail ? 'Email gönderildi.' : ''}`);
      
      // Navigate to the updated plan's detail page
      navigate(`/tekno-finans/payment-plans/${id}`);
    } catch (error) {
      console.error('Plan güncellenirken hata:', error);
      alert('Plan güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700] mx-auto mb-4"></div>
          <p className="text-gray-600">Plan yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => navigate('/tekno-finans/payment-plans')}
            className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3">
            <button
              onClick={() => navigate(`/tekno-finans/payment-plans/${id}`)}
              className="absolute left-4 sm:left-6 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="bg-[#ffb700] p-3 rounded-full mr-3">
              {planType === 'vehicle' ? <Car className="w-8 h-8 text-white" /> : <Home className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Ödeme Planını Düzenle
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            {planType === 'vehicle' ? 'Araç alımınız' : 'Ev alımınız'} için ödeme planınızı güncelleyin.
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Type Selection Step */}
          {currentStep === 'type' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Tipini Seçin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => setPlanType('housing')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    planType === 'housing'
                      ? 'border-[#ffb700] bg-[#ffb700]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Home className={`w-12 h-12 mx-auto mb-4 ${
                    planType === 'housing' ? 'text-[#ffb700]' : 'text-gray-400'
                  }`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Konut</h3>
                  <p className="text-sm text-gray-600">
                    Ev, daire veya konut alımı için ödeme planı
                  </p>
                </button>
                
                <button
                  onClick={() => setPlanType('vehicle')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    planType === 'vehicle'
                      ? 'border-[#ffb700] bg-[#ffb700]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Car className={`w-12 h-12 mx-auto mb-4 ${
                    planType === 'vehicle' ? 'text-[#ffb700]' : 'text-gray-400'
                  }`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Taşıt</h3>
                  <p className="text-sm text-gray-600">
                    Araba, motosiklet veya taşıt alımı için ödeme planı
                  </p>
                </button>
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={() => setCurrentStep('price')}
                  className="bg-[#ffb700] text-white px-8 py-3 rounded-lg hover:bg-[#e6a500] transition-colors font-medium"
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
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-lg"
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
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
                  <button
                    onClick={() => setCurrentStep('type')}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Geri
                  </button>
                  <button
                    onClick={() => setCurrentStep('down-payments')}
                    disabled={!price || price <= 0}
                    className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Peşinat Ödemelerini Düzenleyin</h2>
              
              {/* Add new down payment */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Yeni Peşinat Ekle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL)</label>
                    <input
                      type="number"
                      value={newDownPayment.amount || ''}
                      onChange={(e) => setNewDownPayment({...newDownPayment, amount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <input
                      type="text"
                      value={newDownPayment.description}
                      onChange={(e) => setNewDownPayment({...newDownPayment, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: İlk peşinat"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addDownPayment}
                      disabled={!newDownPayment.amount || !newDownPayment.description.trim()}
                      className="w-full bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(payment.amount)}</p>
                        </div>
                        <button
                          onClick={() => removeDownPayment(payment.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('price')}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('housing-credit')}
                  className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors"
                >
                  Devam Et
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
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  {planType === 'vehicle' 
                    ? 'Taşıt kredisi hesaplaması için gerekli API entegrasyonu henüz tamamlanmamıştır. Şimdilik manuel olarak kredi bilgilerini girebilirsiniz.'
                    : 'Konut kredisi hesaplaması için gerekli API entegrasyonu aktif değildir. Şimdilik manuel olarak kredi bilgilerini girebilirsiniz.'
                  }
                </p>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('down-payments')}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('personal-credits')}
                  className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors"
                >
                  {remainingAfterDownPayment > 0 ? 'İhtiyaç Kredisine Geç' : 'Devam Et'}
                </button>
              </div>
            </div>
          )}

          {/* Personal Credits Step */}
          {currentStep === 'personal-credits' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">İhtiyaç Kredileri</h2>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  İhtiyaç kredisi hesaplaması için gerekli API entegrasyonu henüz tamamlanmamıştır. Şimdilik manuel olarak kredi bilgilerini girebilirsiniz.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('housing-credit')}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('plan-summary')}
                  className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors"
                >
                  Plan Özetine Geç
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
              </div>

              {/* Save Plan */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Plan Bilgilerini Güncelle</h3>
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
                  disabled={!planName.trim() || saving}
                  className="mt-4 w-full sm:w-auto bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('personal-credits')}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
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

export default PaymentPlanEditPage;