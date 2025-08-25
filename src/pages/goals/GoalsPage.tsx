import React, { useState } from 'react';
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, Edit, Trash2, DollarSign } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings' as Goal['category'],
    priority: 'medium' as Goal['priority']
  });

  const userGoals = goals.filter(goal => goal.userId === user?.uid);
  const activeGoals = userGoals.filter(goal => goal.status !== 'completed');
  const completedGoals = userGoals.filter(goal => goal.status === 'completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount || '0'),
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
      currentAmount: '',
      targetDate: '',
      category: 'savings',
      priority: 'medium'
    });
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : goal.deadline.toISOString().split('T')[0],
      category: goal.category,
      priority: goal.priority
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!user) return;
    if (window.confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'teknokapsul', user.id, 'goals', goalId));
        await reload();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };



  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Hedefler yüklenirken bir hata oluştu." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Hedeflerim</h1>
          </div>
          <button
            onClick={() => {
              setEditingGoal(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            style={{ backgroundColor: '#ffb700' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
          >
            <Plus className="w-4 h-4" />
            Yeni Hedef Ekle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Hedef</p>
                <p className="text-xl font-bold text-gray-900">{userGoals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
                <p className="text-xl font-bold text-gray-900">{completedGoals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-xl font-bold text-gray-900">{activeGoals.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Hedef</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aktif Hedefler</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.map(goal => {
                  const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                  const targetDateStr = goal.targetDate instanceof Date ? goal.targetDate.toISOString().split('T')[0] : goal.targetDate;
                  const deadlineStr = goal.deadline instanceof Date ? goal.deadline.toISOString().split('T')[0] : goal.deadline;
                  const daysRemaining = calculateDaysRemaining(targetDateStr || deadlineStr || '');
                  const category = GOAL_CATEGORIES[goal.category as keyof typeof GOAL_CATEGORIES];
                  const CategoryIcon = category.icon;
                  
                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${category.color} text-white`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm">{goal.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[goal.priority]}`}>
                              {goal.priority === 'high' ? 'Yüksek' : goal.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(goal)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">İlerleme</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{formatCurrency(goal.currentAmount)}</span>
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            {daysRemaining > 0 ? `${daysRemaining} gün kaldı` : 'Süre doldu'}
                          </span>
                          <span className="text-gray-600">{category.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tamamlanan Hedefler</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedGoals.map(goal => {
                  return (
                    <div key={goal.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-green-500 text-white">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{goal.title}</h3>
                          <span className="text-xs text-green-600">Tamamlandı</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">{goal.description}</p>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Hedef Tutar:</span>
                        <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {userGoals.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz hedef yok</h3>
              <p className="text-gray-500 mb-6">
                İlk hedefinizi oluşturmak için yukarıdaki "Yeni Hedef Ekle" butonunu kullanın.
              </p>
            </div>
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
                      Hedef Tutar (₺)
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
                      Mevcut Tutar (₺)
                    </label>
                    <input
                      type="number"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
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
      </div>
    </div>
  );
};