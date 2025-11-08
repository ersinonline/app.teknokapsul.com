import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingDown, ArrowLeft } from 'lucide-react';
import { Expense } from '../../types/expense';
import { getUserExpenses, deleteExpense } from '../../services/expense.service';
import { ExpenseForm } from '../../components/expense/ExpenseForm';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend);

export const ExpensePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loadExpenses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userExpenses = await getUserExpenses(user.id);
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingExpense(null);
    loadExpenses();
  };
  
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Bu gideri silmek istediğinizden emin misiniz?")) {
      try {
        await deleteExpense(user!.id, id);
        loadExpenses();
      } catch (error) {
        console.error("Error deleting expense: ", error);
      }
    }
  };

  const { totalExpense, installmentCount, regularCount, categoryData } = useMemo(() => {
    const activeExpenses = expenses.filter(e => e.isActive);
    const categoryMap: { [key: string]: number } = {};
    activeExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    return {
      totalExpense: activeExpenses.reduce((sum, e) => sum + e.amount, 0),
      installmentCount: activeExpenses.filter(e => e.isInstallment).length,
      regularCount: activeExpenses.filter(e => !e.isInstallment).length,
      categoryData: {
        labels: Object.keys(categoryMap),
        datasets: [{
          data: Object.values(categoryMap),
          backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
      }
    };
  }, [expenses]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800">Giderlerim</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Gider Listesi</h2>
                <button onClick={() => { setShowForm(!showForm); setEditingExpense(null); }} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600">
                  <Plus size={16} />
                  {showForm ? 'Kapat' : 'Yeni Ekle'}
                </button>
              </div>

              {showForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                   <h3 className="font-bold text-lg mb-4">{editingExpense ? 'Gideri Düzenle' : 'Yeni Gider Ekle'}</h3>
                   <ExpenseForm
                      onSubmit={handleFormSubmit}
                      initialData={editingExpense}
                   />
                </div>
              )}

              <div className="space-y-3">
                {loading ? <p>Yükleniyor...</p> : expenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{expense.title}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(expense.date), 'd MMMM yyyy', { locale: tr })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-sm text-red-600">-₺{expense.amount.toLocaleString('tr-TR')}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(expense)} className="text-xs text-blue-500 hover:underline">Düzenle</button>
                        <button onClick={() => handleDelete(expense.id)} className="text-xs text-red-500 hover:underline">Sil</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4">Özet</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Toplam Gider:</span> <span className="font-bold">₺{totalExpense.toLocaleString('tr-TR')}</span></div>
                <div className="flex justify-between"><span>Taksitli Gider Sayısı:</span> <span className="font-bold">{installmentCount}</span></div>
                <div className="flex justify-between"><span>Tek Seferlik Gider Sayısı:</span> <span className="font-bold">{regularCount}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4">Gider Dağılımı</h2>
              <Pie data={categoryData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};