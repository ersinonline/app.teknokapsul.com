import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Home, Car, CreditCard, Building, Calculator, ArrowLeft, Edit, Share, Download, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DownPayment {
  id: string;
  amount: number;
  description: string;
}

interface MonthlyIncomeItem {
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

interface AdditionalExpenseItem {
  id: string;
  amount: number;
  description: string;
}

interface AdditionalExpenses {
  titleDeedFee: number;
  loanAllocationFee: number;
  appraisalFee: number;
  mortgageEstablishmentFee: number;
  daskInsurancePremium: number;
  revolvingFundFee: number;
  customExpenses?: AdditionalExpenseItem[];
  total: number;
}

interface PaymentPlan {
  id: string;
  name: string;
  type: 'housing' | 'vehicle';
  price: number;
  downPayments: DownPayment[];
  housingCredit: SelectedCredit | null;
  personalCredits: SelectedCredit[];
  monthlyIncomes?: MonthlyIncomeItem[];
  monthlyPayments: any[];
  totalMonthlyPayment: number;
  additionalExpenses?: AdditionalExpenses;
  createdAt: any;
  sharedWith: string | null;
  userId: string;
}

const PaymentPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) {
        setError('Plan ID bulunamadı');
        setLoading(false);
        return;
      }

      try {
        let planData: PaymentPlan | null = null;
        
        // Önce kullanıcının kendi planlarından ara (eğer giriş yapmışsa)
        if (user) {
          const userDocRef = doc(db, `teknokapsul/${user.uid}/paymentPlans`, id);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            planData = { id: userDocSnap.id, ...userDocSnap.data() } as PaymentPlan;
          }
        }
        
        // Eğer kullanıcının planlarında bulunamazsa, paylaşılan planlardan ara
        if (!planData) {
          const sharedDocRef = doc(db, 'sharedPaymentPlans', id);
          const sharedDocSnap = await getDoc(sharedDocRef);
          
          if (sharedDocSnap.exists()) {
            planData = { id: sharedDocSnap.id, ...sharedDocSnap.data() } as PaymentPlan;
          }
        }
        
        if (planData) {
          setPlan(planData);
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate periodic payment schedule
  const calculatePeriodicPayments = (plan: PaymentPlan) => {

    
    // Get all credits with their terms
    const allCredits = [];
    
    if (plan.housingCredit) {
      allCredits.push({
        ...plan.housingCredit,
        name: plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'
      });
    }
    
    plan.personalCredits.forEach((credit, index) => {
      allCredits.push({
        ...credit,
        name: `İhtiyaç Kredisi ${index + 1} (${credit.bankName})`
      });
    });
    
    // Sort credits by term (shortest first)
    allCredits.sort((a, b) => a.term - b.term);
    
    // Calculate payment periods
    const periods = [];

    
    for (let i = 0; i < allCredits.length; i++) {
      const credit = allCredits[i];
      const endMonth = credit.term;
      
      // Calculate total payment for this period
      let periodPayment = 0;
      let activeCredits = [];
      
      for (const c of allCredits) {
        if (c.term >= endMonth) {
          periodPayment += c.monthlyPayment;
          activeCredits.push(c.name);
        }
      }
      
      if (i === 0) {
        periods.push({
          startMonth: 1,
          endMonth: endMonth,
          monthlyPayment: periodPayment,
          activeCredits: activeCredits,
          description: `İlk ${endMonth} ay`
        });
      } else {
        const prevEndMonth = allCredits[i - 1].term;
        if (endMonth > prevEndMonth) {
          periods.push({
            startMonth: prevEndMonth + 1,
            endMonth: endMonth,
            monthlyPayment: periodPayment,
            activeCredits: activeCredits,
            description: `${prevEndMonth + 1}. aydan ${endMonth}. aya kadar`
          });
        }
      }
    }
    
    return periods;
  };

  const periodicPayments = plan ? calculatePeriodicPayments(plan) : [];
  const maxCreditTerm = plan ? Math.max(plan.housingCredit?.term || 0, ...plan.personalCredits.map(c => c.term)) : 0;
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

  const calculateAdditionalExpensesTotal = (expenses: Omit<AdditionalExpenses, 'total'>): number => {
    const customExpenses = expenses.customExpenses || [];
    const customTotal = customExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
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

  const normalizeAdditionalExpenses = (housePrice: number, expenses?: Partial<AdditionalExpenses> | null): AdditionalExpenses => {
    if (!expenses) return calculateAdditionalExpenses(housePrice, []);
    const customExpenses = Array.isArray((expenses as any).customExpenses) ? ((expenses as any).customExpenses as AdditionalExpenseItem[]) : [];
    const normalized: Omit<AdditionalExpenses, 'total'> = {
      titleDeedFee: Number((expenses as any).titleDeedFee ?? housePrice * 0.04),
      loanAllocationFee: Number((expenses as any).loanAllocationFee ?? 13750),
      appraisalFee: Number((expenses as any).appraisalFee ?? 33000),
      mortgageEstablishmentFee: Number((expenses as any).mortgageEstablishmentFee ?? 3750),
      daskInsurancePremium: Number((expenses as any).daskInsurancePremium ?? 3000),
      revolvingFundFee: Number((expenses as any).revolvingFundFee ?? 20000),
      customExpenses
    };
    const total = Number((expenses as any).total ?? calculateAdditionalExpensesTotal(normalized));
    return { ...normalized, total };
  };

  const handleEdit = () => {
    navigate(`/payment-plan/${id}/edit`);
  };

  const handleShare = async () => {
    try {
      if (!plan) {
        alert('Plan bulunamadı!');
        return;
      }

      // Planı paylaşılan planlar koleksiyonuna kaydet
      const sharedPlanRef = doc(db, 'sharedPaymentPlans', id!);
      await setDoc(sharedPlanRef, {
        ...plan,
        sharedAt: new Date(),
        sharedBy: user?.uid || 'anonymous'
      });

      const shareUrl = `${window.location.origin}/payment-plan/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Plan başarıyla paylaşıldı! Link panoya kopyalandı. Bu linki paylaşarak herkese planınızı görüntüleme imkanı sağlayabilirsiniz.');
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      // Fallback: Show the URL in a prompt
      const shareUrl = `${window.location.origin}/payment-plan/${id}`;
      prompt('Plan linkini kopyalayın:', shareUrl);
    }
  };

  const handleDownload = async () => {
    if (!plan) return;
    
    try {
      // Calculate totals
      const totalDownPayment = plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0);

      const pageWidthPx = 794;
      const pageHeightPx = Math.floor((pageWidthPx * 297) / 210);
      const pagePaddingPx = 32;

      const source = document.createElement('div');
      source.style.position = 'absolute';
      source.style.left = '-9999px';
      source.style.top = '0';
      source.style.width = `${pageWidthPx}px`;
      source.style.backgroundColor = 'white';
      source.style.fontFamily = 'Arial, sans-serif';
      source.style.color = '#111827';

      source.innerHTML = `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px;">
            <div style="display:flex; align-items:center; gap: 10px;">
              <div style="width:12px; height:12px; background:#ffb700; border-radius:999px;"></div>
              <div style="font-weight:700; font-size:16px; color:#111827;">TeknoTech</div>
            </div>
            <div style="font-size:11px; color:#6b7280;">${formatDate(plan.createdAt)}</div>
          </div>
          <div style="text-align:left;">
            <div style="font-size:22px; font-weight:800; color:#111827; line-height: 1.15;">Ödeme Planı</div>
            <div style="font-size:14px; color:#374151; margin-top: 4px;">${plan.name}</div>
          </div>
        </div>

        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
              <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">${plan.type === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti'}</div>
              <div style="font-size: 18px; font-weight: 800; color:#111827;">${formatCurrency(plan.price)}</div>
            </div>
            <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
              <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">Toplam Peşinat</div>
              <div style="font-size: 18px; font-weight: 800; color:#16a34a;">${formatCurrency(totalDownPayment)}</div>
            </div>
            <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
              <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">Aylık Ödeme</div>
              <div style="font-size: 18px; font-weight: 800; color:#dc2626;">${formatCurrency(plan.totalMonthlyPayment)}</div>
            </div>
          </div>
        </div>
        
        ${plan.downPayments.length > 0 ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Peşinat Detayları</div>
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
              ${plan.downPayments.map(dp => `
                <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                  <div style="font-size: 12px; color:#111827;">${dp.description}</div>
                  <div style="font-size: 12px; font-weight: 700; color:#111827; white-space: nowrap;">${formatCurrency(dp.amount)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${plan.housingCredit ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">${plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
            <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color:#111827;">
                <div><strong>Banka:</strong> ${plan.housingCredit.bankName}</div>
                <div><strong>Kredi Tutarı:</strong> ${formatCurrency(plan.housingCredit.amount)}</div>
                <div><strong>Faiz Oranı:</strong> ${plan.housingCredit.interestRate}%</div>
                <div><strong>Vade:</strong> ${plan.housingCredit.term} Ay</div>
                <div><strong>Aylık Taksit:</strong> ${formatCurrency(plan.housingCredit.monthlyPayment)}</div>
                <div><strong>Toplam Ödeme:</strong> ${formatCurrency(plan.housingCredit.totalPayment)}</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${plan.personalCredits.length > 0 ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">İhtiyaç Kredileri</div>
            ${plan.personalCredits.map(credit => `
              <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-bottom: 8px;">
                  <div style="font-weight: 800; font-size: 12px; color:#111827;">${credit.bankName}</div>
                  <div style="font-weight: 800; font-size: 12px; color:#ea580c; white-space: nowrap;">${formatCurrency(credit.amount)}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color:#111827;">
                  <div><strong>Faiz Oranı:</strong> ${credit.interestRate}%</div>
                  <div><strong>Vade:</strong> ${credit.term} Ay</div>
                  <div><strong>Aylık Taksit:</strong> ${formatCurrency(credit.monthlyPayment)}</div>
                  <div><strong>Toplam Ödeme:</strong> ${formatCurrency(credit.totalPayment)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(() => {
          const incomes = plan.monthlyIncomes || [];
          if (incomes.length === 0) return '';
          const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
          return `
            <div class="pdf-section" style="margin-bottom: 18px;">
              <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Aylık Gelirler</div>
              <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                ${incomes.map(income => `
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; color:#111827;">${income.description}</div>
                    <div style="font-size: 12px; font-weight: 800; color:#111827; white-space: nowrap;">${formatCurrency(income.amount)}</div>
                  </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px; background: #ecfdf5;">
                  <div style="font-size: 12px; font-weight: 900; color:#111827;">Toplam Aylık Gelir</div>
                  <div style="font-size: 12px; font-weight: 900; color:#111827; white-space: nowrap;">${formatCurrency(totalIncome)}</div>
                </div>
              </div>
            </div>
            ${periodicPayments.length > 0 ? `
              <div class="pdf-section" style="margin-bottom: 18px;">
                <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Gelir / Taksit Uygunluğu</div>
                <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                  ${periodicPayments.map((p) => {
                    const diff = totalIncome - p.monthlyPayment;
                    const ok = diff >= 0;
                    return `
                      <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                        <div style="font-size: 12px; color:#111827;">
                          <div style="font-weight: 800;">${p.description}</div>
                          <div style="font-size: 11px; color:#6b7280; margin-top: 2px;">${p.startMonth}. ay - ${p.endMonth}. ay</div>
                        </div>
                        <div style="text-align: right;">
                          <div style="font-size: 12px; color:#6b7280;">Gelir - Taksit</div>
                          <div style="font-size: 12px; font-weight: 900; color:${ok ? '#047857' : '#b91c1c'};">${formatCurrency(diff)} ${ok ? '(Yeterli)' : '(Yetersiz)'}</div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          `;
        })()}
        
        ${periodicPayments.length > 0 ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">
              <div style="font-size: 14px; font-weight: 800; color:#111827;">Dönemsel Ödeme Planı</div>
              ${fixedPaymentLabel ? `<div style="font-size: 11px; font-weight: 800; color:#047857; background:#ecfdf5; border:1px solid #a7f3d0; padding: 4px 10px; border-radius: 999px;">${fixedPaymentLabel}</div>` : ''}
            </div>
            <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
              <div style="font-size: 12px; color:#4b5563; margin-bottom: 10px;">Kredilerinizin farklı sürelerle bitmesi nedeniyle aylık ödemeniz dönemsel olarak değişecektir:</div>
              ${periodicPayments.map((period) => `
                <div style="background: white; padding: 12px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #ffb700;">
                  <div style="display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 800; font-size: 12px; color:#111827;">${period.description}</div>
                      <div style="font-size: 11px; color:#6b7280; margin-top: 2px;">${period.startMonth}. ay - ${period.endMonth}. ay (${period.endMonth - period.startMonth + 1} ay)</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: #ffb700; font-size: 14px; font-weight: 900;">${formatCurrency(period.monthlyPayment)}</div>
                      <div style="color: #6b7280; font-size: 11px;">aylık ödeme</div>
                    </div>
                  </div>
                  ${period.activeCredits.length > 0 ? `
                    <div style="margin-top: 10px;">
                      <div style="color: #6b7280; font-size: 11px; font-weight: 700; margin-bottom: 4px;">Bu dönemde aktif krediler:</div>
                      ${period.activeCredits.map((credit: string) => `
                        <div style="color: #6b7280; font-size: 11px; margin-left: 12px;">• ${credit}</div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${plan.type === 'housing' ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Ek Masraflar</div>
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
              ${(() => {
                const additionalExpenses = normalizeAdditionalExpenses(plan.price, plan.additionalExpenses);
                const customExpenses = additionalExpenses.customExpenses || [];
                const rows = [
                  { label: 'Tapu Masrafı', value: additionalExpenses.titleDeedFee },
                  { label: 'Kredi Tahsis Ücreti', value: additionalExpenses.loanAllocationFee },
                  { label: 'Ekspertiz Ücreti', value: additionalExpenses.appraisalFee },
                  { label: 'İpotek Tesis Ücreti', value: additionalExpenses.mortgageEstablishmentFee },
                  { label: 'DASK Sigorta Primi (Yıllık)', value: additionalExpenses.daskInsurancePremium },
                  { label: 'Döner Sermaye Bedeli', value: additionalExpenses.revolvingFundFee },
                  ...customExpenses.map(item => ({ label: item.description, value: item.amount }))
                ];
                return rows.map((row) => `
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; color:#111827;">${row.label}</div>
                    <div style="font-size: 12px; font-weight: 800; color:#111827; white-space: nowrap;">${formatCurrency(row.value)}</div>
                  </div>
                `).join('') + `
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px; background: #fffbeb;">
                    <div style="font-size: 12px; font-weight: 900; color:#111827;">Toplam Ek Masraf</div>
                    <div style="font-size: 12px; font-weight: 900; color:#111827; white-space: nowrap;">${formatCurrency(additionalExpenses.total)}</div>
                  </div>
                `;
              })()}
            </div>
          </div>
        ` : ''}
        
        ${plan.monthlyPayments && plan.monthlyPayments.length > 0 ? `
          <div class="pdf-section" style="margin-bottom: 18px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Aylık Ödeme Planı</div>
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
              <div style="display: grid; grid-template-columns: 0.6fr 1fr 1fr 1fr; gap: 8px; font-size: 11px; font-weight: 900; padding: 10px 12px; background: #ffb700; color: #111827;">
                <div>Ay</div>
                <div>${plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
                <div>Kişisel Krediler</div>
                <div>Toplam</div>
              </div>
              ${plan.monthlyPayments.slice(0, 24).map(payment => {
                const personalTotal = payment.personalPayments ? payment.personalPayments.reduce((sum: number, pp: any) => sum + pp.amount, 0) : 0;
                return `
                  <div style="display: grid; grid-template-columns: 0.6fr 1fr 1fr 1fr; gap: 8px; font-size: 11px; padding: 9px 12px; border-top: 1px solid #f1f5f9;">
                    <div style="font-weight: 800;">${payment.month}. Ay</div>
                    <div>${formatCurrency(payment.housingPayment || 0)}</div>
                    <div>${formatCurrency(personalTotal)}</div>
                    <div style="font-weight: 900; color:#dc2626;">${formatCurrency(payment.totalPayment || 0)}</div>
                  </div>
                `;
              }).join('')}
              ${plan.monthlyPayments.length > 24 ? `
                <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 11px;">
                  ... ve ${plan.monthlyPayments.length - 24} ay daha (Toplam ${plan.monthlyPayments.length} ay)
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="pdf-section" style="margin-bottom: 0;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Ödeme Özeti</div>
          <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: center;">
              <div>
                <div style="color: #6b7280; font-size: 11px; margin-bottom: 6px;">Toplam Vade</div>
                <div style="color: #111827; font-size: 14px; font-weight: 900;">${Math.max(plan.housingCredit?.term || 0, ...plan.personalCredits.map(c => c.term))} Ay</div>
              </div>
              <div>
                <div style="color: #6b7280; font-size: 11px; margin-bottom: 6px;">Aylık Ödeme</div>
                <div style="color: #dc2626; font-size: 14px; font-weight: 900;">${formatCurrency(plan.totalMonthlyPayment)}</div>
              </div>
              <div>
                <div style="color: #6b7280; font-size: 11px; margin-bottom: 6px;">Toplam Ödeme</div>
                <div style="color: #111827; font-size: 14px; font-weight: 900;">${formatCurrency((plan.housingCredit?.totalPayment || 0) + plan.personalCredits.reduce((sum, c) => sum + c.totalPayment, 0))}</div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(source);

      const sourceSections = Array.from(source.querySelectorAll('.pdf-section')) as HTMLElement[];

      const pageEls: HTMLDivElement[] = [];
      let currentPage = document.createElement('div');
      currentPage.style.position = 'absolute';
      currentPage.style.left = '-9999px';
      currentPage.style.top = '0';
      currentPage.style.width = `${pageWidthPx}px`;
      currentPage.style.minHeight = `${pageHeightPx}px`;
      currentPage.style.backgroundColor = 'white';
      currentPage.style.padding = `${pagePaddingPx}px`;
      currentPage.style.boxSizing = 'border-box';
      currentPage.style.fontFamily = 'Arial, sans-serif';
      currentPage.style.color = '#111827';
      document.body.appendChild(currentPage);

      const currentPageContent = () => currentPage;

      for (const section of sourceSections) {
        const clone = section.cloneNode(true) as HTMLElement;
        currentPageContent().appendChild(clone);
        if (currentPage.scrollHeight > pageHeightPx) {
          currentPageContent().removeChild(clone);
          if (currentPage.childElementCount > 0) {
            pageEls.push(currentPage);
            currentPage = document.createElement('div');
            currentPage.style.position = 'absolute';
            currentPage.style.left = '-9999px';
            currentPage.style.top = '0';
            currentPage.style.width = `${pageWidthPx}px`;
            currentPage.style.minHeight = `${pageHeightPx}px`;
            currentPage.style.backgroundColor = 'white';
            currentPage.style.padding = `${pagePaddingPx}px`;
            currentPage.style.boxSizing = 'border-box';
            currentPage.style.fontFamily = 'Arial, sans-serif';
            currentPage.style.color = '#111827';
            document.body.appendChild(currentPage);
            currentPageContent().appendChild(clone);
          } else {
            currentPageContent().appendChild(clone);
          }
        }
      }

      if (currentPage.childElementCount > 0) {
        pageEls.push(currentPage);
      } else {
        document.body.removeChild(currentPage);
      }

      document.body.removeChild(source);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const marginMm = 10;
      const contentWidthMm = 210 - marginMm * 2;
      const contentHeightMm = 297 - marginMm * 2;

      for (let i = 0; i < pageEls.length; i++) {
        const pageEl = pageEls[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const mmPerPx = contentWidthMm / canvas.width;
        const sliceHeightPx = Math.floor(contentHeightMm / mmPerPx);

        let offsetPx = 0;
        while (offsetPx < canvas.height) {
          const remainingPx = canvas.height - offsetPx;
          const currentSliceHeightPx = Math.min(sliceHeightPx, remainingPx);

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = currentSliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) break;
          ctx.drawImage(canvas, 0, offsetPx, canvas.width, currentSliceHeightPx, 0, 0, canvas.width, currentSliceHeightPx);

          const imgData = sliceCanvas.toDataURL('image/png');
          const imgHeightMm = (currentSliceHeightPx * contentWidthMm) / canvas.width;

          if (i > 0 || offsetPx > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, imgHeightMm);

          offsetPx += currentSliceHeightPx;
        }

        document.body.removeChild(pageEl);
      }
      
      // Download PDF with secure filename
      const safeFilename = `TeknoKapsul_${plan.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)}_Odeme_Plani_${new Date().getTime()}.pdf`;
      pdf.save(safeFilename);
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Plan yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-red-50 p-4 rounded-xl mb-4">
            <p className="text-red-600 text-sm">{error || 'Plan bulunamadı'}</p>
          </div>
          <button
            onClick={() => navigate('/payment-plan')}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const totalDownPayment = plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const totalPersonalCreditAmount = plan.personalCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const housingCreditAmount = plan.housingCredit?.amount || 0;
  const additionalExpenses = plan.type === 'housing' ? normalizeAdditionalExpenses(plan.price, plan.additionalExpenses) : null;
  const targetTotal = plan.price + (additionalExpenses?.total || 0);
  const remainingAmount = targetTotal - totalDownPayment - housingCreditAmount - totalPersonalCreditAmount;
  const totalMonthlyIncome = (plan.monthlyIncomes || []).reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/payment-plan')}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{plan.name}</h1>
              <p className="text-white/60 text-xs">{plan.type === 'housing' ? 'Konut' : 'Araç'} Ödeme Planı</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
        <div>
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {plan.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDate(plan.createdAt)} tarihinde oluşturuldu
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {user && user.uid === plan.userId && (
            <button
              onClick={handleEdit}
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm sm:text-base"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Düzenle</span>
              <span className="xs:hidden">Düzenle</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation text-sm sm:text-base"
          >
            <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Paylaş</span>
            <span className="xs:hidden">Paylaş</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation text-sm sm:text-base"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">PDF İndir</span>
            <span className="xs:hidden">PDF</span>
          </button>
        </div>

        {/* Plan Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Plan Özeti</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                {plan.type === 'vehicle' ? <Car className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" /> : <Home className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{formatCurrency(plan.price)}</p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Toplam Peşinat</p>
              <p className="text-sm sm:text-lg font-semibold text-green-600">{formatCurrency(totalDownPayment)}</p>
            </div>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</p>
              <p className="text-sm sm:text-lg font-semibold text-blue-600">{formatCurrency(housingCreditAmount)}</p>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">İhtiyaç Kredileri</p>
              <p className="text-sm sm:text-lg font-semibold text-orange-600">{formatCurrency(totalPersonalCreditAmount)}</p>
            </div>
          </div>
        </div>

        {/* Down Payments */}
        {plan.downPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Peşinat Ödemeleri</h2>
            <div className="space-y-3">
              {plan.downPayments.map((payment, index) => (
                <div key={payment.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="bg-green-100 p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{payment.description}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Peşinat #{index + 1}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-lg font-semibold text-green-600 ml-2">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Toplam Peşinat: {formatCurrency(totalDownPayment)}</p>
            </div>
          </div>
        )}

        {/* Housing/Vehicle Credit */}
        {plan.housingCredit && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              {plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}
            </h2>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Kredi Tutarı</p>
                  <p className="text-sm sm:text-lg font-semibold text-blue-600">{formatCurrency(plan.housingCredit.amount)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Aylık Ödeme</p>
                  <p className="text-sm sm:text-lg font-semibold text-blue-600">{formatCurrency(plan.housingCredit.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Vade</p>
                  <p className="text-sm sm:text-lg font-semibold text-blue-600">{plan.housingCredit.term} ay</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Credits */}
        {plan.personalCredits.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">İhtiyaç Kredileri</h2>
            <div className="space-y-3">
              {plan.personalCredits.map((credit, index) => (
                <div key={credit.id} className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs sm:text-sm text-gray-600">Kredi #{index + 1}</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{credit.bankName || 'Banka'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Tutar</p>
                      <p className="text-sm sm:text-lg font-semibold text-orange-600">{formatCurrency(credit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Aylık Ödeme</p>
                      <p className="text-sm sm:text-lg font-semibold text-orange-600">{formatCurrency(credit.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Vade</p>
                      <p className="text-sm sm:text-lg font-semibold text-orange-600">{credit.term} ay</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 sm:p-4 bg-orange-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-800">Toplam İhtiyaç Kredisi: {formatCurrency(totalPersonalCreditAmount)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-800">Toplam Aylık Ödeme: {formatCurrency(plan.personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0))}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Incomes */}
        {(plan.monthlyIncomes || []).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Aylık Gelirler</h2>
            <div className="space-y-3">
              {(plan.monthlyIncomes || []).map((income) => (
                <div key={income.id} className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{income.description}</p>
                  </div>
                  <p className="text-sm sm:text-lg font-semibold text-emerald-700 ml-3 whitespace-nowrap">
                    {formatCurrency(income.amount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 sm:p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-800">Toplam Aylık Gelir: {formatCurrency(totalMonthlyIncome)}</p>
            </div>
          </div>
        )}

        {/* Income / Installment Fit */}
        {(plan.monthlyIncomes || []).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Gelir / Taksit Uygunluğu</h2>
            {periodicPayments.length > 0 ? (
              <div className="space-y-3">
                {periodicPayments.map((period, index) => {
                  const diff = totalMonthlyIncome - period.monthlyPayment;
                  const ok = diff >= 0;
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{period.description}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{period.startMonth}. ay - {period.endMonth}. ay</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-gray-600">Aylık Taksit</p>
                          <p className="text-sm sm:text-lg font-semibold text-gray-900">{formatCurrency(period.monthlyPayment)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs sm:text-sm text-gray-600">Gelir - Taksit</p>
                        <p className={`text-xs sm:text-sm font-semibold ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatCurrency(diff)} {ok ? '(Yeterli)' : '(Yetersiz)'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">Kredi seçimi olmadığı için dönemsel taksit hesaplanamadı.</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Finansal Özet</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">{plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</span>
              <span className="font-semibold">{formatCurrency(plan.price)}</span>
            </div>
            {plan.type === 'housing' && additionalExpenses && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Ek Masraflar</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.total)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Toplam Peşinat</span>
              <span className="font-semibold text-green-600">-{formatCurrency(totalDownPayment)}</span>
            </div>
            {housingCreditAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</span>
                <span className="font-semibold text-blue-600">-{formatCurrency(housingCreditAmount)}</span>
              </div>
            )}
            {totalPersonalCreditAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">İhtiyaç Kredileri</span>
                <span className="font-semibold text-orange-600">-{formatCurrency(totalPersonalCreditAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
              <span className="font-semibold text-gray-900">Kalan Tutar</span>
              <span className={`font-bold text-lg ${
                remainingAmount > 0 ? 'text-red-600' : remainingAmount < 0 ? 'text-green-600' : 'text-gray-900'
              }`}>
                {formatCurrency(Math.abs(remainingAmount))}
                {remainingAmount < 0 && ' (Fazla)'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Expenses */}
        {plan.type === 'housing' && additionalExpenses && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Ek Masraflar</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Tapu Masrafı</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.titleDeedFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Kredi Tahsis Ücreti</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.loanAllocationFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Ekspertiz Ücreti</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.appraisalFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">İpotek Tesis Ücreti</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.mortgageEstablishmentFee)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">DASK Sigorta Primi (Yıllık)</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.daskInsurancePremium)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Döner Sermaye Bedeli</span>
                <span className="font-semibold">{formatCurrency(additionalExpenses.revolvingFundFee)}</span>
              </div>
              {(additionalExpenses.customExpenses || []).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">{item.description}</span>
                  <span className="font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 bg-[#ffb700]/10 rounded-lg px-4">
                <span className="font-semibold text-gray-900">Toplam Ek Masraf</span>
                <span className="font-bold text-lg text-[#ffb700]">{formatCurrency(additionalExpenses.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Periodic Payment Schedule */}
        {periodicPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Dönemsel Ödeme Planı</h2>
              {fixedPaymentLabel && (
                <span className="text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  {fixedPaymentLabel}
                </span>
              )}
            </div>
            <div className="space-y-3 sm:space-y-4">
              {periodicPayments.map((period, index) => (
                <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{period.description}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {period.startMonth}. ay - {period.endMonth}. ay ({period.endMonth - period.startMonth + 1} ay)
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg sm:text-xl font-bold text-[#ffb700]">
                        {formatCurrency(period.monthlyPayment)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">aylık</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Aktif Krediler:</p>
                    {period.activeCredits.map((credit, creditIndex) => (
                      <p key={creditIndex} className="text-xs sm:text-sm text-gray-600 ml-2">• {credit}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Aylık Ödeme Özeti</h2>
          <div className="bg-[#ffb700]/10 p-4 sm:p-6 rounded-lg text-center">
            <div className="flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#ffb700] mr-2 sm:mr-3" />
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-[#ffb700]" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Toplam Aylık Ödeme</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#ffb700]">
              {formatCurrency(plan.totalMonthlyPayment)}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              {plan.housingCredit && (
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</p>
                  <p className="font-semibold text-blue-600">{formatCurrency(plan.housingCredit.monthlyPayment)}</p>
                </div>
              )}
              {plan.personalCredits.length > 0 && (
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-600">İhtiyaç Kredileri</p>
                  <p className="font-semibold text-orange-600">
                    {formatCurrency(plan.personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanDetailPage;
