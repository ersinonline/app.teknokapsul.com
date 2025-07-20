import { generateStructuredOutput, ObjectSchemaInterface } from './ai.service';
import { SchemaType } from '@firebase/ai';
import { Expense } from '../types/expense';
import { Income } from '../types/income';

export interface PredictionResult {
  predictedAmount: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  recommendation?: string;
}

export interface BudgetPrediction {
  category: string;
  currentMonthSpent: number;
  predictedMonthlyTotal: number;
  budgetLimit?: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyBudgetRemaining: number;
}

class PredictionService {
  async predictNextMonthExpenses(expenses: Expense[]): Promise<PredictionResult> {
    try {
      // Calculate historical averages
      const monthlyTotals = this.calculateMonthlyTotals(expenses);
      const trend = this.calculateTrend(monthlyTotals);
      const seasonalFactor = this.calculateSeasonalFactor(new Date().getMonth());
      
      // Simple prediction based on historical data
      const avgMonthly = monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length;
      const trendAdjustment = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1.0;
      const predictedAmount = avgMonthly * trendAdjustment * seasonalFactor;
      
      // Use AI for more sophisticated prediction if available
      const aiPrediction = await this.getAIPrediction(expenses);
      
      return {
        predictedAmount: aiPrediction?.predictedAmount || predictedAmount,
        confidence: aiPrediction?.confidence || this.calculateConfidence(monthlyTotals),
        trend,
        factors: this.identifyFactors(expenses, trend),
        recommendation: aiPrediction?.recommendation
      };
    } catch (error) {
      console.error('Error predicting expenses:', error);
      return {
        predictedAmount: 0,
        confidence: 0,
        trend: 'stable',
        factors: ['Tahmin hesaplanamadı']
      };
    }
  }

  async predictNextMonthIncome(incomes: Income[]): Promise<PredictionResult> {
    try {
      const monthlyTotals = this.calculateMonthlyIncomes(incomes);
      const trend = this.calculateTrend(monthlyTotals);
      
      // Separate regular and one-time incomes
      const regularIncomes = incomes.filter(income => income.isRecurring);
      const oneTimeIncomes = incomes.filter(income => !income.isRecurring);
      
      // Calculate base prediction from regular incomes
      const regularTotal = regularIncomes.reduce((sum, income) => sum + income.amount, 0);
      
      // Add estimated one-time incomes based on historical data
      const avgOneTime = oneTimeIncomes.length > 0 ? 
        oneTimeIncomes.reduce((sum, income) => sum + income.amount, 0) / 12 : 0;
      
      const predictedAmount = regularTotal + avgOneTime;
      
      return {
        predictedAmount,
        confidence: this.calculateIncomeConfidence(regularIncomes, oneTimeIncomes),
        trend,
        factors: this.identifyIncomeFactors(incomes, trend)
      };
    } catch (error) {
      console.error('Error predicting income:', error);
      return {
        predictedAmount: 0,
        confidence: 0,
        trend: 'stable',
        factors: ['Tahmin hesaplanamadı']
      };
    }
  }

  async predictBudgetStatus(expenses: Expense[], budgetLimits: { [category: string]: number }): Promise<BudgetPrediction[]> {
    const predictions: BudgetPrediction[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDate.getDate();
    
    // Group expenses by category for current month
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const categoryTotals: { [category: string]: number } = {};
    currentMonthExpenses.forEach(expense => {
      const category = expense.category || 'Diğer';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    for (const [category, budgetLimit] of Object.entries(budgetLimits)) {
      const currentSpent = categoryTotals[category] || 0;
      const dailyAverage = currentSpent / (currentDate.getDate());
      const predictedMonthlyTotal = dailyAverage * daysInMonth;
      
      predictions.push({
        category,
        currentMonthSpent: currentSpent,
        predictedMonthlyTotal,
        budgetLimit,
        isOverBudget: predictedMonthlyTotal > budgetLimit,
        daysRemaining,
        dailyBudgetRemaining: Math.max(0, (budgetLimit - currentSpent) / daysRemaining)
      });
    }
    
    return predictions;
  }

  private async getAIPrediction(expenses: Expense[]): Promise<PredictionResult | null> {
    try {
      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          predictedAmount: {
            type: SchemaType.NUMBER,
            description: 'Tahmin edilen gelecek ay harcama tutarı'
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: 'Tahmin güven skoru (0-1 arası)'
          },
          recommendation: {
            type: SchemaType.STRING,
            description: 'Harcama önerisi'
          }
        },
        required: ['predictedAmount', 'confidence']
      } as ObjectSchemaInterface;

      const recentExpenses = expenses.slice(-30); // Son 30 harcama
      const prompt = `
        Aşağıdaki harcama verilerini analiz ederek gelecek ay için tahmin yap:
        ${JSON.stringify(recentExpenses.map(e => ({
          amount: e.amount,
          category: e.category,
          date: e.date,
          description: e.description
        })), null, 2)}
        
        Mevsimsel faktörleri, harcama trendlerini ve kategori dağılımını göz önünde bulundur.
        Türkçe öneri ver.
      `;

      const result = await generateStructuredOutput<{
        predictedAmount: number;
        confidence: number;
        recommendation?: string;
      }>(prompt, schema);
      
      return {
        predictedAmount: result.predictedAmount || 0,
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        trend: 'stable', // AI'dan trend bilgisi alınabilir
        factors: ['AI analizi'],
        recommendation: result.recommendation
      };
    } catch (error) {
      console.error('AI prediction failed:', error);
      return null;
    }
  }

  private calculateMonthlyTotals(expenses: Expense[]): number[] {
    const monthlyTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });
    
    return Object.values(monthlyTotals);
  }

  private calculateMonthlyIncomes(incomes: Income[]): number[] {
    const monthlyTotals: { [key: string]: number } = {};
    
    incomes.forEach(income => {
      const date = new Date(income.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + income.amount;
    });
    
    return Object.values(monthlyTotals);
  }

  private calculateTrend(monthlyTotals: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (monthlyTotals.length < 2) return 'stable';
    
    const recent = monthlyTotals.slice(-3); // Son 3 ay
    const older = monthlyTotals.slice(-6, -3); // Önceki 3 ay
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private calculateSeasonalFactor(month: number): number {
    // Basit mevsimsel faktörler (Türkiye için)
    const seasonalFactors = {
      0: 1.1,  // Ocak - Yeni yıl harcamaları
      1: 0.9,  // Şubat
      2: 1.0,  // Mart
      3: 1.0,  // Nisan
      4: 1.0,  // Mayıs
      5: 1.1,  // Haziran - Tatil başlangıcı
      6: 1.2,  // Temmuz - Tatil
      7: 1.2,  // Ağustos - Tatil
      8: 1.1,  // Eylül - Okul başlangıcı
      9: 1.0,  // Ekim
      10: 1.1, // Kasım - Kış hazırlığı
      11: 1.3  // Aralık - Yılbaşı alışverişi
    };
    
    return seasonalFactors[month as keyof typeof seasonalFactors] || 1.0;
  }

  private calculateConfidence(monthlyTotals: number[]): number {
    if (monthlyTotals.length < 3) return 0.3;
    
    // Varyasyon katsayısını hesapla
    const mean = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
    const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyTotals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    // Düşük varyasyon = yüksek güven
    return Math.max(0.1, Math.min(0.9, 1 - coefficientOfVariation));
  }

  private calculateIncomeConfidence(regularIncomes: Income[], oneTimeIncomes: Income[]): number {
    const regularRatio = regularIncomes.length / (regularIncomes.length + oneTimeIncomes.length);
    return Math.max(0.3, Math.min(0.95, regularRatio * 0.9 + 0.1));
  }

  private identifyFactors(expenses: Expense[], trend: string): string[] {
    const factors: string[] = [];
    
    // Kategori analizi
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Diğer';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      factors.push(`En yüksek harcama: ${topCategory[0]}`);
    }
    
    if (trend === 'increasing') {
      factors.push('Harcamalar artış trendinde');
    } else if (trend === 'decreasing') {
      factors.push('Harcamalar azalış trendinde');
    }
    
    // Mevsimsel faktör
    const currentMonth = new Date().getMonth();
    if ([11, 0, 5, 6, 7].includes(currentMonth)) {
      factors.push('Mevsimsel yüksek harcama dönemi');
    }
    
    return factors;
  }

  private identifyIncomeFactors(incomes: Income[], trend: string): string[] {
    const factors: string[] = [];
    
    const regularCount = incomes.filter(income => income.isRecurring).length;
    const totalCount = incomes.length;
    
    if (regularCount / totalCount > 0.7) {
      factors.push('Düzenli gelir oranı yüksek');
    } else {
      factors.push('Değişken gelir yapısı');
    }
    
    if (trend === 'increasing') {
      factors.push('Gelir artış trendinde');
    } else if (trend === 'decreasing') {
      factors.push('Gelir azalış trendinde');
    }
    
    return factors;
  }
}

export const predictionService = new PredictionService();
export default predictionService;