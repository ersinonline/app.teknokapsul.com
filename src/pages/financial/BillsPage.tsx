import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Receipt, CheckCircle, Loader2, Zap, Droplet, Wifi, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/currency';
import { collection, query, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Bill {
  id: string;
  institution: string;
  amount: number;
  dueDate: string;
  type: 'electricity' | 'water' | 'internet' | 'phone' | 'gas';
  isPaid: boolean;
}

// Mock bill data for initial setup
const MOCK_BILLS: Omit<Bill, 'id' | 'isPaid'>[] = [
  { institution: 'CK Boğaziçi Elektrik', amount: 185.50, dueDate: '2025-11-20', type: 'electricity' },
  { institution: 'İSKİ Su İşleri', amount: 75.20, dueDate: '2025-11-22', type: 'water' },
  { institution: 'TurkNet İnternet', amount: 150.00, dueDate: '2025-11-25', type: 'internet' },
  { institution: 'Turkcell Mobil', amount: 95.75, dueDate: '2025-11-15', type: 'phone'},
  { institution: 'İGDAŞ Doğalgaz', amount: 320.40, dueDate: '2025-10-28', type: 'gas' },
];

const BillIcon = ({ type }: { type: Bill['type'] }) => {
  switch (type) {
    case 'electricity': return <Zap className="text-yellow-500" />;
    case 'water': return <Droplet className="text-blue-500" />;
    case 'internet': return <Wifi className="text-indigo-500" />;
    case 'phone': return <Phone className="text-green-500" />;
    default: return <Receipt className="text-gray-500" />;
  }
};

const BillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');

  const fetchBills = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const billsCol = collection(db, 'users', user.id, 'bills');
      const billsSnapshot = await getDocs(billsCol);

      if (billsSnapshot.empty) {
        // Create initial bills for demo purposes
        const batch = writeBatch(db);
        MOCK_BILLS.forEach(bill => {
          const newBillRef = doc(billsCol);
          batch.set(newBillRef, {...bill, isPaid: false});
        });
        await batch.commit();
        // Re-fetch after creating
        const newSnapshot = await getDocs(billsCol);
        const billsData = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
        setBills(billsData);
      } else {
        const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
        setBills(billsData);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handlePayBill = async (billId: string) => {
    if(!user) return;
    setPayingBillId(billId);
    try {
        const billRef = doc(db, 'users', user.id, 'bills', billId);
        await updateDoc(billRef, { isPaid: true });

        // Optimistically update UI
        setBills(prevBills =>
            prevBills.map(bill =>
            bill.id === billId ? { ...bill, isPaid: true } : bill
            )
        );
    } catch (error) {
        console.error("Error paying bill: ", error);
        alert("Fatura ödenirken bir hata oluştu.");
    } finally {
        setPayingBillId(null);
    }
  };

  const unpaidBills = bills.filter(b => !b.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paidBills = bills.filter(b => b.isPaid).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
          <div className="flex items-center gap-2">
            <Receipt className="w-7 h-7 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Fatura Ödemeleri</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="flex items-center justify-around border-b border-gray-200 dark:border-gray-700">
             <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'unpaid' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Ödenecek Faturalar ({unpaidBills.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'paid' ? 'text-yellow-600 border-b-2 border-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Ödenmiş Faturalar ({paidBills.length})
            </button>
          </div>
        </div>

        {activeTab === 'unpaid' && (
          <div className="space-y-4">
            {unpaidBills.length > 0 ? (
              unpaidBills.map(bill => (
                <div key={bill.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                      <BillIcon type={bill.type} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{bill.institution}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Son Ödeme: {new Date(bill.dueDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{formatCurrency(bill.amount)}</p>
                    <button
                      onClick={() => handlePayBill(bill.id)}
                      disabled={payingBillId === bill.id}
                      className="mt-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center min-w-[80px]"
                    >
                      {payingBillId === bill.id ? <Loader2 className="animate-spin" size={16} /> : 'Öde'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Harika!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ödenecek faturanız bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'paid' && (
           <div className="space-y-4">
            {paidBills.map(bill => (
              <div key={bill.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                    <CheckCircle className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 dark:text-gray-400 line-through">{bill.institution}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Ödendi</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-500 dark:text-gray-400 line-through">{formatCurrency(bill.amount)}</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default BillsPage;