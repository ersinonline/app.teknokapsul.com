import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingUp, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Income } from '../../types/income';
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from '../../services/income.service';
import { IncomeForm } from '../../components/income/IncomeForm';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

ChartJS.register(ArcElement, Tooltip, Legend);

export const IncomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const loadIncomes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userIncomes = await getUserIncomes(user.id);
      setIncomes(userIncomes);
    } catch (error) {
      console.error('Error loading incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, [user]);

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingIncome(null);
    loadIncomes();
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu geliri silmek istediğinizden emin misiniz?")) {
      try {
        await deleteIncome(user!.id, id);
        loadIncomes();
      } catch (error) {
        console.error("Error deleting income: ", error);
      }
    }
  };

  const { totalIncome, recurringCount, oneTimeCount } = useMemo(() => {
    const activeIncomes = incomes.filter(i => i.isActive);
    return {
      totalIncome: activeIncomes.reduce((sum, i) => sum + i.amount, 0),
      recurringCount: activeIncomes.filter(i => i.isRecurring).length,
      oneTimeCount: activeIncomes.filter(i => !i.isRecurring).length,
    };
  }, [incomes]);

  const chartData = {
    labels: ['Düzenli Gelir', 'Tek Seferlik Gelir'],
    datasets: [
      {
        data: [
          incomes.filter(i => i.isRecurring).reduce((sum, i) => sum + i.amount, 0),
          incomes.filter(i => !i.isRecurring).reduce((sum, i) => sum + i.amount, 0)
        ],
        backgroundColor: ['#34D399', '#FBBF24'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">Gelirlerim</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800">Gelir Listesi</h2>
                <button onClick={() => { setShowForm(!showForm); setEditingIncome(null); }} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600">
                  <Plus size={16} />
                  {showForm ? 'Kapat' : 'Yeni Ekle'}
                </button>
              </div>

              {showForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">{editingIncome ? 'Geliri Düzenle' : 'Yeni Gelir Ekle'}</h3>
                  <IncomeForm
                    onSubmit={handleFormSubmit}
                    initialData={editingIncome}
                  />
                </div>
              )}

              <div className="space-y-3">
                {loading ? <p>Yükleniyor...</p> : incomes.map(income => (
                  <div key={income.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{income.title}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(income.date), 'd MMMM yyyy', { locale: tr })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-sm text-green-600">+₺{income.amount.toLocaleString('tr-TR')}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(income)} className="text-xs text-blue-500 hover:underline">Düzenle</button>
                        <button onClick={() => handleDelete(income.id)} className="text-xs text-red-500 hover:underline">Sil</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4">Özet</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Toplam Gelir:</span> <span className="font-bold">₺{totalIncome.toLocaleString('tr-TR')}</span></div>
                <div className="flex justify-between"><span>Düzenli Gelir Sayısı:</span> <span className="font-bold">{recurringCount}</span></div>
                <div className="flex justify-between"><span>Tek Seferlik Gelir Sayısı:</span> <span className="font-bold">{oneTimeCount}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4">Gelir Dağılımı</h2>
              <Pie data={chartData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};