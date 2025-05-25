import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBudget, initializeBudget } from '../services/budget.service';
import { Budget } from '../types/budget';
import { useFirebaseData } from './useFirebaseData';
import { Payment } from '../types/data';
import { isCurrentMonth } from '../utils/date';

export const useBudget = () => {
  const { user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: payments = [] } = useFirebaseData<Payment>('payments');

  useEffect(() => {
    const loadBudget = async () => {
      if (!user) return;

      try {
        let userBudget = await getBudget(user.uid);
        
        if (!userBudget) {
          userBudget = await initializeBudget(user.uid, 0);
        }

        // Tüm ödemeleri kategorilere göre hesapla (ödeme durumuna bakmaksızın)
        const currentMonthPayments = payments.filter(payment => isCurrentMonth(payment.date));

        const spentByCategory = currentMonthPayments.reduce((acc, payment) => {
          if (payment.category) {
            // Handle both string and number amount types
            const amount = typeof payment.amount === 'string' 
              ? parseFloat(payment.amount.replace(' TL', '').replace(',', '.'))
              : parseFloat(String(payment.amount));

            if (!acc[payment.category]) {
              acc[payment.category] = { total: 0, paid: 0, unpaid: 0 };
            }
            acc[payment.category].total += amount;
            if (payment.status === 'Ödendi') {
              acc[payment.category].paid += amount;
            } else {
              acc[payment.category].unpaid += amount;
            }
          }
          return acc;
        }, {} as Record<string, { total: number; paid: number; unpaid: number; }>);

        // Bütçeyi güncelle
        const updatedBudget = {
          ...userBudget,
          categories: Object.keys(userBudget.categories).reduce((acc, category) => {
            acc[category] = {
              ...userBudget.categories[category],
              spent: spentByCategory[category]?.total || 0,
              paidAmount: spentByCategory[category]?.paid || 0,
              unpaidAmount: spentByCategory[category]?.unpaid || 0
            };
            return acc;
          }, {} as Budget['categories'])
        };

        setBudget(updatedBudget);
      } catch (err) {
        console.error('Error loading budget:', err);
        setError('Bütçe bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [user, payments]);

  return { budget, loading, error };
};