import React, { useState, useEffect } from 'react';
import { PieChart, Plus, TrendingUp, TrendingDown, AlertTriangle, Edit, Trash2, DollarSign } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { getUserExpenses } from '../../services/expense.service';
import { getUserIncomes } from '../../services/income.service';
import { Expense } from '../../types/expense';
import { Income } from '../../types/income';

interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
  color: string;
  icon: string;
  userId: string;
  month: number;
  year: number;
}

interface BudgetPlan {
  id: string;
  name: string;
  totalBudget: number;
  month: number;
  year: number;
  period: string;
  categories: {
    [key: string]: {
      name: string;
      budget: number;
      spent: number;
    };
  };
  userId: string;
  createdAt: Date;
}

const CATEGORY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const DEFAULT_CATEGORIES = [
  { name: 'Gıda & Market', icon: '🛒' },
  { name: 'Ulaşım', icon: '🚗' },
  { name: 'Barınma', icon: '🏠' },
  { name: 'Sağlık', icon: '🏥' },
  { name: 'Eğlence', icon: '🎬' },
  { name: 'Giyim', icon: '👕' },
  { name: 'Teknoloji', icon: '📱' },
  { name: 'Diğer', icon: '📦' }
];

export const BudgetPage = () => {
  const { user } = useAuth();
  const { data: budgetPlans = [], loading, error, reload } = useFirebaseData<BudgetPlan>('budget');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BudgetPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BudgetPlan | null>(null);
  const [currentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    totalBudget: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    budgetAmount: '',
    icon: '📦'
  });

  const userBudgetPlans = budgetPlans.filter(plan => plan.userId === user?.id);
  const currentPlan = userBudgetPlans.find(plan => 
    plan.month === currentDate.getMonth() + 1 && 
    plan.year === currentDate.getFullYear()
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const [userExpenses, userIncomes] = await Promise.all([
          getUserExpenses(user.id, currentDate.getFullYear(), currentDate.getMonth() + 1),
          getUserIncomes(user.id, currentDate.getFullYear(), currentDate.getMonth() + 1)
        ]);
        
        setExpenses(userExpenses);
        setIncomes(userIncomes);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [user, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const planData = {
        ...formData,
        totalBudget: parseFloat(formData.totalBudget),
        userId: user.id,
        period: 'monthly',
        categories: DEFAULT_CATEGORIES.map((cat, index) => ({
          id: `cat_${Date.now()}_${index}`,
          name: cat.name,
          budgetAmount: 0,
          spentAmount: 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          icon: cat.icon,
          userId: user.id,
          month: formData.month,
          year: formData.year
        })),
        createdAt: new Date()
      };

      // Firebase'e kaydet
      await addDoc(collection(db, 'teknokapsul', user.id, 'budget'), planData);
      
      setIsModalOpen(false);
      setEditingPlan(null);
      resetForm();
      await reload();
    } catch (error) {
      console.error('Error saving budget plan:', error);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      const newCategory: BudgetCategory = {
        id: `cat_${Date.now()}`,
        name: categoryFormData.name,
        budgetAmount: parseFloat(categoryFormData.budgetAmount),
        spentAmount: 0,
        color: CATEGORY_COLORS[Object.keys(selectedPlan.categories).length % CATEGORY_COLORS.length],
        icon: categoryFormData.icon,
        userId: user!.id,
        month: selectedPlan.month,
        year: selectedPlan.year
      };

      // Firebase'de kategori ekleme işlemi burada yapılacak
      console.log('Adding category:', newCategory);
      
      setIsCategoryModalOpen(false);
      resetCategoryForm();
      await reload();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalBudget: '',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      budgetAmount: '',
      icon: '📦'
    });
  };

  const calculateCategorySpent = (categoryName: string) => {
    return expenses
      .filter(expense => expense.category === categoryName && expense.isActive)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateTotalSpent = () => {
    return expenses
      .filter(expense => expense.isActive)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const calculateTotalIncome = () => {
    return incomes
      .filter(income => income.isActive)
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    if (percentage >= 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Bütçe planları yüklenirken bir hata oluştu." />;

  const totalIncome = calculateTotalIncome();
  const totalSpent = calculateTotalSpent();
  const totalBudget = currentPlan?.totalBudget || 0;
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <PieChart className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bütçe Planlama</h1>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            style={{ backgroundColor: '#ffb700' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
          >
            <Plus className="w-4 h-4" />
            Yeni Bütçe Planı
          </button>
        </div>

        {/* Current Month Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aylık Gelir</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Bütçe</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Harcanan</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${
                  remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kalan</p>
                <p className={`text-lg font-bold ${
                  remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(remainingBudget)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Plan Categories */}
        {currentPlan && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentPlan.name} - {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    setSelectedPlan(currentPlan);
                    resetCategoryForm();
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Kategori Ekle
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {Object.values(currentPlan.categories).map((category: any) => {
                  const spentAmount = calculateCategorySpent(category.name);
                  const percentage = category.budgetAmount > 0 ? (spentAmount / category.budgetAmount) * 100 : 0;
                  const status = getBudgetStatus(spentAmount, category.budgetAmount);
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Harcanan</span>
                          <span className={`font-medium ${status.color}`}>
                            {formatCurrency(spentAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percentage >= 100 ? 'bg-red-500' :
                              percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{percentage.toFixed(1)}%</span>
                          <span>Bütçe: {formatCurrency(category.budgetAmount)}</span>
                        </div>
                      </div>
                      
                      {percentage >= 100 && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600">Bütçe aşıldı!</span>
                        </div>
                      )}
                      
                      {percentage >= 80 && percentage < 100 && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs text-yellow-600">Bütçe sınırına yaklaşıyor</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Budget Plans History */}
        {userBudgetPlans.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bütçe Planları Geçmişi</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {userBudgetPlans.map(plan => {
                  const planDate = new Date(plan.year, plan.month - 1);
                  const isCurrentPlan = plan.month === currentDate.getMonth() + 1 && plan.year === currentDate.getFullYear();
                  
                  return (
                    <div key={plan.id} className={`border rounded-lg p-3 sm:p-4 ${
                      isCurrentPlan ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        {isCurrentPlan && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dönem:</span>
                          <span className="font-medium">
                            {planDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Toplam Bütçe:</span>
                          <span className="font-medium">{formatCurrency(plan.totalBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kategori Sayısı:</span>
                          <span className="font-medium">{Object.keys(plan.categories).length}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedPlan(plan)}
                          className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Detayları Görüntüle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {userBudgetPlans.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <PieChart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz bütçe planı yok</h3>
              <p className="text-gray-500 mb-6">
                İlk bütçe planınızı oluşturmak için yukarıdaki "Yeni Bütçe Planı" butonunu kullanın.
              </p>
            </div>
          </div>
        )}

        {/* Budget Plan Form Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">
                {editingPlan ? 'Bütçe Planı Düzenle' : 'Yeni Bütçe Planı'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Aylık Bütçe Planı"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Bütçe (₺)
                  </label>
                  <input
                    type="number"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalBudget: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ay
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const monthName = new Date(2024, i).toLocaleString('tr-TR', { month: 'long' });
                        return (
                          <option key={month} value={month}>{monthName}</option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yıl
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = currentDate.getFullYear() + i;
                        return (
                          <option key={year} value={year}>{year}</option>
                        );
                      })}
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
                    {editingPlan ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Category Form Modal */}
        {isCategoryModalOpen && (
          <Modal onClose={() => setIsCategoryModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">Yeni Kategori Ekle</h2>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Spor & Fitness"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bütçe Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    value={categoryFormData.budgetAmount}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, budgetAmount: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İkon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {['🛒', '🚗', '🏠', '🏥', '🎬', '👕', '📱', '📦', '🍕', '⚽', '📚', '💊', '🎵', '✈️', '🎯', '💰'].map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setCategoryFormData(prev => ({ ...prev, icon }))}
                        className={`p-3 text-xl border rounded-lg hover:bg-gray-50 transition-colors ${
                          categoryFormData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
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
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};