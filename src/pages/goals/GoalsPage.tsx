import React, { useState, useEffect } from 'react';
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, DollarSign, Pause, PlusCircle, ArrowLeft, Settings } from 'lucide-react';
import { addDoc, collection, doc, updateDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';
import { calculateDaysRemaining } from '../../utils/date';
import { useNavigate } from 'react-router-dom';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'TRY' | 'USD' | 'EUR';
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  targetDate: string; // Store as ISO string
  userId: string;
  createdAt: { seconds: number; nanoseconds: number; };
}

const GOAL_CATEGORIES: { [key: string]: { label: string; color: string; icon: React.ElementType } } = {
  savings: { label: 'Tasarruf', color: 'bg-green-500', icon: DollarSign },
  investment: { label: 'Yatırım', color: 'bg-blue-500', icon: TrendingUp },
  debt: { label: 'Borç Ödeme', color: 'bg-red-500', icon: Target },
  purchase: { label: 'Büyük Alışveriş', color: 'bg-purple-500', icon: Calendar },
  other: { label: 'Diğer', color: 'bg-gray-500', icon: Target }
};

const PRIORITY_STYLES = {
  low: { text: 'Düşük', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
  medium: { text: 'Orta', className: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' },
  high: { text: 'Yüksek', className: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' }
};

export const GoalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRates, setCurrentRates] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    category: 'savings',
    priority: 'medium',
    currency: 'TRY' as Goal['currency']
  });

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, `users/${user.id}/goals`));
      const querySnapshot = await getDocs(q);
      const goalsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      setGoals(goalsData);
    } catch (err) {
      setError('Hedefler yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();

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
    const interval = setInterval(fetchCurrentRates, 60000); // Update every minute
    return () => clearInterval(interval);

  }, [user]);

  const openModalForNew = () => {
    setEditingGoal(null);
    setFormData({ title: '', description: '', targetAmount: '', targetDate: '', category: 'savings', priority: 'medium', currency: 'TRY' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetAmount: String(goal.targetAmount),
      targetDate: goal.targetDate,
      category: goal.category,
      priority: goal.priority,
      currency: goal.currency
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const goalData = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      userId: user.id,
      updatedAt: new Date(),
    };

    try {
      if (editingGoal) {
        const goalRef = doc(db, 'users', user.id, 'goals', editingGoal.id);
        await updateDoc(goalRef, goalData);
      } else {
        const newGoalData = {
          ...goalData,
          currentAmount: 0,
          status: 'active' as Goal['status'],
          createdAt: new Date(),
        };
        await addDoc(collection(db, 'users', user.id, 'goals'), newGoalData);
      }
      
      setIsModalOpen(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Hedef kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }

    try {
      const newCurrentAmount = selectedGoal.currentAmount + amount;
      const newStatus = newCurrentAmount >= selectedGoal.targetAmount ? 'completed' : 'active';

      const goalRef = doc(db, 'users', user.id, 'goals', selectedGoal.id);
      await updateDoc(goalRef, { currentAmount: newCurrentAmount, status: newStatus });

      setIsDepositModalOpen(false);
      setSelectedGoal(null);
      setDepositAmount('');
      fetchGoals();
    } catch (error) {
      console.error('Error depositing to goal:', error);
      setError('Para yatırma işleminde hata oluştu.');
    }
  };

  const toggleGoalStatus = async (goal: Goal, status: 'active' | 'paused' | 'completed') => {
    if (!user) return;
    try {
      const goalRef = doc(db, 'users', user.id, 'goals', goal.id);
      await updateDoc(goalRef, { status });
      fetchGoals();
    } catch (error) {
      console.error(`Error updating goal status to ${status}:`, error);
      setError(`Hedef durumu güncellenirken bir hata oluştu.`);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const activeGoals = goals.filter(g => g.status === 'active');
  const pausedGoals = goals.filter(g => g.status === 'paused');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              </button>
              <div className="flex items-center gap-2">
                <Target className="w-7 h-7 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hedeflerim</h1>
              </div>
            </div>
          <button onClick={openModalForNew} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600">
            <Plus size={16} />
            Yeni Hedef
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">Henüz hedef oluşturulmadı.</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">İlk hedefini oluşturarak birikime başla.</p>
            <div className="mt-6">
              <button onClick={openModalForNew} type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Yeni Hedef Ekle
              </button>
            </div>
          </div>
        ) : (
          <>
            <GoalSection title="Aktif Hedefler" goals={activeGoals} onDeposit={setSelectedGoal} onToggleStatus={toggleGoalStatus} onEdit={openModalForEdit} calculateProgress={calculateProgress} rates={currentRates} />
            <GoalSection title="Durdurulan Hedefler" goals={pausedGoals} onDeposit={setSelectedGoal} onToggleStatus={toggleGoalStatus} onEdit={openModalForEdit} calculateProgress={calculateProgress} rates={currentRates} />
            <GoalSection title="Tamamlanan Hedefler" goals={completedGoals} onDeposit={setSelectedGoal} onToggleStatus={toggleGoalStatus} onEdit={openModalForEdit} calculateProgress={calculateProgress} rates={currentRates} />
          </>
        )}
      </main>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">{editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef Ekle'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Hedef Başlığı (Örn: Tatil Fonu)" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              <textarea placeholder="Açıklama" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Hedef Tutar" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as Goal['currency'] })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <input type="date" value={formData.targetDate} onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {Object.entries(GOAL_CATEGORIES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Goal['priority'] })} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Kaydet</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {selectedGoal && (
        <Modal onClose={() => setSelectedGoal(null)}>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Para Ekle: {selectedGoal.title}</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <input type="number" placeholder="Eklenecek Tutar" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setSelectedGoal(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Ekle</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface GoalSectionProps {
  title: string;
  goals: Goal[];
  rates: any;
  onDeposit: (goal: Goal) => void;
  onToggleStatus: (goal: Goal, status: 'active' | 'paused' | 'completed') => void;
  onEdit: (goal: Goal) => void;
  calculateProgress: (current: number, target: number) => number;
}

const GoalSection: React.FC<GoalSectionProps> = ({ title, goals, onDeposit, onToggleStatus, onEdit, calculateProgress, rates }) => {
  if (goals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} rates={rates} onDeposit={onDeposit} onToggleStatus={onToggleStatus} onEdit={onEdit} calculateProgress={calculateProgress} />
        ))}
      </div>
    </div>
  );
};

interface GoalCardProps {
  goal: Goal;
  rates: any;
  onDeposit: (goal: Goal) => void;
  onToggleStatus: (goal: Goal, status: 'active' | 'paused' | 'completed') => void;
  onEdit: (goal: Goal) => void;
  calculateProgress: (current: number, target: number) => number;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, rates, onDeposit, onToggleStatus, onEdit, calculateProgress }) => {
  const getRate = (currency: 'USD' | 'EUR') => {
    if (!rates) return 1;
    const rateStr = currency === 'USD' ? rates.Dolar : rates.Euro;
    return parseFloat(rateStr.replace(',', '.')) || 1;
  };

  const currentAmountInTRY = goal.currency === 'TRY' ? goal.currentAmount : goal.currentAmount * getRate(goal.currency);
  const targetAmountInTRY = goal.currency === 'TRY' ? goal.targetAmount : goal.targetAmount * getRate(goal.currency);

  const progress = calculateProgress(currentAmountInTRY, targetAmountInTRY);
  const daysRemaining = calculateDaysRemaining(goal.targetDate);
  const category = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.other;
  const CategoryIcon = category.icon;
  const priority = PRIORITY_STYLES[goal.priority];
  const isCompleted = goal.status === 'completed';

  return (
    <div className={`border dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between transition-shadow hover:shadow-lg ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}>
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${category.color} text-white`}>
              <CategoryIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{goal.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{category.label}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${priority.className}`}>{priority.text}</span>
        </div>

        <div className="my-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(goal.currentAmount, goal.currency)}</span>
            <span className="text-gray-500 dark:text-gray-400">{formatCurrency(goal.targetAmount, goal.currency)}</span>
          </div>
           {goal.currency !== 'TRY' && (
             <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-right">
                ~ {formatCurrency(targetAmountInTRY, 'TRY')}
             </div>
           )}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${category.color} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-right text-sm font-bold text-gray-700 dark:text-gray-200 mt-1">{progress.toFixed(0)}%</div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{daysRemaining >= 0 ? `${daysRemaining} gün kaldı` : 'Süre doldu'}</span>
          </div>
          {goal.status === 'paused' && <span className="text-orange-500 font-semibold">Durduruldu</span>}
        </div>
      </div>

      <div className="border-t dark:border-gray-700 mt-4 pt-3 flex items-center justify-end gap-2">
        {!isCompleted && (
          <button onClick={() => onDeposit(goal)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-gray-700 rounded-full" title="Para Ekle">
            <PlusCircle size={18} />
          </button>
        )}
        <button onClick={() => onEdit(goal)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Düzenle">
          <Settings size={18} />
        </button>
        {goal.status === 'active' && (
          <button onClick={() => onToggleStatus(goal, 'paused')} className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-full" title="Durdur">
            <Pause size={18} />
          </button>
        )}
        {goal.status === 'paused' && (
          <button onClick={() => onToggleStatus(goal, 'active')} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full" title="Devam Ettir">
            <Clock size={18} />
          </button>
        )}
      </div>
    </div>
  );
};