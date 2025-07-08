import { generateStructuredOutput, generateText } from './ai.service';
import { Payment } from '../types/data';
import { Subscription } from '../types/subscription';

export interface FinancialInsight {
  category: 'spending' | 'saving' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
}

export interface SpendingPattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  amount: number;
  prediction: string;
}

export interface BudgetOptimization {
  currentSpending: number;
  recommendedBudget: number;
  potentialSavings: number;
  optimizationAreas: string[];
  timeline: string;
}

export interface SmartAlert {
  id: string;
  type: 'payment_due' | 'budget_exceeded' | 'unusual_spending' | 'saving_opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: boolean;
  dueDate?: Date;
  amount?: number;
}

class AIAnalysisService {
  async analyzeSpendingPatterns(payments: Payment[]): Promise<SpendingPattern[]> {
    const prompt = `
      Aşağıdaki ödeme verilerini analiz et ve harcama kalıplarını belirle:
      ${JSON.stringify(payments, null, 2)}
      
      Her kategori için trend analizi yap ve gelecek tahminleri oluştur.
      Türkçe yanıt ver.
    `;

    const schema = {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
              percentage: { type: 'number' },
              amount: { type: 'number' },
              prediction: { type: 'string' }
            },
            required: ['category', 'trend', 'percentage', 'amount', 'prediction']
          }
        }
      },
      required: ['patterns']
    };

    try {
      const result = await generateStructuredOutput<{ patterns: SpendingPattern[] }>(prompt, schema);
      return result.patterns || [];
    } catch (error) {
      console.error('Harcama kalıpları analiz hatası:', error);
      return [];
    }
  }

  async generateFinancialInsights(payments: Payment[], subscriptions: Subscription[]): Promise<FinancialInsight[]> {
    const prompt = `
      Finansal verileri analiz et ve önemli içgörüler oluştur:
      
      Ödemeler: ${JSON.stringify(payments.slice(0, 20), null, 2)}
      Abonelikler: ${JSON.stringify(subscriptions, null, 2)}
      
      Harcama alışkanlıkları, tasarruf fırsatları, riskler ve öneriler hakkında içgörüler oluştur.
      Türkçe yanıt ver.
    `;

    const schema = {
      type: 'object',
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['spending', 'saving', 'warning', 'opportunity'] },
              title: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              actionable: { type: 'boolean' },
              recommendation: { type: 'string' }
            },
            required: ['category', 'title', 'description', 'impact', 'actionable']
          }
        }
      },
      required: ['insights']
    };

    try {
      const result = await generateStructuredOutput<{ insights: FinancialInsight[] }>(prompt, schema);
      return result.insights || [];
    } catch (error) {
      console.error('Finansal içgörüler oluşturma hatası:', error);
      return [];
    }
  }

  async optimizeBudget(payments: Payment[], monthlyIncome: number): Promise<BudgetOptimization> {
    const prompt = `
      Aylık gelir: ${monthlyIncome} TL
      Ödemeler: ${JSON.stringify(payments.slice(0, 15), null, 2)}
      
      Bu verilere dayanarak bütçe optimizasyonu önerileri oluştur.
      Mevcut harcamaları analiz et ve tasarruf alanları belirle.
      Türkçe yanıt ver.
    `;

    const schema = {
      type: 'object',
      properties: {
        currentSpending: { type: 'number' },
        recommendedBudget: { type: 'number' },
        potentialSavings: { type: 'number' },
        optimizationAreas: {
          type: 'array',
          items: { type: 'string' }
        },
        timeline: { type: 'string' }
      },
      required: ['currentSpending', 'recommendedBudget', 'potentialSavings', 'optimizationAreas', 'timeline']
    };

    try {
      const result = await generateStructuredOutput<BudgetOptimization>(prompt, schema);
      return result;
    } catch (error) {
      console.error('Bütçe optimizasyonu hatası:', error);
      return {
        currentSpending: 0,
        recommendedBudget: 0,
        potentialSavings: 0,
        optimizationAreas: [],
        timeline: ''
      };
    }
  }

  async generateSmartAlerts(payments: Payment[], subscriptions: Subscription[]): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];
    const currentDate = new Date();

    // Yaklaşan ödemeler için uyarılar
    payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      const daysUntilDue = Math.ceil((paymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (payment.status === 'Ödenmedi' && daysUntilDue <= 3 && daysUntilDue > 0) {
        alerts.push({
          id: `payment_${payment.id}`,
          type: 'payment_due',
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          title: 'Yaklaşan Ödeme',
          message: `${payment.title} ödemesi ${daysUntilDue} gün içinde yapılmalı`,
          actionRequired: true,
          dueDate: paymentDate,
          amount: payment.amount
        });
      }
    });

    // Süresi dolan abonelikler için uyarılar
    subscriptions.forEach(subscription => {
      const endDate = new Date(subscription.endDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        alerts.push({
          id: `subscription_${subscription.id}`,
          type: 'payment_due',
          priority: daysUntilExpiry <= 3 ? 'high' : 'medium',
          title: 'Abonelik Süresi Doluyor',
          message: `${subscription.name} aboneliği ${daysUntilExpiry} gün içinde sona erecek`,
          actionRequired: true,
          dueDate: endDate
        });
      }
    });

    // AI ile akıllı uyarılar oluştur
    try {
      const aiAlerts = await this.generateAIAlerts(payments, subscriptions);
      alerts.push(...aiAlerts);
    } catch (error) {
      console.error('AI uyarıları oluşturma hatası:', error);
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async generateAIAlerts(payments: Payment[], subscriptions: Subscription[]): Promise<SmartAlert[]> {
    const prompt = `
      Finansal verileri analiz et ve akıllı uyarılar oluştur:
      
      Ödemeler: ${JSON.stringify(payments.slice(0, 10), null, 2)}
      Abonelikler: ${JSON.stringify(subscriptions.slice(0, 5), null, 2)}
      
      Olağandışı harcamalar, tasarruf fırsatları ve bütçe aşımları için uyarılar oluştur.
      Türkçe yanıt ver.
    `;

    const schema = {
      type: 'object',
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['budget_exceeded', 'unusual_spending', 'saving_opportunity'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              title: { type: 'string' },
              message: { type: 'string' },
              actionRequired: { type: 'boolean' }
            },
            required: ['type', 'priority', 'title', 'message', 'actionRequired']
          }
        }
      },
      required: ['alerts']
    };

    try {
      const result = await generateStructuredOutput<{ alerts: any[] }>(prompt, schema);
      if (result && result.alerts && Array.isArray(result.alerts)) {
        return result.alerts.map((alert, index) => ({
          id: `ai_alert_${Date.now()}_${index}`,
          ...alert
        }));
      }
      return [];
    } catch (error) {
      console.error('AI uyarıları oluşturma hatası:', error);
      return [];
    }
  }

  async generatePersonalizedRecommendations(payments: Payment[], subscriptions: Subscription[], userPreferences?: any): Promise<string[]> {
    const prompt = `
      Kullanıcının finansal verilerini analiz et ve kişiselleştirilmiş öneriler oluştur:
      
      Ödemeler: ${JSON.stringify(payments.slice(0, 15), null, 2)}
      Abonelikler: ${JSON.stringify(subscriptions, null, 2)}
      Kullanıcı tercihleri: ${JSON.stringify(userPreferences || {}, null, 2)}
      
      Harcama alışkanlıklarına göre tasarruf önerileri, bütçe iyileştirmeleri ve finansal hedefler oluştur.
      Türkçe yanıt ver.
    `;

    try {
      const response = await generateText(prompt);
      return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Kişiselleştirilmiş öneriler oluşturma hatası:', error);
      return [];
    }
  }

  async predictFutureExpenses(payments: Payment[]): Promise<{ month: string; predicted: number; confidence: number }[]> {
    const prompt = `
      Geçmiş ödeme verilerini analiz et ve gelecek 6 ay için harcama tahminleri oluştur:
      ${JSON.stringify(payments, null, 2)}
      
      Her ay için tahmini harcama miktarı ve güven seviyesi belirle.
      Türkçe yanıt ver.
    `;

    const schema = {
      type: 'object',
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              predicted: { type: 'number' },
              confidence: { type: 'number' }
            },
            required: ['month', 'predicted', 'confidence']
          }
        }
      },
      required: ['predictions']
    };

    try {
      const result = await generateStructuredOutput<{ predictions: { month: string; predicted: number; confidence: number }[] }>(prompt, schema);
      return result.predictions || [];
    } catch (error) {
      console.error('Gelecek harcama tahminleri hatası:', error);
      return [];
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();