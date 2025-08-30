import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Home, Car, Download } from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PaymentPlan {
  id: string;
  name: string;
  type: 'housing' | 'vehicle';
  price: number;
  downPayments: { id: string; amount: number; description: string }[];
  housingCredit?: any;
  personalCredits: any[];
  monthlyPayments: any[];
  totalMonthlyPayment: number;
  createdAt: Date;
  sharedWith?: string | null;
  userId?: string;
}

const PaymentPlansListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;
    
    try {
      const plansQuery = query(
        collection(db, `teknokapsul/${user.id}/paymentPlans`),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(plansQuery);
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as PaymentPlan[];
      
      setPlans(plansData.filter(plan => plan.userId === user.id));
    } catch (error) {
      console.error('Planlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return;
    if (!user) return;
    
    setIsDeleting(planId);
    try {
      await deleteDoc(doc(db, `teknokapsul/${user.id}/paymentPlans`, planId));
      setPlans(plans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Plan silinirken hata:', error);
      alert('Plan silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

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
      const totalDownPayment = plan.downPayments?.reduce((sum, dp) => sum + dp.amount, 0) || 0;

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
      
      // Save PDF
      const fileName = `${plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_odeme_plani.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-[#ffb700] p-3 rounded-full mr-3">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Ödeme Planları
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Kayıtlı ödeme planlarınızı görüntüleyin, düzenleyin veya yeni plan oluşturun.
          </p>
        </div>

        {/* New Plan Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate('/tekno-finans/payment-plans/new')}
            className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Plan Oluştur
          </button>
        </div>

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="mb-4">
              <Home className="w-16 h-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz ödeme planınız yok
            </h3>
            <p className="text-gray-600 mb-6">
              İlk ödeme planınızı oluşturmak için aşağıdaki butona tıklayın.
            </p>
            <button
              onClick={() => navigate('/tekno-finans/payment-plans/new')}
              className="bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a500] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Plan Oluştur
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan Adı
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tip
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peşinat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aylık Ödeme
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oluşturulma
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => {
                      const totalDownPayment = plan.downPayments?.reduce((sum, dp) => sum + dp.amount, 0) || 0;
                      
                      return (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {plan.name}
                            </div>
                            {plan.sharedWith && (
                              <div className="text-xs text-blue-600">
                                📧 {plan.sharedWith} ile paylaşıldı
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {plan.type === 'vehicle' ? (
                                <Car className="w-4 h-4 text-blue-600 mr-2" />
                              ) : (
                                <Home className="w-4 h-4 text-green-600 mr-2" />
                              )}
                              <span className="text-sm text-gray-900">
                                {plan.type === 'vehicle' ? 'Taşıt' : 'Konut'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(plan.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(totalDownPayment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(plan.totalMonthlyPayment)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {plan.createdAt.toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/tekno-finans/payment-plans/${plan.id}`)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/tekno-finans/payment-plans/${plan.id}/edit`)}
                                className="text-[#ffb700] hover:text-[#e6a500] p-1 rounded"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => downloadPlanAsPDF(plan)}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="PDF İndir"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePlan(plan.id)}
                                disabled={isDeleting === plan.id}
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                                title="Sil"
                              >
                                {isDeleting === plan.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {plans.map((plan) => {
                const totalDownPayment = plan.downPayments?.reduce((sum, dp) => sum + dp.amount, 0) || 0;
                
                return (
                  <div key={plan.id} className="bg-white rounded-xl shadow-sm border p-4">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {plan.type === 'vehicle' ? (
                            <Car className="w-5 h-5 text-blue-600 mr-2" />
                          ) : (
                            <Home className="w-5 h-5 text-green-600 mr-2" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {plan.name}
                          </h3>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                            {plan.type === 'vehicle' ? 'Taşıt' : 'Konut'}
                          </span>
                          <span className="ml-2">
                            {plan.createdAt.toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        {plan.sharedWith && (
                          <div className="text-xs text-blue-600 mt-1">
                            📧 {plan.sharedWith} ile paylaşıldı
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">
                          {plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(plan.price)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Toplam Peşinat</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(totalDownPayment)}
                        </div>
                      </div>
                    </div>

                    {/* Monthly Payment */}
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <div className="text-xs text-green-600 mb-1">Aylık Ödeme</div>
                      <div className="text-lg font-bold text-green-700">
                        {formatCurrency(plan.totalMonthlyPayment)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/tekno-finans/payment-plans/${plan.id}`)}
                        className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium active:bg-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                        Görüntüle
                      </button>
                      <button
                        onClick={() => navigate(`/tekno-finans/payment-plans/${plan.id}/edit`)}
                        className="bg-[#ffb700] text-white px-4 py-3 rounded-lg hover:bg-[#e6a500] transition-colors flex items-center justify-center gap-2 text-sm font-medium active:bg-[#cc9500]"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => downloadPlanAsPDF(plan)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm active:bg-green-800"
                      >
                        <Download className="w-4 h-4" />
                        PDF İndir
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        disabled={isDeleting === plan.id}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:bg-red-800"
                      >
                        {isDeleting === plan.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentPlansListPage;