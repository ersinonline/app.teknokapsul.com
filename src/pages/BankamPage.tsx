import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import BakiyeKarti from '../components/Bankam/BakiyeKarti';
import HizliIslemler from '../components/Bankam/HizliIslemler';
import SonIslemler from '../components/Bankam/SonIslemler';
import AylikOzet from '../components/Bankam/AylikOzet';
import FinansalAraclar from '../components/Bankam/FinansalAraclar';
import YaklasanOdemeler from '../components/Bankam/YaklasanOdemeler';
import KisisellestirilmisIpuclari from '../components/Bankam/KisisellestirilmisIpuclari';
import { DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

const BankamPage: React.FC = () => {
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const expensesRef = collection(db, 'users', user.id, 'expenses');
        const expensesQuery = query(expensesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const expensesSnapshot = await getDocs(expensesQuery);
        const expensesData = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];

        const incomesRef = collection(db, 'users', user.id, 'incomes');
        const incomesQuery = query(incomesRef, where('isActive', '==', true), orderBy('date', 'desc'), limit(50));
        const incomesSnapshot = await getDocs(incomesQuery);
        const incomesData = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];

        setExpenses(expensesData);
        setIncomes(incomesData);

        const allTransactions: Transaction[] = [
          ...expensesData.map(e => ({ ...e, type: 'expense' as const })),
          ...incomesData.map(i => ({ ...i, type: 'income' as const }))
        ];

        const sortedTransactions = allTransactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setRecentTransactions(sortedTransactions);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [user]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  const thisMonthIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-800">Hesabım</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <BakiyeKarti
          netBalance={netBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          loading={loading}
        />
        <HizliIslemler />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SonIslemler transactions={recentTransactions} loading={loading} />
          <AylikOzet totalIncome={totalIncome} totalExpense={totalExpense} loading={loading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <YaklasanOdemeler />
          <KisisellestirilmisIpuclari incomes={incomes} expenses={expenses} loading={loading} />
        </div>

        <FinansalAraclar />
      </main>
    </div>
  );
};

export default BankamPage;