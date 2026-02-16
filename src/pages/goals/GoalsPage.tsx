import React, { useState, useEffect } from 'react';
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, DollarSign, Pause, PlusCircle } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';
import { calculateDaysRemaining } from '../../utils/date';
import { useFirebaseData } from '../../hooks/useFirebaseData';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'TL' | 'USD' | 'EUR';
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  deadline: Date;
  userId: string;
  createdAt: Date;
  targetDate?: Date;
}

const GOAL_CATEGORIES = {
  savings: { label: 'Tasarruf', color: 'bg-green-500', icon: DollarSign },
  investment: { label: 'Yatırım', color: 'bg-blue-500', icon: TrendingUp },
  debt: { label: 'Borç Ödeme', color: 'bg-red-500', icon: Target },
  purchase: { label: 'Alışveriş', color: 'bg-yellow-500', icon: Calendar },
  other: { label: 'Diğer', color: 'bg-gray-500', icon: Target }
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export const GoalsPage = () => {
  const { user } = useAuth();
  const { data: goals = [], loading, error, reload } = useFirebaseData<Goal>('goals');

  // Anlık kurları al
  useEffect(() => {
    const fetchCurrentRates = async () => {
      try {
        const response = await fetch('https://doviz-api.onrender.com/api');
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setCurrentRates(data.data[0]);
        }
      } catch (error) {
        console.error('Anlık kurlar alınamadı:', error);
      }
    };

    fetchCurrentRates();
    // Her 30 saniyede bir kurları güncelle
    const interval = setInterval(fetchCurrentRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Kur hesaplaması yapan fonksiyon
  const calculateRealTimeProgress = (goal: Goal) => {
    if (!currentRates || goal.currency === 'TL') {
      return calculateProgress(goal.currentAmount, goal.targetAmount);
    }

    let currentAmountInTL = goal.currentAmount;
    let targetAmountInTL = goal.targetAmount;

    if (goal.currency === 'USD' && currentRates.Dolar) {
      const usdRate = parseFloat(currentRates.Dolar.replace(',', '.'));
      currentAmountInTL = goal.currentAmount * usdRate;
      targetAmountInTL = goal.targetAmount * usdRate;
    } else if (goal.currency === 'EUR' && currentRates.Euro) {
      const eurRate = parseFloat(currentRates.Euro.replace(',', '.'));
      currentAmountInTL = goal.currentAmount * eurRate;
      targetAmountInTL = goal.targetAmount * eurRate;
    }

    return calculateProgress(currentAmountInTL, targetAmountInTL);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositData, setDepositData] = useState({
    amount: '',
    currency: 'TL' as 'TL' | 'USD' | 'EUR',
    description: ''
  });
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [currentRates, setCurrentRates] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'savings' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    currency: 'TL' as Goal['currency']
  });

  const userGoals = goals.filter(goal => goal.userId === user?.id);
  const activeGoals = userGoals.filter(goal => goal.status !== 'completed');
  const completedGoals = userGoals.filter(goal => goal.status === 'completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: 0,
        userId: user.id,
        status: 'active' as Goal['status'],
        deadline: new Date(formData.targetDate),
        createdAt: new Date()
      };

      if (editingGoal) {
        // Güncelleme işlemi
        await updateDoc(doc(db, 'teknokapsul', user.id, 'goals', editingGoal.id), goalData);
      } else {
        // Yeni hedef ekleme
        await addDoc(collection(db, 'teknokapsul', user.id, 'goals'), goalData);
      }
      
      setIsModalOpen(false);
      setEditingGoal(null);
      resetForm();
      await reload();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      targetDate: '',
      category: 'savings',
      priority: 'medium',
      currency: 'TL'
    });
  };



  const handlePause = async (goalId: string) => {
    if (!user || !window.confirm('Bu hedefi pasife almak istediğinizden emin misiniz?')) return;

    try {
      await updateDoc(doc(db, 'teknokapsul', user.id, 'goals', goalId), {
        status: 'paused',
        updatedAt: new Date()
      });
      await reload();
    } catch (error) {
      console.error('Error pausing goal:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal) return;

    try {
      let depositAmount = parseFloat(depositData.amount);
      
      // Döviz kurunu al ve TL'ye çevir
       if (depositData.currency !== 'TL') {
         try {
           const response = await fetch('https://doviz-api.onrender.com/api');
           const data = await response.json();
           
           if (data.success && data.data && data.data.length > 0) {
             const rates = data.data[0];
             if (depositData.currency === 'USD' && rates.Dolar) {
               const usdRate = parseFloat(rates.Dolar.replace(',', '.'));
               depositAmount = depositAmount * usdRate;
             } else if (depositData.currency === 'EUR' && rates.Euro) {
               const eurRate = parseFloat(rates.Euro.replace(',', '.'));
               depositAmount = depositAmount * eurRate;
             }
           }
         } catch (error) {
           console.error('Döviz kuru alınamadı:', error);
           alert('Döviz kuru alınamadı. Lütfen tekrar deneyin.');
           return;
         }
       }

      const newCurrentAmount = selectedGoal.currentAmount + depositAmount;
      const newStatus = newCurrentAmount >= selectedGoal.targetAmount ? 'completed' : 'active';

      await updateDoc(doc(db, 'teknokapsul', user.id, 'goals', selectedGoal.id), {
        currentAmount: newCurrentAmount,
        status: newStatus,
        updatedAt: new Date()
      });
      
      setIsDepositModalOpen(false);
      setSelectedGoal(null);
      setDepositData({ amount: '', currency: 'TL', description: '' });
      await reload();
    } catch (error) {
      console.error('Error depositing to goal:', error);
    }
  };

  const openDepositModal = async (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDepositModalOpen(true);
    
    // Döviz kurlarını al
     try {
       const response = await fetch('https://doviz-api.onrender.com/api');
       const data = await response.json();
       if (data.success && data.data && data.data.length > 0) {
         setExchangeRates(data.data[0]);
       }
     } catch (error) {
       console.error('Error fetching exchange rates:', error);
     }
  };



  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Hedefler yüklenirken bir hata oluştu." />;

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-blue px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Hedeflerim</h1>
                <p className="text-white/60 text-xs">Finansal hedef takibi</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingGoal(null); resetForm(); setIsModalOpen(true); }}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{activeGoals.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Aktif</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{completedGoals.length}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Tamamlanan</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-sm">{formatCurrency(activeGoals.reduce((sum, g) => sum + g.targetAmount, 0))}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">Hedef</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-4">
            <h2 className="section-title mb-3">Aktif Hedefler</h2>
            <div className="space-y-3">
              {activeGoals.map(goal => {
                const progress = calculateRealTimeProgress(goal);
                const targetDateStr = goal.targetDate instanceof Date ? goal.targetDate.toISOString().split('T')[0] : goal.targetDate;
                const deadlineStr = goal.deadline instanceof Date ? goal.deadline.toISOString().split('T')[0] : goal.deadline;
                const daysRemaining = calculateDaysRemaining(targetDateStr || deadlineStr || '');
                const category = GOAL_CATEGORIES[goal.category as keyof typeof GOAL_CATEGORIES];
                const CategoryIcon = category.icon;
                
                return (
                  <div key={goal.id} className="bank-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${category.color} text-white flex items-center justify-center`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_COLORS[goal.priority]}`}>
                            {goal.priority === 'high' ? 'Yüksek' : goal.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openDepositModal(goal)} className="p-1.5 text-muted-foreground hover:text-emerald-500 transition-colors" title="Para Yatır">
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePause(goal.id)} className="p-1.5 text-muted-foreground hover:text-amber-500 transition-colors" title="Pasife Al">
                          <Pause className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {goal.description && <p className="text-xs text-muted-foreground mb-3">{goal.description}</p>}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">İlerleme</span>
                        <span className="font-semibold text-foreground">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{goal.currentAmount.toFixed(2)} {goal.currency}</span>
                        <span>{goal.targetAmount.toFixed(2)} {goal.currency}</span>
                      </div>
                      {currentRates && goal.currency !== 'TL' && (
                        <div className="text-[11px] text-primary">
                          {goal.currency === 'USD' && currentRates.Dolar && <span>1 USD = {currentRates.Dolar} TL</span>}
                          {goal.currency === 'EUR' && currentRates.Euro && <span>1 EUR = {currentRates.Euro} TL</span>}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{daysRemaining > 0 ? `${daysRemaining} gün kaldı` : 'Süre doldu'}</span>
                      <span>{category.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mb-4">
            <h2 className="section-title mb-3">Tamamlanan Hedefler</h2>
            <div className="space-y-3">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bank-card p-4 border-l-4 border-l-emerald-400">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
                      <span className="text-[10px] text-emerald-600">Tamamlandı</span>
                    </div>
                  </div>
                  {goal.description && <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Hedef Tutar:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {userGoals.length === 0 && (
          <div className="bank-card p-10 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Henüz hedef yok</h3>
            <p className="text-xs text-muted-foreground">İlk hedefinizi oluşturmak için + butonunu kullanın.</p>
          </div>
        )}

        {/* Goal Form Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">
                {editingGoal ? 'Hedef Düzenle' : 'Yeni Hedef Ekle'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef Başlığı
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Acil durum fonu"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hedef hakkında detaylar..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Tutar
                    </label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Para Birimi
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as Goal['currency'] }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="TL">Türk Lirası (TL)</option>
                      <option value="USD">Amerikan Doları (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(GOAL_CATEGORIES).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#ffb700' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
                  >
                    {editingGoal ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Para Yatırma Modalı */}
        {isDepositModalOpen && selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Para Yatır - {selectedGoal.title}</h2>
              
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Para Birimi
                   </label>
                   <select
                     value={depositData.currency}
                     onChange={(e) => setDepositData({ ...depositData, currency: e.target.value as 'TL' | 'USD' | 'EUR' })}
                     className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="TL">Türk Lirası (TL)</option>
                     <option value="USD">Amerikan Doları (USD)</option>
                     <option value="EUR">Euro (EUR)</option>
                   </select>
                   
                   {/* Anlık Kur Bilgisi */}
                   {exchangeRates && depositData.currency !== 'TL' && (
                     <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
                       <div className="font-medium text-blue-800">Anlık Kur:</div>
                       {depositData.currency === 'USD' && exchangeRates.Dolar && (
                         <div className="text-blue-700">
                           1 USD = {exchangeRates.Dolar} TL
                         </div>
                       )}
                       {depositData.currency === 'EUR' && exchangeRates.Euro && (
                         <div className="text-blue-700">
                           1 EUR = {exchangeRates.Euro} TL
                         </div>
                       )}
                     </div>
                   )}
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tutar
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Yatırılacak tutar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={depositData.description}
                    onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Para yatırma açıklaması"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDepositModalOpen(false);
                      setSelectedGoal(null);
                      setDepositData({ amount: '', currency: 'TL', description: '' });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Para Yatır
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};