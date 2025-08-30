import React, { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Calculator, CreditCard, Building, CheckCircle, Save, ArrowLeft, Edit, Eye, Download } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Types
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

interface PaymentPlanState {
  id?: string;
  name?: string;
  shareEmail?: string;
}

interface PaymentPlan {
  id: string;
  name: string;
  loanType: 'housing' | 'vehicle';
  housePrice: number;
  downPayments: DownPayment[];
  housingCredit?: SelectedCredit | null;
  personalCredits: SelectedCredit[];
  monthlyPayments: MonthlyPayment[];
  totalMonthlyPayment: number;
  createdAt: Date;
  sharedWith?: string | null;
  userId?: string;
}

interface MonthlyPayment {
  month: number;
  housingPayment: number;
  personalPayments: { creditId: string; amount: number }[];
  totalPayment: number;
}

interface AdditionalExpenses {
  titleDeedFee: number; // Tapu masrafı (%4)
  loanAllocationFee: number; // Kredi tahsis ücreti (500 TL)
  appraisalFee: number; // Ekspertiz ücreti (15.874 TL)
  mortgageEstablishmentFee: number; // İpotek tesis ücreti (2.700 TL)
  daskInsurancePremium: number; // DASK sigorta primi (yıllık 1.500 TL)
  total: number;
}

const PaymentPlanPage: React.FC = () => {
  const { user } = useAuth();
  
  // Main state
  const [currentStep, setCurrentStep] = useState<'house-price' | 'down-payments' | 'housing-credit' | 'personal-credits' | 'payment-plan'>('house-price');
  const [housePrice, setHousePrice] = useState<number>(0);
  const [loanType, setLoanType] = useState<'housing' | 'vehicle'>('housing');
  const [downPayments, setDownPayments] = useState<DownPayment[]>([]);
  const [newDownPayment, setNewDownPayment] = useState({ amount: 0, description: '' });
  
  // Credit related state
  const [housingCreditAmount, setHousingCreditAmount] = useState<number>(0);
  const [housingCreditMonths, setHousingCreditMonths] = useState<number>(120);
  const [housingCreditOffers, setHousingCreditOffers] = useState<SelectedCredit[]>([]);
  const [selectedHousingCredit, setSelectedHousingCredit] = useState<SelectedCredit | null>(null);
  const [vehicleCreditOffers, setVehicleCreditOffers] = useState<SelectedCredit[]>([]);
  const [selectedVehicleCredit, setSelectedVehicleCredit] = useState<SelectedCredit | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  const [personalCreditAmount, setPersonalCreditAmount] = useState<number>(0);
  const [personalCreditTerm, setPersonalCreditTerm] = useState<number>(12); // 1 year default
  const [personalCreditOffers, setPersonalCreditOffers] = useState<SelectedCredit[]>([]);
  const [personalCredits, setPersonalCredits] = useState<SelectedCredit[]>([]);
  
  // Plan management
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanState>({});
  const [savedPlans, setSavedPlans] = useState<PaymentPlan[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showSavedPlans, setShowSavedPlans] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'form' | 'detail'>('form');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Additional expenses calculation
  const calculateAdditionalExpenses = (housePrice: number): AdditionalExpenses => {
    const titleDeedFee = housePrice * 0.04; // %4
    const loanAllocationFee = 500;
    const appraisalFee = 15874;
    const mortgageEstablishmentFee = 2700;
    const daskInsurancePremium = 1500;
    
    return {
      titleDeedFee,
      loanAllocationFee,
      appraisalFee,
      mortgageEstablishmentFee,
      daskInsurancePremium,
      total: titleDeedFee + loanAllocationFee + appraisalFee + mortgageEstablishmentFee + daskInsurancePremium
    };
  };
  
  const additionalExpenses = calculateAdditionalExpenses(housePrice);

  // Load saved plans and restore state on component mount
  useEffect(() => {
    const loadSavedPlans = async () => {
      if (!user?.id) return;
      
      try {
        const plansRef = collection(db, 'teknokapsul', user.id, 'paymentPlans');
        const q = query(plansRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const plans = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as PaymentPlan[];
        
        console.log('Yüklenen planlar:', plans);
        setSavedPlans(plans);
      } catch (error) {
        console.error('Kaydedilen planlar yüklenirken hata:', error);
      }
    };
    
    // Restore state from localStorage
    const savedState = localStorage.getItem('paymentPlanState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.housePrice) setHousePrice(state.housePrice);
        if (state.downPayments) setDownPayments(state.downPayments);
        if (state.selectedHousingCredit) setSelectedHousingCredit(state.selectedHousingCredit);
        if (state.personalCredits) setPersonalCredits(state.personalCredits);
        if (state.currentStep) setCurrentStep(state.currentStep);
        if (state.paymentPlan) setPaymentPlan(state.paymentPlan);
      } catch (error) {
        console.error('State geri yüklenirken hata:', error);
      }
    }
    
    loadSavedPlans();
  }, [user]);

  // View plan details
  const viewPlanDetails = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setViewMode('detail');
    setIsEditing(false);
    setShowSavedPlans(false);
  };

  // Load a saved plan for editing
  const loadPlanForEditing = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setViewMode('form');
    setLoanType(plan.loanType || 'housing');
    setHousePrice(plan.housePrice);
    setDownPayments(plan.downPayments);
    setSelectedHousingCredit(plan.housingCredit || null);
    setPersonalCredits(plan.personalCredits);
    setPaymentPlan({ name: plan.name, shareEmail: plan.sharedWith || '' });
    setCurrentStep('house-price');
    setShowSavedPlans(false);
  };

  // Delete a saved plan
  const deletePlan = async (planId: string) => {
    if (!user?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'teknokapsul', user.id, 'paymentPlans', planId));
      setSavedPlans(prev => prev.filter(plan => plan.id !== planId));
      
      // If we're viewing the deleted plan, go back to form
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        setViewMode('form');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Plan silinirken hata:', error);
      alert('Plan silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Download plan as PDF
  const downloadPlanAsPDF = async (plan: PaymentPlan) => {
    try {
      // Create a temporary div with the plan content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Calculate totals
      const totalDownPayment = plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0);
      const totalAllPayments = plan.monthlyPayments.reduce((sum, payment) => sum + payment.totalPayment, 0);
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffb700; font-size: 28px; margin-bottom: 10px;">TeknoKapsül - Ödeme Planı</h1>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">${plan.name}</h2>
          <p style="color: #666; font-size: 14px;">Oluşturulma Tarihi: ${new Date(plan.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 5px;">Ev Fiyatı</h3>
            <p style="color: #333; font-size: 20px; font-weight: bold;">${formatCurrency(plan.housePrice)}</p>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 5px;">Toplam Peşinat</h3>
            <p style="color: #28a745; font-size: 20px; font-weight: bold;">${formatCurrency(totalDownPayment)}</p>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 5px;">Aylık Ödeme</h3>
            <p style="color: #dc3545; font-size: 20px; font-weight: bold;">${formatCurrency(plan.totalMonthlyPayment)}</p>
          </div>
        </div>
        
        ${plan.downPayments.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Peşinat Detayları</h3>
            ${plan.downPayments.map(dp => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${dp.description}</span>
                <span style="font-weight: bold;">${formatCurrency(dp.amount)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${plan.housingCredit ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Konut Kredisi</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
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
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Kişisel Krediler</h3>
            ${plan.personalCredits.map(credit => `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                  <div><strong>Banka:</strong> ${credit.bankName}</div>
                  <div><strong>Tutar:</strong> ${formatCurrency(credit.amount)}</div>
                  <div><strong>Faiz Oranı:</strong> ${credit.interestRate}%</div>
                  <div><strong>Vade:</strong> ${credit.term} Ay</div>
                  <div><strong>Aylık Taksit:</strong> ${formatCurrency(credit.monthlyPayment)}</div>
                  <div><strong>Toplam Ödeme:</strong> ${formatCurrency(credit.totalPayment)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Ödeme Özeti</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Toplam Vade</p>
                <p style="color: #333; font-size: 18px; font-weight: bold;">${Math.max(plan.housingCredit?.term || 0, ...plan.personalCredits.map(c => c.term))} Ay</p>
              </div>
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Aylık Ödeme</p>
                <p style="color: #dc3545; font-size: 18px; font-weight: bold;">${formatCurrency(plan.totalMonthlyPayment)}</p>
              </div>
              <div>
                <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Toplam Ödeme</p>
                <p style="color: #ff6b35; font-size: 18px; font-weight: bold;">${formatCurrency(totalAllPayments)}</p>
              </div>
            </div>
          </div>
        </div>
        
        ${plan.monthlyPayments && plan.monthlyPayments.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Aylık Ödeme Planı</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; font-weight: bold; padding: 10px; background: #ffb700; color: white; border-radius: 4px; margin-bottom: 10px;">
                <div>Ay</div>
                <div>Konut Kredisi</div>
                <div>Kişisel Krediler</div>
                <div>Toplam Aylık</div>
              </div>
              ${plan.monthlyPayments.slice(0, 24).map(payment => {
                const personalTotal = payment.personalPayments.reduce((sum, pp) => sum + pp.amount, 0);
                return `
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; padding: 8px; border-bottom: 1px solid #ddd;">
                    <div><strong>${payment.month}. Ay</strong></div>
                    <div>${formatCurrency(payment.housingPayment)}</div>
                    <div>${formatCurrency(personalTotal)}</div>
                    <div style="color: #dc3545; font-weight: bold;">${formatCurrency(payment.totalPayment)}</div>
                  </div>
                `;
              }).join('')}
              ${plan.monthlyPayments.length > 24 ? `
                <div style="text-align: center; padding: 15px; color: #666; font-style: italic;">
                  ... ve ${plan.monthlyPayments.length - 24} ay daha (Toplam ${plan.monthlyPayments.length} ay)
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        ${plan.sharedWith ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #1976d2; font-size: 14px;">📧 ${plan.sharedWith} ile paylaşıldı</p>
          </div>
        ` : ''}
      `;
      
      document.body.appendChild(tempDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temp div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF with secure filename
      const safeFilename = `TeknoKapsul_${plan.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)}_Odeme_Plani_${new Date().getTime()}.pdf`;
      pdf.save(safeFilename);
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  
  // Save state to localStorage whenever important data changes
  useEffect(() => {
    const stateToSave = {
      housePrice,
      downPayments,
      selectedHousingCredit,
      personalCredits,
      currentStep,
      paymentPlan
    };
    localStorage.setItem('paymentPlanState', JSON.stringify(stateToSave));
  }, [housePrice, downPayments, selectedHousingCredit, personalCredits, currentStep, paymentPlan]);
  


  // Calculations
  const totalDownPayment = downPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const remainingAfterDownPayment = housePrice - totalDownPayment;
  const actualHousingCreditAmount = selectedHousingCredit ? selectedHousingCredit.amount : 0;
  const remainingAfterHousingCredit = remainingAfterDownPayment - actualHousingCreditAmount;
  const totalPersonalCreditAmount = personalCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalPersonalCreditMonthly = personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0);
  const remainingAfterPersonalCredits = remainingAfterHousingCredit - totalPersonalCreditAmount;
  const finalRemainingAmount = remainingAfterHousingCredit - totalPersonalCreditAmount + additionalExpenses.total;

  // Plan management functions
  const savePlan = async () => {
    if (!paymentPlan?.name?.trim() || !user?.id) return;
    
    setIsSaving(true);
    
    try {
      // Calculate monthly payments timeline
      const monthlyPayments: MonthlyPayment[] = [];
      const maxTerm = Math.max(
        selectedHousingCredit?.term || 0,
        ...personalCredits.map(credit => credit.term)
      );
      
      for (let month = 1; month <= maxTerm; month++) {
        const housingPayment = selectedHousingCredit && month <= selectedHousingCredit.term
          ? selectedHousingCredit.monthlyPayment : 0;
        
        const personalPayments = personalCredits
          .filter(credit => month <= credit.term)
          .map(credit => ({
            creditId: credit.id,
            amount: credit.monthlyPayment
          }));
        
        const totalPayment = housingPayment + personalPayments.reduce((sum, p) => sum + p.amount, 0);
        
        monthlyPayments.push({
          month,
          housingPayment,
          personalPayments,
          totalPayment
        });
      }
      
      const planData = {
        name: paymentPlan.name!,
        loanType,
        housePrice,
        downPayments,
        housingCredit: selectedHousingCredit || null,
        personalCredits,
        monthlyPayments,
        totalMonthlyPayment: (selectedHousingCredit?.monthlyPayment || 0) + totalPersonalCreditMonthly,
        createdAt: new Date(),
        sharedWith: paymentPlan.shareEmail || null,
        userId: user.id
      };
      
      console.log('Kaydedilecek plan verisi:', planData);
      console.log('Email adresi:', paymentPlan.shareEmail);
      
      // Save to Firebase Firestore
      const plansRef = collection(db, 'teknokapsul', user.id, 'paymentPlans');
      const docRef = await addDoc(plansRef, planData);
      
      const newPlan: PaymentPlan = {
        id: docRef.id,
        ...planData
      };
      
      // Update local state
      setSavedPlans(prev => [newPlan, ...prev]);
      
      // Send email if provided
      if (paymentPlan.shareEmail?.trim()) {
        await shareViaEmail(newPlan, paymentPlan.shareEmail);
      }
      
      alert(`Plan başarıyla kaydedildi! ${paymentPlan.shareEmail ? 'Email gönderildi.' : ''}`);
      
      // Reset form
      setPaymentPlan({});
      
    } catch (error) {
      console.error('Plan kaydetme hatası:', error);
      alert('Plan kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const shareViaEmail = async (plan: PaymentPlan, email: string) => {
    try {
      // Firebase Functions'dan email gönderme servisini çağır
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../lib/firebase');
      
      const sendPaymentPlanEmail = httpsCallable(functions, 'sendPaymentPlanEmail');
      
      // Ek masrafları hesapla
      const additionalExpenses = calculateAdditionalExpenses(plan.housePrice);
      
      const planData = {
        name: plan.name,
        housePrice: plan.housePrice,
        totalDownPayment: plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0),
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

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' TL';
  };

  const formatBankName = (bankCode: string): string => {
    const bankMapping: { [key: string]: string } = {
      'ing-bank': 'ING Bank',
      'cepteteb': 'CEPTETEB',
      'teb': 'TEB',
      'garanti-bbva': 'Garanti BBVA',
      'garanti': 'Garanti BBVA',
      'isbank': 'İş Bankası',
      'akbank': 'Akbank',
      'qnb-finansbank': 'QNB Finansbank',
      'qnb': 'QNB Finansbank',
      'enparacom': 'Enpara.com',
      'burgan-bank': 'Burgan Bank',
      'aktif-bank': 'Aktif Bank',
      'halkbank': 'Halkbank',
      'hayat-finans': 'Hayat Finans',
      'vakifbank': 'Vakıfbank',
      'yapi-kredi': 'Yapı Kredi',
      'yapikredi': 'Yapı Kredi',
      'ziraat-bankasi': 'Ziraat Bankası',
      'ziraat': 'Ziraat Bankası',
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

  // Add down payment
  const addDownPayment = () => {
    if (newDownPayment.amount > 0 && newDownPayment.description.trim()) {
      const downPayment: DownPayment = {
        id: Date.now().toString(),
        amount: newDownPayment.amount,
        description: newDownPayment.description
      };
      setDownPayments([...downPayments, downPayment]);
      setNewDownPayment({ amount: 0, description: '' });
    }
  };

  // Remove down payment
  const removeDownPayment = (id: string) => {
    setDownPayments(downPayments.filter(dp => dp.id !== id));
  };

  // Sort results by interest rate
  const sortByInterestRate = (results: CreditBidResult[]): CreditBidResult[] => {
    return results.sort((a, b) => {
      const rateA = parseFloat(a.oran.replace('%', '').replace(',', '.'));
      const rateB = parseFloat(b.oran.replace('%', '').replace(',', '.'));
      return rateA - rateB; // En düşük faiz oranından en yükseğe
    });
  };

  // Calculate housing credit
  const calculateHousingCredit = async () => {
    // Otomatik olarak kalan tutarı kullan
    const creditAmount = housingCreditAmount > 0 ? housingCreditAmount : remainingAfterDownPayment;
    if (creditAmount <= 0) return;
    
    // Kredi tutarını güncelle
    setHousingCreditAmount(creditAmount);
    
    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${creditAmount}&data.month=${housingCreditMonths}&data.query=konut`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        const sortedResults = sortByInterestRate(data.result);
        const offers: SelectedCredit[] = sortedResults.map((offer: CreditBidResult, index: number) => ({
          id: `housing-${index}`,
          type: 'konut',
          bankCode: offer['bank-code'],
          bankName: formatBankName(offer['bank-code']),
          amount: creditAmount,
          interestRate: offer.oran,
          monthlyPayment: Math.round(parseFloat(offer.ay.replace(/[^\d.-]/g, ''))),
          totalPayment: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          totalAmount: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          term: housingCreditMonths
        }));
        
        setVehicleCreditOffers(offers);
      } else {
        // Fallback to mock data if API fails
        const mockOffers: SelectedCredit[] = [
          {
            id: '1',
            type: 'konut',
            bankCode: 'garanti-bbva',
            bankName: 'Garanti BBVA',
            amount: creditAmount,
            interestRate: '1.89',
            monthlyPayment: Math.round(creditAmount * 0.008),
            totalPayment: Math.round(creditAmount * 1.2),
            totalAmount: Math.round(creditAmount * 1.2),
            term: housingCreditMonths
          },
          {
            id: '2',
            type: 'konut',
            bankCode: 'isbank',
            bankName: 'İş Bankası',
            amount: creditAmount,
            interestRate: '1.95',
            monthlyPayment: Math.round(creditAmount * 0.0085),
            totalPayment: Math.round(creditAmount * 1.25),
            totalAmount: Math.round(creditAmount * 1.25),
            term: housingCreditMonths
          }
        ];
        setVehicleCreditOffers(mockOffers);
      }
    } catch (error) {
      console.error('Error calculating housing credit:', error);
      // Fallback to mock data
      const mockOffers: SelectedCredit[] = [
        {
          id: '1',
          type: 'konut',
          bankCode: 'garanti-bbva',
          bankName: 'Garanti BBVA',
          amount: creditAmount,
          interestRate: '1.89',
          monthlyPayment: Math.round(creditAmount * 0.008),
          totalPayment: Math.round(creditAmount * 1.2),
          totalAmount: Math.round(creditAmount * 1.2),
          term: housingCreditMonths
        }
      ];
      setVehicleCreditOffers(mockOffers);
    } finally {
      setIsCalculating(false);
    }
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
    const creditAmount = Math.min(remainingAfterPersonalCredits, 500000);
    if (creditAmount <= 0) return;
    
    // Validate credit limits
    if (!validatePersonalCreditLimits(creditAmount, personalCreditTerm)) {
      alert(`İhtiyaç kredisi sınırları:\n- 125.000 TL'ye kadar: 3 yıl\n- 250.000 TL'ye kadar: 2 yıl\n- 500.000 TL'ye kadar: 1 yıl\n- 500.000 TL üstü kredi verilmemektedir.`);
      return;
    }
    
    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${creditAmount}&data.month=${personalCreditTerm}&data.query=ihtiyac`, {
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
          amount: creditAmount,
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
            amount: creditAmount,
            interestRate: '2.89',
            monthlyPayment: Math.round(creditAmount * 0.035),
            totalPayment: Math.round(creditAmount * 1.4),
            totalAmount: Math.round(creditAmount * 1.4),
            term: personalCreditTerm
          },
          {
            id: `pc-${Date.now()}-2`,
            type: 'ihtiyac',
            bankCode: 'isbank',
            bankName: 'İş Bankası',
            amount: creditAmount,
            interestRate: '3.15',
            monthlyPayment: Math.round(creditAmount * 0.038),
            totalPayment: Math.round(creditAmount * 1.45),
            totalAmount: Math.round(creditAmount * 1.45),
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
          amount: creditAmount,
          interestRate: '2.89',
          monthlyPayment: Math.round(creditAmount * 0.035),
          totalPayment: Math.round(creditAmount * 1.4),
          totalAmount: Math.round(creditAmount * 1.4),
          term: personalCreditTerm
        }
      ];
      setPersonalCreditOffers(mockOffers);
    } finally {
      setIsCalculating(false);
    }
  };

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

  // Calculate vehicle credit
  const calculateVehicleCredit = async () => {
    const maxAmount = getVehicleCreditLimit(housePrice);
    if (maxAmount <= 0) {
      alert('Bu fiyat aralığında taşıt kredisi verilmemektedir. İhtiyaç kredisine yönlendiriliyorsunuz.');
      return;
    }

    // Otomatik olarak maksimum tutarı kullan
    setHousingCreditAmount(maxAmount);
    
    setIsCalculating(true);
    try {
      const apiKey = '2W4ZOFoGlHWb9z8Cs6ivIu:5Uzffj2XkjeJxl6rVxEVHt';
      const baseURL = 'https://api.collectapi.com/credit/';
      
      const response = await fetch(`${baseURL}creditBid?data.price=${maxAmount}&data.month=60&data.query=tasit`, {
        headers: {
          'authorization': `apikey ${apiKey}`,
          'content-type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        const sortedResults = sortByInterestRate(data.result);
        const offers: SelectedCredit[] = sortedResults.map((offer: CreditBidResult, index: number) => ({
          id: `vehicle-${index}`,
          type: 'tasit',
          bankCode: offer['bank-code'],
          bankName: formatBankName(offer['bank-code']),
          amount: maxAmount,
          interestRate: offer.oran,
          monthlyPayment: Math.round(parseFloat(offer.ay.replace(/[^\d.-]/g, ''))),
          totalPayment: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          totalAmount: Math.round(parseFloat(offer.tl.replace(/[^\d.-]/g, ''))),
          term: 60
        }));
        
        setHousingCreditOffers(offers);
      } else {
        // Fallback to mock data if API fails
        const mockOffers: SelectedCredit[] = [
          {
            id: 'vehicle-mock-1',
            type: 'tasit',
            bankCode: 'garanti-bbva',
            bankName: 'Garanti BBVA',
            amount: maxAmount,
            interestRate: '2.89',
            monthlyPayment: Math.round(maxAmount * 0.025),
            totalPayment: Math.round(maxAmount * 1.5),
            totalAmount: Math.round(maxAmount * 1.5),
            term: 60
          },
          {
            id: 'vehicle-mock-2',
            type: 'tasit',
            bankCode: 'isbank',
            bankName: 'İş Bankası',
            amount: maxAmount,
            interestRate: '3.15',
            monthlyPayment: Math.round(maxAmount * 0.028),
            totalPayment: Math.round(maxAmount * 1.6),
            totalAmount: Math.round(maxAmount * 1.6),
            term: 60
          }
        ];
        setHousingCreditOffers(mockOffers);
      }
    } catch (error) {
      console.error('Taşıt kredisi hesaplama hatası:', error);
      // Fallback to mock data
      const mockOffers: SelectedCredit[] = [
        {
          id: 'vehicle-mock-1',
          type: 'tasit',
          bankCode: 'garanti-bbva',
          bankName: 'Garanti BBVA',
          amount: maxAmount,
          interestRate: '2.89',
          monthlyPayment: Math.round(maxAmount * 0.025),
          totalPayment: Math.round(maxAmount * 1.5),
          totalAmount: Math.round(maxAmount * 1.5),
          term: 60
        }
      ];
      setHousingCreditOffers(mockOffers);
    } finally {
      setIsCalculating(false);
    }
  };

  // Add personal credit
  const addPersonalCredit = (offer: SelectedCredit) => {
    const newCredit: SelectedCredit = {
      id: `pc-${Date.now()}`,
      type: 'ihtiyac',
      bankCode: offer.bankCode,
      bankName: offer.bankName,
      amount: personalCreditAmount,
      interestRate: offer.interestRate,
      monthlyPayment: offer.monthlyPayment,
      totalPayment: offer.totalPayment,
      totalAmount: offer.totalAmount,
      term: personalCreditTerm
    };
    setPersonalCredits([...personalCredits, newCredit]);
    setPersonalCreditOffers([]);
    setPersonalCreditAmount(0);
  };

  // Remove personal credit
  const removePersonalCredit = (id: string) => {
    setPersonalCredits(personalCredits.filter(pc => pc.id !== id));
  };

  // If viewing plan details, show detail page
  if (viewMode === 'detail' && selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <button
              onClick={() => {
                setViewMode('form');
                setSelectedPlan(null);
              }}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors self-start"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Geri Dön
            </button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => downloadPlanAsPDF(selectedPlan)}
                className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF İndir
              </button>
              <button
                onClick={() => loadPlanForEditing(selectedPlan)}
                className="flex items-center justify-center bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base"
              >
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </button>
              <button
                onClick={() => {
                  if (confirm('Bu planı silmek istediğinizden emin misiniz?')) {
                    deletePlan(selectedPlan.id);
                  }
                }}
                disabled={isDeleting}
                className="flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedPlan.name}</h1>
              <span className="text-sm text-gray-500">
                {new Date(selectedPlan.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Ev Fiyatı</h3>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedPlan.housePrice)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Toplam Peşinat</h3>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(selectedPlan.downPayments.reduce((sum, dp) => sum + dp.amount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Aylık Ödeme</h3>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(selectedPlan.totalMonthlyPayment)}</p>
              </div>
            </div>

            {/* Down Payments */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Peşinat Detayları</h3>
              <div className="space-y-3">
                {selectedPlan.downPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{payment.description}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Housing Credit */}
            {selectedPlan.housingCredit && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Konut Kredisi</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-green-600 text-sm">Banka</p>
                      <p className="font-semibold">{selectedPlan.housingCredit.bankName}</p>
                    </div>
                    <div>
                      <p className="text-green-600 text-sm">Kredi Tutarı</p>
                      <p className="font-semibold">{formatCurrency(selectedPlan.housingCredit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-green-600 text-sm">Faiz Oranı</p>
                      <p className="font-semibold">{selectedPlan.housingCredit.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-green-600 text-sm">Aylık Taksit</p>
                      <p className="font-semibold">{formatCurrency(selectedPlan.housingCredit.monthlyPayment)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Credits */}
            {selectedPlan.personalCredits.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">İhtiyaç Kredileri</h3>
                <div className="space-y-3">
                  {selectedPlan.personalCredits.map((credit) => (
                    <div key={credit.id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-blue-600 text-sm">Banka</p>
                          <p className="font-semibold">{credit.bankName}</p>
                        </div>
                        <div>
                          <p className="text-blue-600 text-sm">Kredi Tutarı</p>
                          <p className="font-semibold">{formatCurrency(credit.amount)}</p>
                        </div>
                        <div>
                          <p className="text-blue-600 text-sm">Faiz Oranı</p>
                          <p className="font-semibold">{credit.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-blue-600 text-sm">Aylık Taksit</p>
                          <p className="font-semibold">{formatCurrency(credit.monthlyPayment)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Payment Timeline */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Aylık Ödeme Planı</h3>
              <div className="space-y-4">
                {selectedPlan.monthlyPayments.length > 0 ? (
                  <>
                    {/* Timeline Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">Toplam Vade</p>
                        <p className="text-xl font-bold text-gray-900">{selectedPlan.monthlyPayments.length} Ay</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">Aylık Ödeme</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPlan.totalMonthlyPayment)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">Toplam Ödeme</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(selectedPlan.monthlyPayments.reduce((sum, payment) => sum + payment.totalPayment, 0))}
                        </p>
                      </div>
                    </div>

                    {/* Yearly Breakdown */}
                    {(() => {
                      const yearlyData: { [key: number]: { payments: typeof selectedPlan.monthlyPayments, total: number } } = {};
                      
                      selectedPlan.monthlyPayments.forEach((payment) => {
                        const year = Math.ceil(payment.month / 12);
                        if (!yearlyData[year]) {
                          yearlyData[year] = { payments: [], total: 0 };
                        }
                        yearlyData[year].payments.push(payment);
                        yearlyData[year].total += payment.totalPayment;
                      });

                      return Object.entries(yearlyData).map(([year, data]) => (
                        <div key={year} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-800">
                              {year}. Yıl ({data.payments[0].month}-{data.payments[data.payments.length - 1].month}. aylar)
                            </h4>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Yıllık Toplam</p>
                              <p className="font-bold text-green-600">{formatCurrency(data.total)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.payments.map((payment) => (
                              <div key={payment.month} className="bg-gray-50 p-3 rounded border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">{payment.month}. Ay</span>
                                  <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.totalPayment)}</span>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  {payment.housingPayment > 0 && (
                                    <div className="flex justify-between">
                                      <span>Konut Kredisi:</span>
                                      <span>{formatCurrency(payment.housingPayment)}</span>
                                    </div>
                                  )}
                                  {payment.personalPayments.map((pp, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>Kişisel Kredi:</span>
                                      <span>{formatCurrency(pp.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aylık ödeme planı bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared Info */}
            {selectedPlan.sharedWith && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Paylaşım Bilgisi</h3>
                <p className="text-blue-700">📧 {selectedPlan.sharedWith} ile paylaşıldı</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-[#ffb700] p-3 rounded-full mr-3">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {isEditing ? `${selectedPlan?.name} - Düzenleme` : 'Ödeme Planı Oluştur'}
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Ev alımınız için detaylı ödeme planı oluşturun. Peşinat, konut kredisi ve ihtiyaç kredilerini planlayın.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center overflow-x-auto pb-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
              {[
                { key: 'house-price', label: 'Ev Fiyatı', shortLabel: 'Fiyat', icon: Home },
                { key: 'down-payments', label: 'Peşinatlar', shortLabel: 'Peşinat', icon: CreditCard },
                { key: 'housing-credit', label: 'Konut Kredisi', shortLabel: 'Konut', icon: Building },
                { key: 'personal-credits', label: 'İhtiyaç Kredisi', shortLabel: 'İhtiyaç', icon: Calculator },
                { key: 'plan-summary', label: 'Plan Özeti', shortLabel: 'Özet', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.key;
                const isCompleted = [
                  'house-price',
                  'down-payments',
                  'housing-credit',
                  'personal-credits',
                  'plan-summary'
                ].indexOf(currentStep) > [
                  'house-price',
                  'down-payments',
                  'housing-credit',
                  'personal-credits',
                  'plan-summary'
                ].indexOf(step.key);
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                        isActive ? 'bg-[#ffb700] text-white' :
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className={`mt-1 text-xs sm:text-sm font-medium text-center ${
                        isActive ? 'text-[#ffb700]' :
                        isCompleted ? 'text-green-500' :
                        'text-gray-500'
                      }`}>
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">{step.shortLabel}</span>
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* House Price Step */}
          {currentStep === 'house-price' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Kredi Türü ve Fiyat Bilgisi</h2>
              <div className="max-w-md mx-auto space-y-6">
                {/* Loan Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kredi Türü Seçin
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setLoanType('housing')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        loanType === 'housing'
                          ? 'border-[#ffb700] bg-[#ffb700] bg-opacity-10 text-[#ffb700]'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <Home className="w-6 h-6 mx-auto mb-2" />
                      <span className="font-medium">Konut Kredisi</span>
                    </button>
                    <button
                      onClick={() => setLoanType('vehicle')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        loanType === 'vehicle'
                          ? 'border-[#ffb700] bg-[#ffb700] bg-opacity-10 text-[#ffb700]'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <Calculator className="w-6 h-6 mx-auto mb-2" />
                      <span className="font-medium">Taşıt Kredisi</span>
                    </button>
                  </div>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {loanType === 'housing' ? 'Ev Fiyatı (TL)' : 'Araç Fiyatı (TL)'}
                  </label>
                  <input
                    type="number"
                    value={housePrice || ''}
                    onChange={(e) => setHousePrice(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-lg"
                    placeholder={loanType === 'housing' ? 'Örn: 5000000' : 'Örn: 1500000'}
                  />
                </div>

                <div className="text-center">
                  <button
                    onClick={() => housePrice > 0 && setCurrentStep('down-payments')}
                    disabled={housePrice <= 0}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Peşinat Ödemelerini Ekleyin</h2>
              
              {/* Add New Down Payment */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-4">Yeni Peşinat Ekle</h3>
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tutar (TL)
                    </label>
                    <input
                      type="number"
                      value={newDownPayment.amount || ''}
                      onChange={(e) => setNewDownPayment({...newDownPayment, amount: Number(e.target.value)})}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: 1000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={newDownPayment.description}
                      onChange={(e) => setNewDownPayment({...newDownPayment, description: e.target.value})}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: İlk peşinat"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addDownPayment}
                      disabled={newDownPayment.amount <= 0 || !newDownPayment.description.trim()}
                      className="w-full bg-[#ffb700] text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>

              {/* Down Payments List */}
              {downPayments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Eklenen Peşinatlar</h3>
                  <div className="space-y-3">
                    {downPayments.map((dp) => (
                      <div key={dp.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{dp.description}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{formatCurrency(dp.amount)}</p>
                        </div>
                        <button
                          onClick={() => removeDownPayment(dp.id)}
                          className="text-red-500 hover:text-red-700 p-2 ml-2 flex-shrink-0"
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
                  onClick={() => setCurrentStep('house-price')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => {
                    if (remainingAfterDownPayment > 0) {
                      setHousingCreditAmount(Math.min(remainingAfterDownPayment, remainingAfterDownPayment * 0.8)); // Max %80
                      setCurrentStep('housing-credit');
                    }
                  }}
                  disabled={downPayments.length === 0 || remainingAfterDownPayment <= 0}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* Housing/Vehicle Credit Step */}
          {currentStep === 'housing-credit' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{loanType === 'vehicle' ? 'Taşıt Kredisi Hesaplama' : 'Konut Kredisi Hesaplama'}</h2>
              
              {/* Auto Credit Calculation Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">Otomatik Kredi Hesaplama</h3>
                    {loanType === 'vehicle' ? (
                      <>
                        <p className="text-sm text-blue-600 mt-1">
                          Araç fiyatı: <span className="font-semibold">{formatCurrency(housePrice)}</span>
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Maksimum taşıt kredisi: <span className="font-semibold">{formatCurrency(getVehicleCreditLimit(housePrice))}</span>
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          Bu tutar için en uygun taşıt kredisi teklifleri otomatik olarak hesaplanacak.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-blue-600 mt-1">
                          Kalan tutar: <span className="font-semibold">{formatCurrency(remainingAfterDownPayment)}</span>
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          Bu tutar için en uygun konut kredisi teklifleri otomatik olarak hesaplanacak.
                        </p>
                      </>
                    )}
                  </div>
                  {loanType === 'housing' && (
                    <div className="text-right">
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Vade Seçimi
                      </label>
                      <select
                        value={housingCreditMonths}
                        onChange={(e) => {
                          setHousingCreditMonths(Number(e.target.value));
                          // Vade değiştiğinde otomatik hesapla
                          if (remainingAfterDownPayment > 0) {
                            setHousingCreditAmount(remainingAfterDownPayment);
                            setTimeout(() => calculateHousingCredit(), 100);
                          }
                        }}
                        className="px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value={60}>5 Yıl (60 Ay)</option>
                        <option value={120}>10 Yıl (120 Ay)</option>
                        <option value={180}>15 Yıl (180 Ay)</option>
                        <option value={240}>20 Yıl (240 Ay)</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {((loanType === 'housing' && remainingAfterDownPayment > 0) || (loanType === 'vehicle' && getVehicleCreditLimit(housePrice) > 0)) && (
                  <button
                    onClick={() => {
                      if (loanType === 'vehicle') {
                        calculateVehicleCredit();
                      } else {
                        setHousingCreditAmount(remainingAfterDownPayment);
                        calculateHousingCredit();
                      }
                    }}
                    disabled={isCalculating}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {loanType === 'vehicle' ? 'Taşıt kredisi teklifleri hesaplanıyor...' : 'Konut kredisi teklifleri hesaplanıyor...'}
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        {loanType === 'vehicle' ? 'Taşıt Kredisi Tekliflerini Hesapla' : 'Konut Kredisi Tekliflerini Hesapla'}
                      </>
                    )}
                  </button>
                )}
                
                {((loanType === 'housing' && remainingAfterDownPayment <= 0) || (loanType === 'vehicle' && getVehicleCreditLimit(housePrice) <= 0)) && (
                  <div className="text-center py-4">
                    {loanType === 'vehicle' ? (
                      <>
                        <p className="text-red-600 font-medium">Bu fiyat aralığında taşıt kredisi verilmemektedir.</p>
                        <p className="text-sm text-red-500 mt-1">İhtiyaç kredisine geçebilirsiniz.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-red-600 font-medium">Konut kredisi için yeterli tutar kalmamış.</p>
                        <p className="text-sm text-red-500 mt-1">Peşinat tutarlarını azaltın veya ev fiyatını artırın.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Credit Offers */}
              {((loanType === 'housing' && housingCreditOffers.length > 0) || (loanType === 'vehicle' && vehicleCreditOffers.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">{loanType === 'vehicle' ? 'Taşıt Kredisi Teklifleri' : 'Konut Kredisi Teklifleri'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {(loanType === 'vehicle' ? vehicleCreditOffers : housingCreditOffers).map((offer, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                          (loanType === 'vehicle' ? selectedVehicleCredit?.bankName : selectedHousingCredit?.bankName) === offer.bankName
                            ? 'border-[#ffb700] bg-[#fff8e1]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (loanType === 'vehicle') {
                            setSelectedVehicleCredit(offer);
                          } else {
                            setSelectedHousingCredit(offer);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{offer.bankName}</h4>
                          {(loanType === 'vehicle' ? selectedVehicleCredit?.bankName : selectedHousingCredit?.bankName) === offer.bankName && (
                            <CheckCircle className="w-5 h-5 text-[#ffb700]" />
                          )}
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="text-gray-600">Faiz Oranı: <span className="font-medium">{offer.interestRate}%</span></p>
                          <p className="text-gray-600">Aylık Taksit: <span className="font-medium text-green-600">{formatCurrency(offer.monthlyPayment)}</span></p>
                          <p className="text-gray-600">Toplam Ödeme: <span className="font-medium">{formatCurrency(offer.totalPayment)}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Credit Summary */}
              {((loanType === 'housing' && selectedHousingCredit) || (loanType === 'vehicle' && selectedVehicleCredit)) && (
                <div className="mb-6 p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h3 className="text-base sm:text-lg font-medium text-green-800 mb-2">{loanType === 'vehicle' ? 'Seçilen Taşıt Kredisi' : 'Seçilen Konut Kredisi'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-green-600">Banka</p>
                      <p className="font-medium">{loanType === 'vehicle' ? selectedVehicleCredit?.bankName : selectedHousingCredit?.bankName}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Kredi Tutarı</p>
                      <p className="font-medium">{loanType === 'vehicle' ? formatCurrency(selectedVehicleCredit?.amount || 0) : formatCurrency(housingCreditAmount)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Aylık Taksit</p>
                      <p className="font-medium">{formatCurrency((loanType === 'vehicle' ? selectedVehicleCredit?.monthlyPayment : selectedHousingCredit?.monthlyPayment) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Kalan Tutar</p>
                      <p className="font-medium">{formatCurrency(loanType === 'vehicle' ? (housePrice - (selectedVehicleCredit?.amount || 0)) : remainingAfterHousingCredit)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('down-payments')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => {
                    if (loanType === 'vehicle') {
                      if ((housePrice - (selectedVehicleCredit?.amount || 0)) > 0) {
                        setCurrentStep('personal-credits');
                      } else {
                        setCurrentStep('payment-plan');
                      }
                    } else {
                      if (remainingAfterHousingCredit > 0) {
                        setCurrentStep('personal-credits');
                      } else {
                        setCurrentStep('payment-plan');
                      }
                    }
                  }}
                  disabled={loanType === 'vehicle' ? !selectedVehicleCredit : !selectedHousingCredit}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {remainingAfterHousingCredit > 0 ? 'İhtiyaç Kredisine Geç' : 'Ödeme Planını Oluştur'}
                </button>
              </div>
            </div>
          )}

          {/* Personal Credits Step */}
          {currentStep === 'personal-credits' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">İhtiyaç Kredileri</h2>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium">Kalan Tutar: {formatCurrency(remainingAfterHousingCredit)}</p>
                <p className="text-sm text-blue-600 mt-1">Bu tutarı birden fazla ihtiyaç kredisi ile karşılayabilirsiniz.</p>
              </div>

              {/* Credit Limits Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">İhtiyaç Kredisi Sınırları:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• 125.000 TL'ye kadar: Maksimum 3 yıl (36 ay)</li>
                  <li>• 250.000 TL'ye kadar: Maksimum 2 yıl (24 ay)</li>
                  <li>• 500.000 TL'ye kadar: Maksimum 1 yıl (12 ay)</li>
                  <li>• 500.000 TL üstü kredi verilmemektedir</li>
                </ul>
              </div>

              {/* Automatic Personal Credit Calculation */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Otomatik İhtiyaç Kredisi Hesaplama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kredi Tutarı: {formatCurrency(Math.min(remainingAfterPersonalCredits, 500000))}
                    </label>
                    <p className="text-sm text-gray-600">Kalan tutar otomatik olarak hesaplanacak</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vade Seçimi
                    </label>
                    <select
                      value={personalCreditTerm}
                      onChange={(e) => {
                        setPersonalCreditTerm(Number(e.target.value));
                        // Vade değiştiğinde otomatik hesaplama yap
                        setTimeout(() => calculatePersonalCredit(), 100);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    >
                      {Math.min(remainingAfterPersonalCredits, 500000) <= 125000 && <option value={36}>3 Yıl (36 Ay)</option>}
                      {Math.min(remainingAfterPersonalCredits, 500000) <= 250000 && <option value={24}>2 Yıl (24 Ay)</option>}
                      {Math.min(remainingAfterPersonalCredits, 500000) <= 500000 && <option value={12}>1 Yıl (12 Ay)</option>}
                    </select>
                  </div>
                </div>
                
                {/* Auto Calculate Button */}
                <div className="mt-4">
                  <button
                    onClick={calculatePersonalCredit}
                    disabled={remainingAfterPersonalCredits <= 0 || isCalculating}
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
                        Otomatik Hesapla
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Personal Credit Offers */}
              {personalCreditOffers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">İhtiyaç Kredisi Teklifleri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalCreditOffers.map((offer, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-all"
                        onClick={() => addPersonalCredit(offer)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{offer.bankName}</h4>
                          <Plus className="w-5 h-5 text-[#ffb700]" />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">Tutar: <span className="font-medium">{formatCurrency(offer.amount)}</span></p>
                          <p className="text-gray-600">Faiz Oranı: <span className="font-medium">{offer.interestRate}%</span></p>
                          <p className="text-gray-600">Aylık Taksit: <span className="font-medium text-green-600">{formatCurrency(offer.monthlyPayment)}</span></p>
                          <p className="text-gray-600">Vade: <span className="font-medium">{personalCreditTerm} Ay</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Personal Credits */}
              {personalCredits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Seçilen İhtiyaç Kredileri</h3>
                  <div className="space-y-3">
                    {personalCredits.map((credit) => (
                      <div key={credit.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{credit.bankName}</h4>
                            <button
                              onClick={() => removePersonalCredit(credit.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Tutar</p>
                              <p className="font-medium">{formatCurrency(credit.amount)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Faiz Oranı</p>
                              <p className="font-medium">{credit.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Aylık Taksit</p>
                              <p className="font-medium">{formatCurrency(credit.monthlyPayment)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Vade</p>
                              <p className="font-medium">{credit.term} Ay</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600 font-medium">Toplam İhtiyaç Kredisi: {formatCurrency(totalPersonalCreditAmount)}</p>
                        <p className="text-green-600">Toplam Aylık Taksit: {formatCurrency(totalPersonalCreditMonthly)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Kalan Tutar: {formatCurrency(remainingAfterPersonalCredits)}</p>
                        {remainingAfterPersonalCredits === 0 && (
                          <p className="text-green-600 font-medium">✓ Tüm tutar karşılandı!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('housing-credit')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('payment-plan')}
                  disabled={remainingAfterPersonalCredits > 0}
                  className="bg-[#ffb700] text-white px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ödeme Planını Oluştur
                </button>
              </div>
            </div>
          )}

          {/* Payment Plan Step */}
          {currentStep === 'payment-plan' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ödeme Planı</h2>
              
              {/* Plan Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Plan Özeti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Ev Fiyatı</p>
                    <p className="text-lg font-semibold text-blue-800">{formatCurrency(housePrice)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Toplam Peşinat</p>
                    <p className="text-lg font-semibold text-green-800">{formatCurrency(totalDownPayment)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Konut Kredisi</p>
                    <p className="text-lg font-semibold text-purple-800">{formatCurrency(housingCreditAmount)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">İhtiyaç Kredileri</p>
                    <p className="text-lg font-semibold text-orange-800">{formatCurrency(totalPersonalCreditAmount)}</p>
                  </div>
                </div>
                
                {/* Additional Expenses */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Ek Masraflar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                      <span className="text-red-600">Tapu Masrafı (%4)</span>
                      <span className="font-medium text-red-700">{formatCurrency(additionalExpenses.titleDeedFee)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                      <span className="text-red-600">Kredi Tahsis Ücreti</span>
                      <span className="font-medium text-red-700">{formatCurrency(additionalExpenses.loanAllocationFee)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                      <span className="text-red-600">Ekspertiz Ücreti</span>
                      <span className="font-medium text-red-700">{formatCurrency(additionalExpenses.appraisalFee)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                      <span className="text-red-600">İpotek Tesis Ücreti</span>
                      <span className="font-medium text-red-700">{formatCurrency(additionalExpenses.mortgageEstablishmentFee)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                      <span className="text-red-600">DASK Sigortası (Yıllık)</span>
                      <span className="font-medium text-red-700">{formatCurrency(additionalExpenses.daskInsurancePremium)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 bg-red-100 rounded font-semibold">
                      <span className="text-red-700">Toplam Ek Masraf</span>
                      <span className="text-red-800">{formatCurrency(additionalExpenses.total)}</span>
                    </div>
                  </div>
                  
                  {/* Final Summary */}
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-gray-700">Toplam Maliyet (Ek Masraflar Dahil)</span>
                      <span className="text-gray-900">{formatCurrency(housePrice + additionalExpenses.total)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Kalan Ödenecek Tutar</span>
                      <span className={`font-medium ${finalRemainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(finalRemainingAmount))}
                        {finalRemainingAmount > 0 ? ' (Eksik)' : finalRemainingAmount < 0 ? ' (Fazla)' : ' (Tam)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Payment Schedule */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Aylık Ödeme Planı</h3>
                
                {/* Current Monthly Payments */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Mevcut Aylık Ödemeler</h4>
                  <div className="space-y-2">
                    {selectedHousingCredit && (
                      <div className="flex justify-between items-center py-2 px-4 bg-purple-50 rounded">
                        <span className="text-purple-700">Konut Kredisi ({selectedHousingCredit.bankName})</span>
                        <span className="font-medium text-purple-800">{formatCurrency(selectedHousingCredit.monthlyPayment)}</span>
                      </div>
                    )}
                    {personalCredits.map((credit) => (
                      <div key={credit.id} className="flex justify-between items-center py-2 px-4 bg-orange-50 rounded">
                        <span className="text-orange-700">İhtiyaç Kredisi ({credit.bankName})</span>
                        <span className="font-medium text-orange-800">{formatCurrency(credit.monthlyPayment)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 px-4 bg-gray-100 rounded font-semibold">
                      <span className="text-gray-700">Toplam Aylık Ödeme</span>
                      <span className="text-gray-900">{formatCurrency((selectedHousingCredit?.monthlyPayment || 0) + totalPersonalCreditMonthly)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Ödeme Zaman Çizelgesi</h4>
                  <div className="space-y-3">
                    {/* Calculate timeline */}
                    {(() => {
                      const timeline = [];
                      const maxTerm = Math.max(
                        selectedHousingCredit?.term || 0,
                        ...personalCredits.map(pc => pc.term)
                      );
                      
                      // Group by year for better visualization
                      for (let year = 1; year <= Math.ceil(maxTerm / 12); year++) {
                        const monthStart = (year - 1) * 12 + 1;
                        const monthEnd = Math.min(year * 12, maxTerm);
                        
                        let yearlyPayment = 0;
                        let activeCredits = [];
                        
                        // Housing credit
                        if (selectedHousingCredit && monthEnd <= selectedHousingCredit.term) {
                          yearlyPayment += selectedHousingCredit.monthlyPayment * 12;
                          activeCredits.push(`Konut Kredisi (${selectedHousingCredit.bankName})`);
                        }
                        
                        // Personal credits
                        personalCredits.forEach(credit => {
                          if (monthEnd <= credit.term) {
                            yearlyPayment += credit.monthlyPayment * 12;
                            activeCredits.push(`İhtiyaç Kredisi (${credit.bankName})`);
                          }
                        });
                        
                        if (yearlyPayment > 0) {
                          timeline.push({
                            year,
                            monthStart,
                            monthEnd,
                            yearlyPayment,
                            monthlyPayment: yearlyPayment / 12,
                            activeCredits
                          });
                        }
                      }
                      
                      return timeline.map((period) => (
                        <div key={period.year} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-gray-800">
                              {period.year}. Yıl ({period.monthStart}-{period.monthEnd}. aylar)
                            </h5>
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(period.monthlyPayment)}/ay
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Aktif Krediler: {period.activeCredits.join(', ')}</p>
                            <p>Yıllık Toplam: {formatCurrency(period.yearlyPayment)}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Save Plan Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Planı Kaydet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Adı *
                    </label>
                    <input
                      type="text"
                      value={paymentPlan.name || ''}
                      onChange={(e) => setPaymentPlan({...paymentPlan, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Örn: Ev Alım Planı 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email ile Paylaş (İsteğe bağlı)
                    </label>
                    <input
                      type="email"
                      value={paymentPlan.shareEmail || ''}
                      onChange={(e) => setPaymentPlan({...paymentPlan, shareEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
                <button
                  onClick={savePlan}
                  disabled={!paymentPlan?.name?.trim() || isSaving}
                  className="mt-4 w-full sm:w-auto bg-[#ffb700] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#e6a500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
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
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                <button
                  onClick={() => setCurrentStep('personal-credits')}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Geri
                </button>
                <button
                  onClick={() => {
                    // Reset to start for new plan
                    setCurrentStep('house-price');
                    setHousePrice(0);
                    setDownPayments([]);
                    setSelectedHousingCredit(null);
                    setPersonalCredits([]);
                    setPaymentPlan({});
                    localStorage.removeItem('paymentPlanState');
                  }}
                  className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Yeni Plan Oluştur
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved Plans Section */}
        {savedPlans.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kaydedilen Planlar</h2>
              <button
                onClick={() => setShowSavedPlans(!showSavedPlans)}
                className="text-[#ffb700] hover:text-[#e6a500] font-medium"
              >
                {showSavedPlans ? 'Gizle' : 'Göster'}
              </button>
            </div>
            {showSavedPlans && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 truncate">{plan.name}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(plan.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ev Fiyatı:</span>
                        <span className="font-medium">{formatCurrency(plan.housePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peşinat:</span>
                        <span className="font-medium">{formatCurrency(plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aylık Ödeme:</span>
                        <span className="font-medium text-green-600">{formatCurrency(plan.totalMonthlyPayment)}</span>
                      </div>
                      {plan.sharedWith && (
                        <div className="text-xs text-blue-600 mt-2">
                          📧 {plan.sharedWith} ile paylaşıldı
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-2">
                      <button
                        onClick={() => viewPlanDetails(plan)}
                        className="flex-1 flex items-center justify-center bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Görüntüle</span>
                        <span className="sm:hidden">Görüntüle</span>
                      </button>
                      <button
                        onClick={() => loadPlanForEditing(plan)}
                        className="flex-1 flex items-center justify-center bg-[#ffb700] text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-[#e6a500] transition-colors text-xs sm:text-sm"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Düzenle</span>
                        <span className="sm:hidden">Düzenle</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPlanPage;