import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, PiggyBank, Plus, Gift, Shield, X, Banknote, Edit, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface SavingsAccount {
  id: string;
  name: string;
  goal: number;
  currentAmount: number;
  icon: 'Gift' | 'Shield' | 'PiggyBank';
  color: 'blue' | 'green' | 'pink';
}

const initialSavingsData: Omit<SavingsAccount, 'id'>[] = [
  { name: 'Tatil Fonu', goal: 15000, currentAmount: 4500, icon: 'Gift', color: 'blue' },
  { name: 'Acil Durum Fonu', goal: 20000, currentAmount: 12500, icon: 'Shield', color: 'green' },
];

const ICON_MAP: { [key: string]: React.ElementType } = { Gift, Shield, PiggyBank };
const COLOR_MAP = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400', progress: 'bg-blue-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', progress: 'bg-green-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-600 dark:text-pink-400', progress: 'bg-pink-500' },
};

const SavingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [formState, setFormState] = useState({
    name: '',
    goal: '',
    icon: 'PiggyBank' as SavingsAccount['icon'],
    color: 'pink' as SavingsAccount['color']
  });

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const accountsCol = collection(db, 'users', user.id, 'savingsAccounts');
      const snapshot = await getDocs(accountsCol);
      if (snapshot.empty) {
        const batch = writeBatch(db);
        initialSavingsData.forEach(acc => {
          const docRef = doc(accountsCol);
          batch.set(docRef, acc);
        });
        await batch.commit();
        await fetchAccounts(); // Re-fetch after seeding
      } else {
        const accountsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsAccount));
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error("Error fetching savings accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openAddModal = () => {
    setSelectedAccount(null);
    setFormState({ name: '', goal: '', icon: 'PiggyBank', color: 'pink' });
    setIsModalOpen(true);
  };

  const openEditModal = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setFormState({
      name: account.name,
      goal: account.goal.toString(),
      icon: account.icon,
      color: account.color
    });
    setIsModalOpen(true);
  };

  const openDepositModal = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setDepositAmount('');
    setIsDepositModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Bu birikim hesabını silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'savingsAccounts', id));
      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      name: formState.name,
      goal: parseFloat(formState.goal),
      icon: formState.icon,
      color: formState.color,
    };

    try {
      if (selectedAccount) {
        const docRef = doc(db, 'users', user.id, 'savingsAccounts', selectedAccount.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = collection(db, 'users', user.id, 'savingsAccounts');
        await addDoc(docRef, { ...data, currentAmount: 0 });
      }
      fetchAccounts();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount) return;

    const amount = parseFloat(depositAmount);
    if(isNaN(amount) || amount <= 0) {
      alert("Geçerli bir tutar giriniz.");
      return;
    }

    const newAmount = selectedAccount.currentAmount + amount;

    try {
      const docRef = doc(db, 'users', user.id, 'savingsAccounts', selectedAccount.id);
      await updateDoc(docRef, { currentAmount: newAmount });
      fetchAccounts();
      setIsDepositModalOpen(false);
    } catch (error) {
      console.error("Error depositing:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalSavings = accounts.reduce((sum, acc) => sum + acc.currentAmount, 0);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              </button>
              <div className="flex items-center gap-2">
                <PiggyBank className="w-7 h-7 text-pink-500" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Birikimlerim</h1>
              </div>
            </div>
          <button onClick={openAddModal} className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-600">
            <Plus size={16} />
            Yeni Hesap
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Birikim</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalSavings)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map(account => {
            const progress = (account.currentAmount / account.goal) * 100;
            const colors = COLOR_MAP[account.color];
            const Icon = ICON_MAP[account.icon];

            return (
              <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{account.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Hedef: {formatCurrency(account.goal)}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => openEditModal(account)} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(account.currentAmount)}</span>
                    <span className={`${colors.text} font-bold`}>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`${colors.progress} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <button onClick={() => openDepositModal(account)} className="mt-4 w-full py-2 bg-gray-800 dark:bg-gray-700 text-white font-semibold rounded-lg hover:bg-black dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                  <Banknote size={16} /> Para Ekle
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-6 dark:text-gray-100">{selectedAccount ? 'Birikim Hesabını Düzenle' : 'Yeni Birikim Hesabı'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Form fields... */}
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">Kaydet</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isDepositModalOpen && selectedAccount && (
        <Modal onClose={() => setIsDepositModalOpen(false)}>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Para Yatır: {selectedAccount.name}</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tutar</label>
                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsDepositModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Yatır</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SavingsPage;