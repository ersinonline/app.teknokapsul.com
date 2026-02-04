import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, CreditCard, DollarSign, Home, Building, Plus, Save, Trash2, Calculator, Car } from 'lucide-react';
import { db } from '../lib/firebase';
import type { AdditionalExpenseItem, AdditionalExpenses, DownPayment, MonthlyIncomeItem, PaymentPlan, SelectedCredit } from '../types';
import { formatCurrency } from '../utils';

type Step =
  | 'type'
  | 'price'
  | 'additional-expenses'
  | 'down-payments'
  | 'housing-credit'
  | 'personal-credits'
  | 'incomes'
  | 'plan-summary';

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

const getFunctionsBaseUrl = (): string => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'superapp-37db4';
  const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
  return import.meta.env.VITE_FUNCTIONS_BASE_URL || `https://${region}-${projectId}.cloudfunctions.net`;
};

const fetchCreditOffers = async (query: 'konut' | 'tasit' | 'ihtiyac', amount: number, term: number): Promise<CreditOffer[]> => {
  const baseUrl = getFunctionsBaseUrl();
  const response = await fetch(`${baseUrl}/creditBidProxy?query=${encodeURIComponent(query)}&price=${encodeURIComponent(String(amount))}&month=${encodeURIComponent(String(term))}`);
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
};

const generatePlanIdCandidate = (): string => {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `TK${digits}`;
};

const generateUniquePlanId = async (): Promise<string> => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generatePlanIdCandidate();
    const snap = await getDoc(doc(db, 'sharedPaymentPlans', candidate));
    if (!snap.exists()) return candidate;
  }
  return `TK${Date.now()}`;
};

const calculateAdditionalExpensesTotal = (expenses: Omit<AdditionalExpenses, 'total'>): number => {
  const customTotal = expenses.customExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  return (
    (expenses.titleDeedFee || 0) +
    (expenses.loanAllocationFee || 0) +
    (expenses.appraisalFee || 0) +
    (expenses.mortgageEstablishmentFee || 0) +
    (expenses.daskInsurancePremium || 0) +
    (expenses.revolvingFundFee || 0) +
    customTotal
  );
};

const calculateAdditionalExpenses = (housePrice: number, customExpenses: AdditionalExpenseItem[] = []): AdditionalExpenses => {
  const titleDeedFee = housePrice * 0.04;
  const loanAllocationFee = 13750;
  const appraisalFee = 33000;
  const mortgageEstablishmentFee = 3750;
  const daskInsurancePremium = 3000;
  const revolvingFundFee = 20000;
  const base: Omit<AdditionalExpenses, 'total'> = {
    titleDeedFee,
    loanAllocationFee,
    appraisalFee,
    mortgageEstablishmentFee,
    daskInsurancePremium,
    revolvingFundFee,
    customExpenses
  };
  return { ...base, total: calculateAdditionalExpensesTotal(base) };
};

const PaymentPlanNewPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [planType, setPlanType] = useState<'housing' | 'vehicle'>('housing');
  const [price, setPrice] = useState<number>(0);
  const [planName, setPlanName] = useState<string>('');

  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpenses | null>(null);
  const [newAdditionalExpense, setNewAdditionalExpense] = useState({ amount: 0, description: '' });

  const [downPayments, setDownPayments] = useState<DownPayment[]>([]);
  const [newDownPayment, setNewDownPayment] = useState({ amount: 0, description: '' });

  const [housingCredit, setHousingCredit] = useState<SelectedCredit | null>(null);
  const [housingDraft, setHousingDraft] = useState({ bankName: '', amount: 0, term: 120, monthlyPayment: 0 });

  const [personalCredits, setPersonalCredits] = useState<SelectedCredit[]>([]);
  const [personalDraft, setPersonalDraft] = useState({ bankName: '', amount: 0, term: 12, monthlyPayment: 0 });

  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncomeItem[]>([]);
  const [newMonthlyIncome, setNewMonthlyIncome] = useState({ amount: 0, description: '' });

  const [saving, setSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [housingCreditOffers, setHousingCreditOffers] = useState<CreditOffer[]>([]);
  const [personalCreditOffers, setPersonalCreditOffers] = useState<CreditOffer[]>([]);
  const [selectedHousingOfferKey, setSelectedHousingOfferKey] = useState<string | null>(null);
  const [selectedPersonalOfferKey, setSelectedPersonalOfferKey] = useState<string | null>(null);

  useEffect(() => {
    if (planType !== 'housing') {
      setAdditionalExpenses(null);
      return;
    }
    if (!price || price <= 0) {
      setAdditionalExpenses(null);
      return;
    }
    setAdditionalExpenses(prev => calculateAdditionalExpenses(price, prev?.customExpenses || []));
  }, [planType, price]);

  const additionalExpensesTotal = planType === 'housing' ? (additionalExpenses?.total || 0) : 0;
  const targetTotal = planType === 'housing' ? price + additionalExpensesTotal : price;

  const totalDownPayment = useMemo(() => downPayments.reduce((sum, dp) => sum + dp.amount, 0), [downPayments]);
  const totalPersonalCreditAmount = useMemo(() => personalCredits.reduce((sum, c) => sum + c.amount, 0), [personalCredits]);
  const totalPersonalCreditMonthly = useMemo(() => personalCredits.reduce((sum, c) => sum + c.monthlyPayment, 0), [personalCredits]);
  const totalMonthlyIncome = useMemo(() => monthlyIncomes.reduce((sum, i) => sum + i.amount, 0), [monthlyIncomes]);
  const housingCreditAmount = housingCredit?.amount || 0;
  const housingCreditMonthly = housingCredit?.monthlyPayment || 0;

  const totalPayments = totalDownPayment + housingCreditAmount + totalPersonalCreditAmount;
  const remainingAmount = targetTotal - totalPayments;
  const remainingAfterDownPayment = targetTotal - totalDownPayment;
  const remainingAfterHousingCredit = targetTotal - totalDownPayment - housingCreditAmount;
  const isExactMatch = Math.abs(remainingAmount) < 1;
  const totalMonthlyPayment = housingCreditMonthly + totalPersonalCreditMonthly;

  const calculatePeriodicPayments = () => {
    const allCredits = [housingCredit, ...personalCredits].filter(Boolean) as SelectedCredit[];
    const valid = allCredits.filter(c => c.monthlyPayment > 0 && c.term > 0);
    if (valid.length === 0) return [];

    const endMonths = Array.from(new Set(valid.map(c => c.term))).sort((a, b) => a - b);
    const periods: Array<{ startMonth: number; endMonth: number; monthlyPayment: number; description: string }> = [];

    for (let i = 0; i < endMonths.length; i++) {
      const startMonth = i === 0 ? 1 : endMonths[i - 1] + 1;
      const endMonth = endMonths[i];
      const active = valid.filter(c => c.term >= startMonth);
      if (active.length === 0) continue;
      const monthlyPayment = active.reduce((sum, c) => sum + c.monthlyPayment, 0);
      periods.push({
        startMonth,
        endMonth,
        monthlyPayment,
        description: i === 0 ? `İlk ${endMonth} ay` : `${startMonth}. aydan ${endMonth}. aya kadar`
      });
    }
    return periods;
  };

  const periodicPayments = useMemo(() => calculatePeriodicPayments(), [housingCredit, personalCredits]);
  const maxCreditTerm = useMemo(() => Math.max(housingCredit?.term || 0, ...personalCredits.map(c => c.term)), [housingCredit, personalCredits]);
  const firstYearEndMonth = Math.min(12, maxCreditTerm || 12);
  const isFixedPaymentFullTerm = periodicPayments.length > 0
    ? periodicPayments[0].startMonth === 1 &&
      periodicPayments[periodicPayments.length - 1].endMonth === maxCreditTerm &&
      periodicPayments.every(p => p.monthlyPayment === periodicPayments[0].monthlyPayment)
    : false;
  const isFixedPaymentFirstYear = !isFixedPaymentFullTerm && periodicPayments.length > 0
    ? periodicPayments[0].startMonth === 1 &&
      periodicPayments[0].endMonth >= firstYearEndMonth &&
      (periodicPayments.length === 1 || periodicPayments[1].startMonth > firstYearEndMonth)
    : false;
  const fixedPaymentLabel = isFixedPaymentFullTerm
    ? `Sabit Ödemeli (${maxCreditTerm} Ay)`
    : isFixedPaymentFirstYear
    ? `Sabit Ödemeli (İlk ${firstYearEndMonth} Ay)`
    : null;

  const updateAdditionalExpenseField = (field: keyof Omit<AdditionalExpenses, 'customExpenses' | 'total'>, value: number) => {
    setAdditionalExpenses(prev => {
      const current = prev ?? calculateAdditionalExpenses(price, []);
      const next = { ...current, [field]: value } as AdditionalExpenses;
      const total = calculateAdditionalExpensesTotal({
        titleDeedFee: next.titleDeedFee,
        loanAllocationFee: next.loanAllocationFee,
        appraisalFee: next.appraisalFee,
        mortgageEstablishmentFee: next.mortgageEstablishmentFee,
        daskInsurancePremium: next.daskInsurancePremium,
        revolvingFundFee: next.revolvingFundFee,
        customExpenses: next.customExpenses
      });
      return { ...next, total };
    });
  };

  const addCustomAdditionalExpense = () => {
    if (!newAdditionalExpense.amount || !newAdditionalExpense.description.trim()) return;
    setAdditionalExpenses(prev => {
      const current = prev ?? calculateAdditionalExpenses(price, []);
      const customExpenses = [
        ...current.customExpenses,
        { id: Date.now().toString(), amount: newAdditionalExpense.amount, description: newAdditionalExpense.description.trim() }
      ];
      return calculateAdditionalExpenses(price, customExpenses);
    });
    setNewAdditionalExpense({ amount: 0, description: '' });
  };

  const removeCustomAdditionalExpense = (id: string) => {
    setAdditionalExpenses(prev => {
      if (!prev) return prev;
      const customExpenses = prev.customExpenses.filter(item => item.id !== id);
      return calculateAdditionalExpenses(price, customExpenses);
    });
  };

  const addDownPayment = () => {
    if (!newDownPayment.amount || !newDownPayment.description.trim()) return;
    setDownPayments(prev => [...prev, { id: Date.now().toString(), amount: newDownPayment.amount, description: newDownPayment.description.trim() }]);
    setNewDownPayment({ amount: 0, description: '' });
  };

  const removeDownPayment = (id: string) => setDownPayments(prev => prev.filter(p => p.id !== id));

  const loadHousingCreditOffers = async () => {
    if (!housingDraft.amount || !housingDraft.term) return;
    setIsCalculating(true);
    setHousingCreditOffers([]);
    setSelectedHousingOfferKey(null);
    try {
      const query = planType === 'vehicle' ? 'tasit' : 'konut';
      const offers = await fetchCreditOffers(query, housingDraft.amount, housingDraft.term);
      setHousingCreditOffers(offers);
      if (offers.length === 0) {
        alert('Teklif bulunamadı. Lütfen tutar/vade değerlerini kontrol edin.');
      }
    } catch {
      alert('Kredi teklifleri alınırken hata oluştu.');
    } finally {
      setIsCalculating(false);
    }
  };

  const selectHousingOffer = (offer: CreditOffer) => {
    setSelectedHousingOfferKey(`${offer.bankCode}-${offer.interestRate}`);
    const totalPayment = offer.totalPayment || (offer.monthlyPayment * housingDraft.term);
    setHousingCredit({
      id: 'housing-credit',
      type: planType === 'vehicle' ? 'tasit' : 'konut',
      bankName: offer.bankName,
      amount: housingDraft.amount,
      term: housingDraft.term,
      monthlyPayment: offer.monthlyPayment,
      totalPayment
    });
  };

  const loadPersonalCreditOffers = async () => {
    if (!personalDraft.amount || !personalDraft.term) return;
    setIsCalculating(true);
    setPersonalCreditOffers([]);
    setSelectedPersonalOfferKey(null);
    try {
      const offers = await fetchCreditOffers('ihtiyac', personalDraft.amount, personalDraft.term);
      setPersonalCreditOffers(offers);
      if (offers.length === 0) {
        alert('Teklif bulunamadı. Lütfen tutar/vade değerlerini kontrol edin.');
      }
    } catch {
      alert('Kredi teklifleri alınırken hata oluştu.');
    } finally {
      setIsCalculating(false);
    }
  };

  const addPersonalCreditFromOffer = (offer: CreditOffer) => {
    if (!personalDraft.amount || !personalDraft.term) return;
    setSelectedPersonalOfferKey(`${offer.bankCode}-${offer.interestRate}`);
    const totalPayment = offer.totalPayment || (offer.monthlyPayment * personalDraft.term);
    setPersonalCredits(prev => [
      ...prev,
      {
        id: `personal-${Date.now()}`,
        type: 'ihtiyac',
        bankName: offer.bankName,
        amount: personalDraft.amount,
        term: personalDraft.term,
        monthlyPayment: offer.monthlyPayment,
        totalPayment
      }
    ]);
    setPersonalDraft({ bankName: '', amount: 0, term: 12, monthlyPayment: 0 });
    setPersonalCreditOffers([]);
  };

  const removePersonalCredit = (id: string) => setPersonalCredits(prev => prev.filter(c => c.id !== id));

  const addMonthlyIncome = () => {
    if (!newMonthlyIncome.amount || !newMonthlyIncome.description.trim()) return;
    setMonthlyIncomes(prev => [...prev, { id: Date.now().toString(), amount: newMonthlyIncome.amount, description: newMonthlyIncome.description.trim() }]);
    setNewMonthlyIncome({ amount: 0, description: '' });
  };

  const removeMonthlyIncome = (id: string) => setMonthlyIncomes(prev => prev.filter(i => i.id !== id));

  const savePlan = async () => {
    if (!planName.trim()) return;
    if (!isExactMatch) return;
    setSaving(true);
    try {
      const additionalExpensesToSave = planType === 'housing' ? (additionalExpenses ?? calculateAdditionalExpenses(price)) : undefined;

      const plan: Omit<PaymentPlan, 'id'> = {
        name: planName.trim(),
        type: planType,
        price,
        downPayments,
        housingCredit,
        personalCredits,
        monthlyIncomes,
        totalMonthlyPayment,
        additionalExpenses: additionalExpensesToSave,
        createdAt: serverTimestamp()
      };

      try {
        const planId = await generateUniquePlanId();
        await setDoc(doc(db, 'sharedPaymentPlans', planId), { ...plan, planId });
        navigate(`/plan/${planId}`);
      } catch {
        alert('Plan kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSaving(false);
    }
  };

  const steps = useMemo(() => {
    const list: Array<{ key: Step; label: string; icon: React.ComponentType<{ className?: string }> }> = [
      { key: 'type', label: 'Tip', icon: planType === 'vehicle' ? Car : Home },
      { key: 'price', label: planType === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti', icon: DollarSign }
    ];
    if (planType === 'housing') list.push({ key: 'additional-expenses', label: 'Ek Masraflar', icon: DollarSign });
    list.push(
      { key: 'down-payments', label: 'Peşinat', icon: CreditCard },
      { key: 'housing-credit', label: planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi', icon: Building },
      { key: 'personal-credits', label: 'İhtiyaç Kredisi', icon: Calculator },
      { key: 'incomes', label: 'Gelirler', icon: DollarSign },
      { key: 'plan-summary', label: 'Özet', icon: CheckCircle }
    );
    return list;
  }, [planType]);

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-sm text-gray-600">Ana Sayfa</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">{currentIndex + 1}/{steps.length}</div>
            <div className="text-sm font-semibold text-gray-900">{steps[currentIndex]?.label}</div>
          </div>

          {currentStep === 'type' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Tipi</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setPlanType('housing')}
                  className={`p-4 rounded-xl border text-left ${planType === 'housing' ? 'border-[#ffb700] bg-[#fffbeb]' : 'border-gray-200 bg-white'}`}
                >
                  <div className="font-semibold text-gray-900">Konut</div>
                  <div className="text-sm text-gray-600">Ev alımı için plan</div>
                </button>
                <button
                  onClick={() => setPlanType('vehicle')}
                  className={`p-4 rounded-xl border text-left ${planType === 'vehicle' ? 'border-[#ffb700] bg-[#fffbeb]' : 'border-gray-200 bg-white'}`}
                >
                  <div className="font-semibold text-gray-900">Araç</div>
                  <div className="text-sm text-gray-600">Araç alımı için plan</div>
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep('price')}
                  className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]"
                >
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'price' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{planType === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti'}</h2>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL)</label>
              <input
                type="number"
                inputMode="numeric"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                placeholder="Örn: 3000000"
              />
              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('type')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep(planType === 'housing' ? 'additional-expenses' : 'down-payments')}
                  className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]"
                >
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'additional-expenses' && planType === 'housing' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ek Masraflar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tapu Masrafı (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.titleDeedFee || ''}
                    onChange={(e) => updateAdditionalExpenseField('titleDeedFee', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tahsis Ücreti (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.loanAllocationFee || ''}
                    onChange={(e) => updateAdditionalExpenseField('loanAllocationFee', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ekspertiz Ücreti (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.appraisalFee || ''}
                    onChange={(e) => updateAdditionalExpenseField('appraisalFee', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İpotek Tesis Ücreti (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.mortgageEstablishmentFee || ''}
                    onChange={(e) => updateAdditionalExpenseField('mortgageEstablishmentFee', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DASK Sigorta Primi (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.daskInsurancePremium || ''}
                    onChange={(e) => updateAdditionalExpenseField('daskInsurancePremium', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Döner Sermaye Bedeli (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={additionalExpenses?.revolvingFundFee || ''}
                    onChange={(e) => updateAdditionalExpenseField('revolvingFundFee', Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-xl border bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 font-medium">Toplam Ek Masraf</div>
                  <div className="text-lg font-semibold text-[#ffb700]">{formatCurrency(additionalExpenses?.total || 0)}</div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="font-semibold text-gray-900 mb-3">Diğer Ek Masraflar</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newAdditionalExpense.amount || ''}
                    onChange={(e) => setNewAdditionalExpense({ ...newAdditionalExpense, amount: Number(e.target.value) })}
                    className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    placeholder="Tutar"
                  />
                  <input
                    value={newAdditionalExpense.description}
                    onChange={(e) => setNewAdditionalExpense({ ...newAdditionalExpense, description: e.target.value })}
                    className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    placeholder="Açıklama"
                  />
                  <button
                    onClick={addCustomAdditionalExpense}
                    disabled={!newAdditionalExpense.amount || !newAdditionalExpense.description.trim()}
                    className="bg-[#ffb700] text-white px-4 py-3 rounded-xl hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ekle
                  </button>
                </div>

                {(additionalExpenses?.customExpenses?.length || 0) > 0 && (
                  <div className="mt-4 space-y-2">
                    {additionalExpenses!.customExpenses.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white rounded-xl p-3 border">
                        <div>
                          <div className="font-medium text-gray-900">{item.description}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(item.amount)}</div>
                        </div>
                        <button onClick={() => removeCustomAdditionalExpense(item.id)} className="text-red-600 p-2 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('price')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
                  Geri
                </button>
                <button onClick={() => setCurrentStep('down-payments')} className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]">
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'down-payments' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Peşinatlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={newDownPayment.amount || ''}
                  onChange={(e) => setNewDownPayment({ ...newDownPayment, amount: Number(e.target.value) })}
                  className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder="Tutar"
                />
                <input
                  value={newDownPayment.description}
                  onChange={(e) => setNewDownPayment({ ...newDownPayment, description: e.target.value })}
                  className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder="Açıklama"
                />
                <button
                  onClick={addDownPayment}
                  disabled={!newDownPayment.amount || !newDownPayment.description.trim()}
                  className="bg-[#ffb700] text-white px-4 py-3 rounded-xl hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </button>
              </div>

              {downPayments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {downPayments.map((dp) => (
                    <div key={dp.id} className="flex items-center justify-between bg-white rounded-xl p-3 border">
                      <div>
                        <div className="font-medium text-gray-900">{dp.description}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(dp.amount)}</div>
                      </div>
                      <button onClick={() => removeDownPayment(dp.id)} className="text-red-600 p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl border bg-gray-50 p-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Toplam Peşinat</div>
                <div className="text-lg font-semibold text-green-700">{formatCurrency(totalDownPayment)}</div>
              </div>

              <div className="mt-3 rounded-xl border bg-white p-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Kalan Tutar</div>
                <div className={`text-lg font-semibold ${remainingAfterDownPayment > 0 ? 'text-red-700' : remainingAfterDownPayment < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {formatCurrency(Math.abs(remainingAfterDownPayment))}{remainingAfterDownPayment < 0 ? ' (Fazla)' : remainingAfterDownPayment > 0 ? ' (Eksik)' : ''}
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(planType === 'housing' ? 'additional-expenses' : 'price')}
                  className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600"
                >
                  Geri
                </button>
                <button onClick={() => setCurrentStep('housing-credit')} className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]">
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'housing-credit' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</h2>
              <div className="mb-4 rounded-xl border bg-white p-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Kalan Tutar</div>
                <div className={`text-lg font-semibold ${remainingAfterHousingCredit > 0 ? 'text-red-700' : remainingAfterHousingCredit < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {formatCurrency(Math.abs(remainingAfterHousingCredit))}{remainingAfterHousingCredit < 0 ? ' (Fazla)' : remainingAfterHousingCredit > 0 ? ' (Eksik)' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={housingDraft.amount || ''}
                    onChange={(e) => setHousingDraft({ ...housingDraft, amount: Number(e.target.value) })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={housingDraft.term || ''}
                    onChange={(e) => setHousingDraft({ ...housingDraft, term: Number(e.target.value) })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={loadHousingCreditOffers} disabled={isCalculating || housingDraft.amount <= 0 || housingDraft.term <= 0} className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCalculating ? 'Hesaplanıyor...' : 'Teklifleri Getir'}
                </button>
                <div className="hidden sm:block" />
                <button
                  onClick={() => {
                    setHousingCredit(null);
                    setHousingCreditOffers([]);
                    setSelectedHousingOfferKey(null);
                    setHousingDraft({ bankName: '', amount: 0, term: 120, monthlyPayment: 0 });
                  }}
                  className="bg-gray-100 text-gray-900 px-5 py-3 rounded-xl hover:bg-gray-200"
                >
                  Temizle
                </button>
              </div>

              {housingCreditOffers.length > 0 && (
                <div className="mt-4 bg-white rounded-xl border p-3 sm:p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Kredi Teklifleri</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {housingCreditOffers.map((offer) => (
                      <button
                        key={`${offer.bankCode}-${offer.interestRate}`}
                        onClick={() => selectHousingOffer(offer)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          selectedHousingOfferKey === `${offer.bankCode}-${offer.interestRate}`
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'hover:border-[#ffb700] hover:bg-[#fffbeb]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{offer.bankName}</div>
                            <div className="text-xs text-gray-600 mt-1">Faiz: {offer.interestRate} • Vade: {housingDraft.term} ay</div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(offer.monthlyPayment)}/ay</div>
                            <div className="text-xs text-gray-600">{formatCurrency(offer.totalPayment)} toplam</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {housingCredit && (
                <div className="mt-4 p-4 rounded-xl border bg-emerald-50 border-emerald-200">
                  <div className="font-semibold text-gray-900">{housingCredit.bankName}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    {formatCurrency(housingCredit.amount)} • {housingCredit.term} ay • {formatCurrency(housingCredit.monthlyPayment)}/ay
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('down-payments')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
                  Geri
                </button>
                <button onClick={() => setCurrentStep('personal-credits')} className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]">
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'personal-credits' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">İhtiyaç Kredileri</h2>
              <div className="mb-4 rounded-xl border bg-white p-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Kalan Tutar</div>
                <div className={`text-lg font-semibold ${remainingAmount > 0 ? 'text-red-700' : remainingAmount < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {formatCurrency(Math.abs(remainingAmount))}{remainingAmount < 0 ? ' (Fazla)' : remainingAmount > 0 ? ' (Eksik)' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kredi Tutarı (TL)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={personalDraft.amount || ''}
                    onChange={(e) => setPersonalDraft({ ...personalDraft, amount: Number(e.target.value) })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={personalDraft.term || ''}
                    onChange={(e) => setPersonalDraft({ ...personalDraft, term: Number(e.target.value) })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={loadPersonalCreditOffers}
                  disabled={isCalculating || personalDraft.amount <= 0 || personalDraft.term <= 0}
                  className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? 'Hesaplanıyor...' : 'Teklifleri Getir'}
                </button>
                <button
                  onClick={() => {
                    setPersonalCreditOffers([]);
                    setSelectedPersonalOfferKey(null);
                  }}
                  className="bg-gray-100 text-gray-900 px-5 py-3 rounded-xl hover:bg-gray-200"
                >
                  Teklifleri Temizle
                </button>
              </div>

              {personalCreditOffers.length > 0 && (
                <div className="mt-4 bg-white rounded-xl border p-3 sm:p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Kredi Teklifleri</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {personalCreditOffers.map((offer) => (
                      <button
                        key={`${offer.bankCode}-${offer.interestRate}`}
                        onClick={() => addPersonalCreditFromOffer(offer)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          selectedPersonalOfferKey === `${offer.bankCode}-${offer.interestRate}`
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'hover:border-[#ffb700] hover:bg-[#fffbeb]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{offer.bankName}</div>
                            <div className="text-xs text-gray-600 mt-1">Faiz: {offer.interestRate} • Vade: {personalDraft.term} ay</div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(offer.monthlyPayment)}/ay</div>
                            <div className="text-xs text-gray-600">{formatCurrency(offer.totalPayment)} toplam</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {personalCredits.length > 0 && (
                <div className="mt-4 space-y-2">
                  {personalCredits.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-white rounded-xl p-3 border">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{c.bankName}</div>
                        <div className="text-sm text-gray-700">
                          {formatCurrency(c.amount)} • {c.term} ay • {formatCurrency(c.monthlyPayment)}/ay
                        </div>
                      </div>
                      <button onClick={() => removePersonalCredit(c.id)} className="text-red-600 p-2 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('housing-credit')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
                  Geri
                </button>
                <button onClick={() => setCurrentStep('incomes')} className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]">
                  Devam
                </button>
              </div>
            </div>
          )}

          {currentStep === 'incomes' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gelirler</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={newMonthlyIncome.amount || ''}
                  onChange={(e) => setNewMonthlyIncome({ ...newMonthlyIncome, amount: Number(e.target.value) })}
                  className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder="Tutar"
                />
                <input
                  value={newMonthlyIncome.description}
                  onChange={(e) => setNewMonthlyIncome({ ...newMonthlyIncome, description: e.target.value })}
                  className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder="Açıklama"
                />
                <button
                  onClick={addMonthlyIncome}
                  disabled={!newMonthlyIncome.amount || !newMonthlyIncome.description.trim()}
                  className="bg-[#ffb700] text-white px-4 py-3 rounded-xl hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </button>
              </div>

              {(monthlyIncomes.length > 0) && (
                <div className="mt-4 space-y-2">
                  {monthlyIncomes.map((income) => (
                    <div key={income.id} className="flex items-center justify-between bg-white rounded-xl p-3 border">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{income.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-emerald-700 whitespace-nowrap">{formatCurrency(income.amount)}</div>
                        <button onClick={() => removeMonthlyIncome(income.id)} className="text-red-600 p-2 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-xl border bg-emerald-50 p-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-emerald-900">Toplam Aylık Gelir</div>
                    <div className="text-lg font-semibold text-emerald-900">{formatCurrency(totalMonthlyIncome)}</div>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-xl border bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">Toplam Aylık Taksit</div>
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(totalMonthlyPayment)}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">Gelir - Taksit (En Yüksek)</div>
                  <div className={`text-lg font-semibold ${(totalMonthlyIncome - (periodicPayments.reduce((m, p) => Math.max(m, p.monthlyPayment), 0))) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(totalMonthlyIncome - (periodicPayments.reduce((m, p) => Math.max(m, p.monthlyPayment), 0)))}
                  </div>
                </div>
                {fixedPaymentLabel && (
                  <div className="mt-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 inline-block">
                    {fixedPaymentLabel}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('personal-credits')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
                  Geri
                </button>
                <button onClick={() => setCurrentStep('plan-summary')} className="bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] active:bg-[#d49400]">
                  Özet
                </button>
              </div>
            </div>
          )}

          {currentStep === 'plan-summary' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Özeti</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600">{planType === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti'}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(price)}</div>
                </div>
                {planType === 'housing' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600">Ek Masraflar</div>
                    <div className="text-lg font-semibold text-purple-700">{formatCurrency(additionalExpensesTotal)}</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Toplam Peşinat</div>
                  <div className="text-lg font-semibold text-green-700">{formatCurrency(totalDownPayment)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600">{planType === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
                  <div className="text-lg font-semibold text-blue-700">{formatCurrency(housingCreditAmount)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600">İhtiyaç Kredileri</div>
                  <div className="text-lg font-semibold text-orange-700">{formatCurrency(totalPersonalCreditAmount)}</div>
                </div>
                {monthlyIncomes.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600">Toplam Aylık Gelir</div>
                    <div className="text-lg font-semibold text-emerald-700">{formatCurrency(totalMonthlyIncome)}</div>
                  </div>
                )}
              </div>

              <div className={`mt-4 p-4 rounded-xl border-2 ${
                isExactMatch ? 'bg-emerald-50 border-emerald-200' : remainingAmount < 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Toplam Ödeme</div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(totalPayments)}</div>
                    <div className="text-sm text-gray-600">Hedef: {formatCurrency(targetTotal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">Durum</div>
                    <div className={`text-lg font-semibold ${isExactMatch ? 'text-emerald-700' : remainingAmount < 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                      {isExactMatch ? '✓ Tam Eşit' : remainingAmount < 0 ? `⚠ ${formatCurrency(Math.abs(remainingAmount))} Fazla` : `⚠ ${formatCurrency(remainingAmount)} Eksik`}
                    </div>
                  </div>
                </div>
              </div>

              {fixedPaymentLabel && (
                <div className="mt-4 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 inline-block">
                  {fixedPaymentLabel}
                </div>
              )}

              <div className="mt-6 bg-white rounded-xl border p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Adı *</label>
                <input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  placeholder={`Örn: ${planType === 'vehicle' ? 'Araç' : 'Ev'} Alım Planı`}
                />

                <button
                  onClick={savePlan}
                  disabled={!planName.trim() || saving || !isExactMatch}
                  className="mt-4 w-full bg-[#ffb700] text-white px-5 py-3 rounded-xl hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Kaydediliyor...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Planı Kaydet
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setCurrentStep('incomes')} className="bg-gray-500 text-white px-5 py-3 rounded-xl hover:bg-gray-600">
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
