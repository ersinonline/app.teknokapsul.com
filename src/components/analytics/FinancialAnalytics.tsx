import React from 'react';
import { TrendingUp, PieChart, DollarSign, Target } from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Payment } from '../../types/data';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { formatCurrency } from '../../utils/currency';
import { CategoryType, DEFAULT_CATEGORIES } from '../../types/budget';
import { useBudget } from '../../hooks/useBudget';
import { useCurrentMonthPayments } from '../../hooks/useCurrentMonthPayments';
import { StatCards } from './StatCards';
import { SpendingDistribution } from './SpendingDistribution';
import { SpendingAnalysis } from './SpendingAnalysis';

export const FinancialAnalytics = () => {
  const { data: allPayments = [], loading, error } = useFirebaseData<Payment>('payments');
  const { budget, loading: budgetLoading } = useBudget();
  
  // Filter for current month payments
  const currentMonthPayments = useCurrentMonthPayments(allPayments);

  const analytics = React.useMemo(() => {
    const categories = Object.keys(DEFAULT_CATEGORIES).reduce((acc, category) => {
      acc[category as CategoryType] = 0;
      return acc;
    }, {} as Record<CategoryType, number>);

    currentMonthPayments.forEach(payment => {
      if (payment.category && categories.hasOwnProperty(payment.category)) {
        categories[payment.category as CategoryType] += parseFloat(payment.amount.replace(' TL', ''));
      }
    });

    const totalSpent = Object.values(categories).reduce((a, b) => a + b, 0);
    const totalDebt = currentMonthPayments
      .filter(p => p.status !== 'Ödendi')
      .reduce((sum, p) => sum + parseFloat(p.amount.replace(' TL', '')), 0);

    const budgetCompliance = budget ? 
      Math.max(0, 100 - Math.round((totalDebt / budget.totalBudget) * 100)) : 0;

    return {
      categories,
      totalSpent,
      totalDebt,
      budgetCompliance,
      topCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
    };
  }, [currentMonthPayments, budget]);

  if (loading || budgetLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Finansal veriler yüklenirken bir hata oluştu." />;
  if (!budget) return null;

  return (
    <div className="space-y-6">
      <StatCards analytics={analytics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingDistribution categories={analytics.categories} />
        <SpendingAnalysis categories={analytics.categories} />
      </div>
    </div>
  );
};