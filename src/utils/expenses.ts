import { Expense } from '../types/expense';
import { parseCurrency } from './currency';

export interface ExpenseGroup {
  month: string;
  year: number;
  totalAmount: number;
  paidAmount: number;
  expenses: Expense[];
  isFullyPaid: boolean;
}

const getMonthIndex = (monthName: string): number => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months.indexOf(monthName);
};

export const groupExpensesByMonth = (expenses: Expense[]): ExpenseGroup[] => {
  // Tarih aralığı kontrolü
  const validExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const startDate = new Date(2024, 11, 1); // Aralık 2024
    const endDate = new Date(2026, 1, 28); // Şubat 2026
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  // Giderleri aylara göre grupla
  const groups = validExpenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const month = date.toLocaleString('tr-TR', { month: 'long' });
    const year = date.getFullYear();
    const key = `${month}-${year}`;

    if (!acc[key]) {
      acc[key] = {
        month,
        year,
        totalAmount: 0,
        paidAmount: 0,
        expenses: [],
        isFullyPaid: false
      };
    }

    const amount = typeof expense.amount === 'string' ? parseCurrency(expense.amount) : expense.amount;
    acc[key].totalAmount += amount;
    if (expense.isPaid) {
      acc[key].paidAmount += amount;
    }
    acc[key].expenses.push(expense);

    return acc;
  }, {} as Record<string, ExpenseGroup>);

  // Grupları diziye çevir ve sırala
  const sortedGroups = Object.values(groups)
    .map(group => ({
      ...group,
      isFullyPaid: group.totalAmount === group.paidAmount
    }))
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    });

  return sortedGroups;
};

export const getCurrentMonthExpenses = (expenses: Expense[]): Expense[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
};

export const getUpcomingExpenses = (expenses: Expense[], days: number = 7): Expense[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= now && expenseDate <= futureDate && !expense.isPaid;
  });
};