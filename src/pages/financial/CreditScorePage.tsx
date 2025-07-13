import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { TrendingUp, Plus, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CreditScore {
  id?: string;
  date: string;
  score: number;
  createdAt: Date;
}

const CreditScorePage: React.FC = () => {
  const { user } = useAuth();
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [newScore, setNewScore] = useState({ date: '', score: '' });
  const [editingScore, setEditingScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCreditScores();
    }
  }, [user]);

  const fetchCreditScores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const scoresRef = collection(db, `teknokapsul/${user.uid}/creditScores`);
      const q = query(scoresRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const scores: CreditScore[] = [];
      querySnapshot.forEach((doc) => {
        scores.push({ id: doc.id, ...doc.data() } as CreditScore);
      });
      
      setCreditScores(scores);
    } catch (error) {
      console.error('Kredi notları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCreditScore = async () => {
    if (!user || !newScore.date || !newScore.score) return;
    
    const score = parseInt(newScore.score);
    if (score < 1 || score > 1900) {
      alert('Kredi notu 1-1900 arasında olmalıdır.');
      return;
    }
    
    try {
      setLoading(true);
      const scoresRef = collection(db, `teknokapsul/${user.uid}/creditScores`);
      await addDoc(scoresRef, {
        date: newScore.date,
        score: score,
        createdAt: new Date()
      });
      
      setNewScore({ date: '', score: '' });
      setShowAddForm(false);
      await fetchCreditScores();
    } catch (error) {
      console.error('Kredi notu eklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCreditScore = async () => {
    if (!user || !editingScore || !editingScore.date || !editingScore.score) return;
    
    if (editingScore.score < 1 || editingScore.score > 1900) {
      alert('Kredi notu 1-1900 arasında olmalıdır.');
      return;
    }
    
    try {
      setLoading(true);
      const scoreRef = doc(db, `teknokapsul/${user.uid}/creditScores`, editingScore.id!);
      await updateDoc(scoreRef, {
        date: editingScore.date,
        score: editingScore.score
      });
      
      setEditingScore(null);
      await fetchCreditScores();
    } catch (error) {
      console.error('Kredi notu güncellenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCreditScore = async (id: string) => {
    if (!user || !confirm('Bu kredi notu kaydını silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      const scoreRef = doc(db, `teknokapsul/${user.uid}/creditScores`, id);
      await deleteDoc(scoreRef);
      await fetchCreditScores();
    } catch (error) {
      console.error('Kredi notu silinirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 1400) return 'text-green-600';
    if (score >= 1200) return 'text-blue-600';
    if (score >= 1000) return 'text-yellow-600';
    if (score >= 800) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 1400) return 'Mükemmel';
    if (score >= 1200) return 'Çok İyi';
    if (score >= 1000) return 'İyi';
    if (score >= 800) return 'Orta';
    return 'Düşük';
  };

  const chartData = {
    labels: creditScores.map(score => {
      const date = new Date(score.date);
      return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Findeks Kredi Notu',
        data: creditScores.map(score => score.score),
        borderColor: '#ffb700',
        backgroundColor: 'rgba(255, 183, 0, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#ffb700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
          size: 14,
          weight: 'bold' as const
        }
        }
      },
      title: {
        display: true,
        text: 'Findeks Kredi Notu Takibi',
        font: {
          size: 18,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Kredi Notu: ${context.parsed.y} (${getScoreLabel(context.parsed.y)})`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 300,
        max: 1900,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const latestScore = creditScores.length > 0 ? creditScores[creditScores.length - 1] : null;
  const previousScore = creditScores.length > 1 ? creditScores[creditScores.length - 2] : null;
  const scoreDifference = latestScore && previousScore ? latestScore.score - previousScore.score : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Findeks Kredi Notu</h1>
                <p className="text-sm sm:text-base text-gray-600">Kredi notunuzu takip edin</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Yeni Kayıt
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Güncel Kredi Notu</p>
                <p className={`text-2xl sm:text-3xl font-bold ${latestScore ? getScoreColor(latestScore.score) : 'text-gray-400'}`}>
                  {latestScore ? latestScore.score : '-'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {latestScore ? getScoreLabel(latestScore.score) : 'Henüz kayıt yok'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Son Değişim</p>
                <p className={`text-2xl sm:text-3xl font-bold ${
                  scoreDifference > 0 ? 'text-green-600' : 
                  scoreDifference < 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {scoreDifference > 0 ? '+' : ''}{scoreDifference || '-'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {latestScore && previousScore ? 'Önceki kayda göre' : 'Henüz karşılaştırma yok'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam Kayıt</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{creditScores.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Kredi notu kaydı</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {creditScores.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="h-64 sm:h-80 lg:h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Records */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Kredi Notu Kayıtları</h2>
          </div>
          
          {loading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffb700] mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Yükleniyor...</p>
            </div>
          ) : creditScores.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">Henüz kredi notu kaydınız bulunmuyor.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a500] transition-colors text-sm sm:text-base"
              >
                İlk Kaydınızı Ekleyin
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kredi Notu
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seviye
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditScores.map((score) => (
                      <tr key={score.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(score.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-semibold ${getScoreColor(score.score)}`}>
                            {score.score}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            score.score >= 1400 ? 'bg-green-100 text-green-800' :
                            score.score >= 1200 ? 'bg-blue-100 text-blue-800' :
                            score.score >= 1000 ? 'bg-yellow-100 text-yellow-800' :
                            score.score >= 800 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getScoreLabel(score.score)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingScore(score)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCreditScore(score.id!)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="sm:hidden">
                <div className="divide-y divide-gray-200">
                  {creditScores.map((score) => (
                    <div key={score.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-xl font-bold ${getScoreColor(score.score)}`}>
                            {score.score}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            score.score >= 1400 ? 'bg-green-100 text-green-800' :
                            score.score >= 1200 ? 'bg-blue-100 text-blue-800' :
                            score.score >= 1000 ? 'bg-yellow-100 text-yellow-800' :
                            score.score >= 800 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getScoreLabel(score.score)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditingScore(score)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCreditScore(score.id!)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(score.date).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Kredi Notu Ekle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={newScore.date}
                    onChange={(e) => setNewScore({ ...newScore, date: e.target.value })}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kredi Notu (1-1900)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1900"
                    value={newScore.score}
                    onChange={(e) => setNewScore({ ...newScore, score: e.target.value })}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-base"
                    placeholder="Örn: 1250"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={addCreditScore}
                  disabled={loading || !newScore.date || !newScore.score}
                  className="flex-1 px-4 py-3 sm:py-2 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewScore({ date: '', score: '' });
                  }}
                  className="flex-1 px-4 py-3 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-base"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {editingScore && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kredi Notu Düzenle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={editingScore.date}
                    onChange={(e) => setEditingScore({ ...editingScore, date: e.target.value })}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kredi Notu (1-1900)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1900"
                    value={editingScore.score}
                    onChange={(e) => setEditingScore({ ...editingScore, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent text-base"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={updateCreditScore}
                  disabled={loading}
                  className="flex-1 px-4 py-3 sm:py-2 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button
                  onClick={() => setEditingScore(null)}
                  className="flex-1 px-4 py-3 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-base"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditScorePage;