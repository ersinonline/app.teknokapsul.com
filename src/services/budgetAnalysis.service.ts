import { Payment } from '../types/data';
import { Budget } from '../types/budget';

export interface BudgetAnalysis {
  overspentCategories: string[];
  savingsSuggestions: string[];
  monthlyTrend: number[];
  riskLevel: 'low' | 'medium' | 'high';
}

export const analyzeBudget = (payments: Payment[], budget: Budget): BudgetAnalysis => {
  const analysis: BudgetAnalysis = {
    overspentCategories: [],
    savingsSuggestions: [],
    monthlyTrend: [],
    riskLevel: 'low'
  };

  // Aşılan kategorileri belirle
  Object.entries(budget.categories).forEach(([category, data]) => {
    if (data.spent > data.limit) {
      analysis.overspentCategories.push(category);
    }
  });

  // Risk seviyesini hesapla
  const totalSpent = Object.values(budget.categories).reduce((sum, cat) => sum + cat.spent, 0);
  const riskRatio = totalSpent / budget.totalBudget;
  
  if (riskRatio > 0.9) {
    analysis.riskLevel = 'high';
    analysis.savingsSuggestions.push('Acil durum fonu oluşturmanızı öneririz');
  } else if (riskRatio > 0.7) {
    analysis.riskLevel = 'medium';
    analysis.savingsSuggestions.push('Harcamalarınızı gözden geçirmenizi öneririz');
  }

  return analysis;
};