import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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
          const userDocRef = doc(db, `teknokapsul/${user.id}/paymentPlans`, id);
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
    const payments: { month: number; amount: number; description: string }[] = [];
    
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
    let currentMonth = 1;
    
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
      
      currentMonth = endMonth + 1;
    }
    
    return periods;
  };

  const periodicPayments = plan ? calculatePeriodicPayments(plan) : [];

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

  const handleEdit = () => {
    navigate(`/tekno-finans/payment-plans/${id}/edit`);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/tekno-finans/payment-plans/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Plan linki panoya kopyalandı! Bu linki paylaşarak diğer kullanıcıların planınızı görüntülemesini sağlayabilirsiniz.');
    } catch (error) {
      console.error('Link kopyalama hatası:', error);
      // Fallback: Show the URL in a prompt
      const shareUrl = `${window.location.origin}/tekno-finans/payment-plans/${id}`;
      prompt('Plan linkini kopyalayın:', shareUrl);
    }
  };

  const handleDownload = async () => {
    if (!plan) return;
    
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

      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffb700; font-size: 28px; margin-bottom: 10px;">TeknoKapsül - Ödeme Planı</h1>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">${plan.name}</h2>
          <p style="color: #666; font-size: 14px;">Oluşturulma Tarihi: ${formatDate(plan.createdAt)}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #666; font-size: 14px; margin-bottom: 5px;">${plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</h3>
            <p style="color: #333; font-size: 20px; font-weight: bold;">${formatCurrency(plan.price)}</p>
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
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">${plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</h3>
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
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">İhtiyaç Kredileri</h3>
            ${plan.personalCredits.map(credit => `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div><strong>Banka:</strong> ${credit.bankName}</div>
                  <div><strong>Kredi Tutarı:</strong> ${formatCurrency(credit.amount)}</div>
                  <div><strong>Faiz Oranı:</strong> ${credit.interestRate}%</div>
                  <div><strong>Vade:</strong> ${credit.term} Ay</div>
                  <div><strong>Aylık Taksit:</strong> ${formatCurrency(credit.monthlyPayment)}</div>
                  <div><strong>Toplam Ödeme:</strong> ${formatCurrency(credit.totalPayment)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${periodicPayments.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Dönemsel Ödeme Planı</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Kredilerinizin farklı sürelerle bitmesi nedeniyle aylık ödemeniz dönemsel olarak değişecektir:</p>
              ${periodicPayments.map((period, index) => `
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #ffb700;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                      <h4 style="color: #333; font-size: 16px; margin: 0;">${period.description}</h4>
                      <p style="color: #666; font-size: 12px; margin: 2px 0 0 0;">${period.startMonth}. ay - ${period.endMonth}. ay (${period.endMonth - period.startMonth + 1} ay)</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="color: #ffb700; font-size: 18px; font-weight: bold; margin: 0;">${formatCurrency(period.monthlyPayment)}</p>
                      <p style="color: #666; font-size: 12px; margin: 2px 0 0 0;">aylık ödeme</p>
                    </div>
                  </div>
                  <div>
                    <p style="color: #666; font-size: 12px; margin: 0 0 5px 0; font-weight: bold;">Bu dönemde aktif krediler:</p>
                    ${period.activeCredits.map(credit => `
                      <p style="color: #666; font-size: 11px; margin: 0 0 2px 15px;">• ${credit}</p>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Ek Masraflar</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${(() => {
              const additionalExpenses = plan.additionalExpenses || calculateAdditionalExpenses(plan.price);
              return `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>Tapu Masrafı (%4)</span>
                  <span style="font-weight: bold;">${formatCurrency(additionalExpenses.titleDeedFee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>Kredi Tahsis Ücreti</span>
                  <span style="font-weight: bold;">${formatCurrency(additionalExpenses.loanAllocationFee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>Ekspertiz Ücreti</span>
                  <span style="font-weight: bold;">${formatCurrency(additionalExpenses.appraisalFee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>İpotek Tesis Ücreti</span>
                  <span style="font-weight: bold;">${formatCurrency(additionalExpenses.mortgageEstablishmentFee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span>DASK Sigorta Primi (Yıllık)</span>
                  <span style="font-weight: bold;">${formatCurrency(additionalExpenses.daskInsurancePremium)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 10px; border-top: 2px solid #ffb700; font-weight: bold; font-size: 16px;">
                  <span>Toplam Ek Masraf</span>
                  <span>${formatCurrency(additionalExpenses.total)}</span>
                </div>
              `;
            })()} 
          </div>
        </div>
        
        ${plan.monthlyPayments && plan.monthlyPayments.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #ffb700; padding-bottom: 5px;">Aylık Ödeme Planı</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; font-weight: bold; padding: 10px; background: #ffb700; color: white; border-radius: 4px; margin-bottom: 10px;">
                <div>Ay</div>
                <div>${plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
                <div>Kişisel Krediler</div>
                <div>Toplam Aylık</div>
              </div>
              ${plan.monthlyPayments.slice(0, 24).map(payment => {
                const personalTotal = payment.personalPayments ? payment.personalPayments.reduce((sum: number, pp: any) => sum + pp.amount, 0) : 0;
                return `
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; padding: 8px; border-bottom: 1px solid #ddd;">
                    <div><strong>${payment.month}. Ay</strong></div>
                    <div>${formatCurrency(payment.housingPayment || 0)}</div>
                    <div>${formatCurrency(personalTotal)}</div>
                    <div style="color: #dc3545; font-weight: bold;">${formatCurrency(payment.totalPayment || 0)}</div>
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
                <p style="color: #333; font-size: 18px; font-weight: bold;">${formatCurrency((plan.housingCredit?.totalPayment || 0) + plan.personalCredits.reduce((sum, c) => sum + c.totalPayment, 0))}</p>
              </div>
            </div>
          </div>
        </div>
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

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-800">{error || 'Plan bulunamadı'}</p>
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

  const totalDownPayment = plan.downPayments.reduce((sum, dp) => sum + dp.amount, 0);
  const totalPersonalCreditAmount = plan.personalCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const housingCreditAmount = plan.housingCredit?.amount || 0;
  const remainingAmount = plan.price - totalDownPayment - housingCreditAmount - totalPersonalCreditAmount;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 relative">
            <button
              onClick={() => navigate('/tekno-finans/payment-plans')}
              className="absolute left-0 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="bg-[#ffb700] p-3 rounded-full mr-3">
              {plan.type === 'vehicle' ? <Car className="w-8 h-8 text-white" /> : <Home className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {plan.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(plan.createdAt)} tarihinde oluşturuldu
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {user && user.id === plan.userId && (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Share className="w-4 h-4 mr-2" />
            Paylaş
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF İndir
          </button>
        </div>

        {/* Plan Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Özeti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                {plan.type === 'vehicle' ? <Car className="w-6 h-6 text-gray-600" /> : <Home className="w-6 h-6 text-gray-600" />}
              </div>
              <p className="text-sm text-gray-600">{plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(plan.price)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Toplam Peşinat</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalDownPayment)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</p>
              <p className="text-lg font-semibold text-blue-600">{formatCurrency(housingCreditAmount)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">İhtiyaç Kredileri</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(totalPersonalCreditAmount)}</p>
            </div>
          </div>
        </div>

        {/* Down Payments */}
        {plan.downPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Peşinat Ödemeleri</h2>
            <div className="space-y-3">
              {plan.downPayments.map((payment, index) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <CreditCard className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.description}</p>
                      <p className="text-sm text-gray-600">Peşinat #{index + 1}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Toplam Peşinat: {formatCurrency(totalDownPayment)}</p>
            </div>
          </div>
        )}

        {/* Housing/Vehicle Credit */}
        {plan.housingCredit && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kredi Tutarı</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(plan.housingCredit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aylık Ödeme</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(plan.housingCredit.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vade</p>
                  <p className="text-lg font-semibold text-blue-600">{plan.housingCredit.term} ay</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Credits */}
        {plan.personalCredits.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">İhtiyaç Kredileri</h2>
            <div className="space-y-3">
              {plan.personalCredits.map((credit, index) => (
                <div key={credit.id} className="p-4 bg-orange-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Kredi #{index + 1}</p>
                      <p className="font-medium text-gray-900">{credit.bankName || 'Banka'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tutar</p>
                      <p className="text-lg font-semibold text-orange-600">{formatCurrency(credit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aylık Ödeme</p>
                      <p className="text-lg font-semibold text-orange-600">{formatCurrency(credit.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vade</p>
                      <p className="text-lg font-semibold text-orange-600">{credit.term} ay</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-orange-800">Toplam İhtiyaç Kredisi: {formatCurrency(totalPersonalCreditAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Toplam Aylık Ödeme: {formatCurrency(plan.personalCredits.reduce((sum, credit) => sum + credit.monthlyPayment, 0))}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Finansal Özet</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">{plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</span>
              <span className="font-semibold">{formatCurrency(plan.price)}</span>
            </div>
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
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ek Masraflar</h2>
          {(() => {
            const additionalExpenses = plan.additionalExpenses || calculateAdditionalExpenses(plan.price);
            return (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tapu Masrafı (%4)</span>
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
                <div className="flex justify-between items-center py-3 bg-[#ffb700]/10 rounded-lg px-4">
                  <span className="font-semibold text-gray-900">Toplam Ek Masraf</span>
                  <span className="font-bold text-lg text-[#ffb700]">{formatCurrency(additionalExpenses.total)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Periodic Payment Schedule */}
        {periodicPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Dönemsel Ödeme Planı</h2>
            <div className="space-y-4">
              {periodicPayments.map((period, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{period.description}</h3>
                      <p className="text-sm text-gray-600">
                        {period.startMonth}. ay - {period.endMonth}. ay ({period.endMonth - period.startMonth + 1} ay)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#ffb700]">
                        {formatCurrency(period.monthlyPayment)}
                      </p>
                      <p className="text-sm text-gray-600">aylık</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Aktif Krediler:</p>
                    {period.activeCredits.map((credit, creditIndex) => (
                      <p key={creditIndex} className="text-sm text-gray-600 ml-2">• {credit}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Aylık Ödeme Özeti</h2>
          <div className="bg-[#ffb700]/10 p-6 rounded-lg text-center">
            <div className="flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-[#ffb700] mr-3" />
              <DollarSign className="w-8 h-8 text-[#ffb700]" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Toplam Aylık Ödeme</p>
            <p className="text-3xl font-bold text-[#ffb700]">
              {formatCurrency(plan.totalMonthlyPayment)}
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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