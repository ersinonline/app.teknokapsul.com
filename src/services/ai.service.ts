import { createXai } from '@ai-sdk/xai';
import { generateText as aiGenerateText, streamText, generateObject } from 'ai';
import { z } from 'zod';
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getAllSupportTickets } from "./support.service";
import { getUserCargoTrackings } from "./cargo.service";

// Export types for use in other services
export interface AIResponse {
  text: string;
  confidence?: number;
}

export interface AIError {
  message: string;
  code?: string;
}

export interface ObjectSchemaInterface {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

// Initialize XAI with API key
const xaiClient = createXai({
  apiKey: import.meta.env.VITE_XAI_API_KEY || process.env.XAI_API_KEY || ''
});

// Initialize model
const model = xaiClient('grok-2-1212');

export const generateText = async (prompt: string, retryCount = 0): Promise<string> => {
  try {
    const { text } = await aiGenerateText({
      model,
      prompt,
      temperature: 0.7,
    });
    
    return text;
  } catch (error: any) {
    console.error('Error generating text:', error);
    
    // Handle rate limiting with exponential backoff
    if (error?.status === 429 && retryCount < 3) { // Increased retry count
      const delay = Math.pow(2, retryCount + 1) * 3000; // Increased base delay: 6s, 12s, 24s
      console.log(`Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateText(prompt, retryCount + 1);
    }
    
    // For other errors or max retries reached, throw a custom error
    if (error?.status === 429) {
      throw new Error(`AI_RateLimit: Rate limit exceeded after ${retryCount + 1} attempts`);
    }
    
    // For other API errors, provide a fallback response
    if (error?.status >= 400) {
      console.warn('AI API error, using fallback response');
      return 'Üzgünüm, şu anda AI hizmeti kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
    }
    
    throw error;
  }
};

export const generateStructuredOutput = async <T>(
  prompt: string,
  schema: ObjectSchemaInterface
): Promise<T> => {
  try {
    // Convert schema to Zod schema
    const zodSchema = z.object(
      Object.keys(schema.properties).reduce((acc, key) => {
        const prop = schema.properties[key];
        if (prop.type === 'string') {
          acc[key] = z.string();
        } else if (prop.type === 'number') {
          acc[key] = z.number();
        } else if (prop.type === 'boolean') {
          acc[key] = z.boolean();
        } else if (prop.type === 'array') {
          acc[key] = z.array(z.any());
        } else {
          acc[key] = z.any();
        }
        return acc;
      }, {} as any)
    );

    const result = await generateObject({
      model,
      prompt,
      schema: zodSchema,
    });
    
    return result.object as T;
  } catch (error) {
    console.error("AI yapılandırılmış çıktı üretme hatası:", error);
    throw error;
  }
};

export const startChat = async (prompt: string) => {
  try {
    const result = streamText({
      model,
      prompt,
      temperature: 0.7,
    });
    return result;
  } catch (error) {
    console.error("Error starting chat:", error);
    throw error;
  }
};

// Kullanıcının başvurularını getir
export const getUserApplications = async (userId: string) => {
  try {
    const applicationsRef = collection(db, 'teknokapsul-application');
    const q = query(applicationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Kullanıcı başvuruları alınırken hata:', error);
    return [];
  }
};

// Kullanıcının destek taleplerini getir
export const getUserSupportTickets = async (userId: string) => {
  try {
    const tickets = await getAllSupportTickets();
    return tickets.filter(ticket => ticket.userId === userId);
  } catch (error) {
    console.error('Kullanıcı destek talepleri alınırken hata:', error);
    return [];
  }
};

// Kullanıcının siparişlerini getir
export const getUserOrders = async (userId: string) => {
  try {
    const ordersRef = collection(db, 'teknokapsul', userId, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Kullanıcı siparişleri alınırken hata:', error);
    return [];
  }
};

// Kullanıcının kargo takiplerini getir
export const getUserCargos = async (userId: string) => {
  try {
    const cargos = await getUserCargoTrackings(userId);
    return cargos;
  } catch (error) {
    console.error('Kullanıcı kargo takipleri alınırken hata:', error);
    return [];
  }
};

// Kullanıcının garanti takiplerini getir
export const getUserWarranties = async (userId: string) => {
  try {
    const warrantiesRef = collection(db, 'warranties');
    const q = query(warrantiesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      purchaseDate: doc.data().purchaseDate?.toDate?.() || doc.data().purchaseDate,
      warrantyEndDate: doc.data().warrantyEndDate?.toDate?.() || doc.data().warrantyEndDate,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));
  } catch (error) {
    console.error('Kullanıcı garanti takipleri alınırken hata:', error);
    return [];
  }
};

// Kullanıcının gelir/gider verilerini getir
export const getUserFinancialData = async (userId: string) => {
  try {
    const [incomes, expenses, budgets, portfolios, creditCards] = await Promise.all([
      getUserIncomes(userId),
      getUserExpenses(userId),
      getUserBudgets(userId),
      getUserPortfolios(userId),
      getUserCreditCards(userId)
    ]);
    
    return {
      incomes,
      expenses,
      budgets,
      portfolios,
      creditCards
    };
  } catch (error) {
    console.error('Kullanıcı finansal verileri alınırken hata:', error);
    return {
      incomes: [],
      expenses: [],
      budgets: [],
      portfolios: [],
      creditCards: []
    };
  }
};

// Yardımcı fonksiyonlar
const getUserIncomes = async (userId: string) => {
  try {
    const incomesRef = collection(db, 'teknokapsul', userId, 'incomes');
    const q = query(incomesRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

const getUserExpenses = async (userId: string) => {
  try {
    const expensesRef = collection(db, 'teknokapsul', userId, 'expenses');
    const q = query(expensesRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

const getUserBudgets = async (userId: string) => {
  try {
    const budgetsRef = collection(db, 'teknokapsul', userId, 'budgets');
    const q = query(budgetsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

const getUserPortfolios = async (userId: string) => {
  try {
    const portfoliosRef = collection(db, 'teknokapsul', userId, 'portfolios');
    const q = query(portfoliosRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

const getUserCreditCards = async (userId: string) => {
  try {
    const creditCardsRef = collection(db, 'teknokapsul', userId, 'creditCards');
    const q = query(creditCardsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

// AI ile kapsamlı kullanıcı durumu sorgulama
export const queryUserStatus = async (userId: string, userQuery: string): Promise<string> => {
  try {
    const [applications, supportTickets, orders, cargos, warranties, financialData] = await Promise.all([
      getUserApplications(userId),
      getUserSupportTickets(userId),
      getUserOrders(userId),
      getUserCargos(userId),
      getUserWarranties(userId),
      getUserFinancialData(userId)
    ]);
    
    const prompt = `Kullanıcının sorusu: "${userQuery}"

Kullanıcının başvuruları:
${JSON.stringify(applications, null, 2)}

Kullanıcının destek talepleri:
${JSON.stringify(supportTickets, null, 2)}

Kullanıcının siparişleri:
${JSON.stringify(orders, null, 2)}

Kullanıcının kargo takipleri:
${JSON.stringify(cargos, null, 2)}

Kullanıcının garanti takipleri:
${JSON.stringify(warranties, null, 2)}

Kullanıcının finansal verileri:
${JSON.stringify(financialData, null, 2)}

Lütfen kullanıcının sorusuna göre tüm verilerini analiz ederek kapsamlı bir yanıt verin. Türkçe ve samimi bir dille yanıtlayın. 

Sipariş durumları:
- pending: Beklemede
- processing: Hazırlanıyor
- shipped: Kargoda
- delivered: Teslim Edildi
- cancelled: İptal Edildi

Kargo durumları:
- isDelivered: true = Teslim Edildi, false = Yolda

Garanti durumları:
- Garanti bitiş tarihini kontrol ederek aktif/süresi dolmuş bilgisi ver

Finansal analiz:
- Gelir/gider dengesini analiz et
- Portföy performansını değerlendir
- Kredi kartı borçlarını kontrol et
- Bütçe hedeflerine ulaşım durumunu değerlendir

Eğer soru portföy ile ilgiliyse, finansal verileri analiz et ve portföy durumunu açıkla, sipariş bilgilerini verme.`;
    
    const result = await generateText(prompt);
    return result;
  } catch (error) {
    console.error('AI durum sorgulama hatası:', error);
    return 'Üzgünüm, şu anda verilerinizi sorgulayamıyorum. Lütfen daha sonra tekrar deneyin.';
  }
};

export const getAIRecommendations = async (financialData: any, retryCount = 0): Promise<string[]> => {
  try {
    // Analyze the financial data to create a more specific prompt
    const dataAnalysis = analyzeFinancialData(financialData);
    
    const prompt = `Finansal verilerime göre 3 kısa ve net öneri ver. Her öneri tek satırda olsun ve şu formatı kullan:
    
    * [Öneri metni]
    
    Veri Analizi:
    - Toplam kredi kartı borcu: ${dataAnalysis.totalCreditDebt.toLocaleString('tr-TR')} TL
    - Aylık gelir: ${dataAnalysis.totalIncome.toLocaleString('tr-TR')} TL
    - Aylık gider: ${dataAnalysis.totalExpenses.toLocaleString('tr-TR')} TL
    - Aktif abonelik sayısı: ${dataAnalysis.activeSubscriptions}
    - Kredi kartı kullanım oranı: %${dataAnalysis.creditUtilization.toFixed(0)}
    - Tasarruf oranı: %${dataAnalysis.savingsRate.toFixed(0)}
    
    ${dataAnalysis.hasNoData ? 'NOT: Kullanıcı henüz veri girmemiş, genel finansal tavsiyeler ver.' : ''}
    
    Öneriler gerçek verilerime dayalı olsun. Eğer bir kategoride veri yoksa o konuda yorum yapma.
    
    Finansal veriler: ${JSON.stringify(financialData)}`;
    
    const result = await generateText(prompt, retryCount);
    const recommendations = result
      .split('\n')
      .filter(line => line.trim().startsWith('*'))
      .map(line => line.trim().substring(1).trim())
      .slice(0, 3);
    
    return recommendations.length > 0 ? recommendations : getSmartFallbackRecommendations(financialData);
  } catch (error: any) {
    console.error("AI önerileri alma hatası:", error);
    
    // Handle rate limiting with exponential backoff
    if (error?.message?.includes('AI_RateLimit') && retryCount < 2) {
      const delay = Math.pow(2, retryCount + 1) * 5000; // 10s, 20s for recommendations
      console.log(`AI recommendations rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getAIRecommendations(financialData, retryCount + 1);
    }
    
    // Return smart fallback recommendations based on financial data
    console.log('Using smart fallback recommendations due to AI error');
    return getSmartFallbackRecommendations(financialData);
  }
};

// Helper function to analyze financial data
const analyzeFinancialData = (financialData: any) => {
  const totalCreditDebt = financialData.creditCards?.reduce((sum: number, card: any) => 
    sum + (card.currentBalance || 0), 0) || 0;
  const totalCreditLimit = financialData.creditCards?.reduce((sum: number, card: any) => 
    sum + (card.creditLimit || 0), 0) || 0;
  const totalIncome = financialData.incomes?.reduce((sum: number, income: any) => 
    sum + (income.amount || 0), 0) || 0;
  const totalExpenses = financialData.expenses?.reduce((sum: number, expense: any) => 
    sum + (expense.amount || 0), 0) || 0;
  const activeSubscriptions = financialData.subscriptions?.filter((sub: any) => sub.isActive)?.length || 0;
  
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit) * 100 : 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  const hasNoData = totalIncome === 0 && totalExpenses === 0 && totalCreditDebt === 0 && activeSubscriptions === 0;
  
  return {
    totalCreditDebt,
    totalCreditLimit,
    totalIncome,
    totalExpenses,
    activeSubscriptions,
    creditUtilization,
    savingsRate,
    hasNoData
  };
};

// Helper function for default recommendations
const getDefaultRecommendations = (): string[] => [
  "Yüksek kredi yükü: Çok sayıda kredi ve kredi kartı borcunuz var. Bu, finansal durumunuz üzerinde ciddi bir baskı oluşturuyor.",
  "Market kategorisinde harcamalarınızı azaltmaya odaklanın.",
  "Günü geçmiş ödemelerinize dikkat edin ve öncelikle bunları kapatın."
];

// Smart fallback recommendations based on actual financial data
const getSmartFallbackRecommendations = (financialData: any): string[] => {
  const recommendations: string[] = [];
  
  try {
    // Analyze credit cards
    if (financialData.creditCards?.length > 0) {
      const totalCreditDebt = financialData.creditCards.reduce((sum: number, card: any) => 
        sum + (card.currentBalance || 0), 0);
      const totalCreditLimit = financialData.creditCards.reduce((sum: number, card: any) => 
        sum + (card.creditLimit || 0), 0);
      const utilizationRate = totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit) * 100 : 0;
      
      if (totalCreditDebt > 10000) {
        recommendations.push(`Kredi kartı borcunuz ${totalCreditDebt.toLocaleString('tr-TR')} TL. En yüksek faizli kartları öncelikle kapatın.`);
      } else if (utilizationRate > 70) {
        recommendations.push(`Kredi kartı kullanım oranınız %${utilizationRate.toFixed(0)}. %30'un altına indirmeye çalışın.`);
      }
    } else {
      recommendations.push("Kredi kartı kullanımınız yok. Bu finansal disiplin açısından olumlu.");
    }
    
    // Analyze expenses vs incomes
    const totalExpenses = financialData.expenses?.reduce((sum: number, expense: any) => 
      sum + (expense.amount || 0), 0) || 0;
    const totalIncomes = financialData.incomes?.reduce((sum: number, income: any) => 
      sum + (income.amount || 0), 0) || 0;
    
    if (totalExpenses === 0 && totalIncomes === 0) {
      recommendations.push("Henüz gelir ve gider verisi eklenmemiş. Finansal takip için veri girişi yapın.");
    } else if (totalExpenses > totalIncomes * 0.8) {
      const savingsRate = totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes * 100) : 0;
      recommendations.push(`Harcama/gelir oranınız yüksek. Tasarruf oranınız %${savingsRate.toFixed(0)}. %20'ye çıkarmaya çalışın.`);
    } else if (totalExpenses === 0) {
      recommendations.push("Harcama kaydınız yok. Gerçek finansal durumunuz için giderlerinizi kaydedin.");
    }
    
    // Analyze subscriptions
    const activeSubscriptions = financialData.subscriptions?.filter((sub: any) => sub.isActive) || [];
    const totalSubscriptionCost = activeSubscriptions.reduce((sum: number, sub: any) => 
      sum + (sub.amount || 0), 0);
    
    if (activeSubscriptions.length > 5) {
      recommendations.push(`${activeSubscriptions.length} aktif aboneliğiniz var (${totalSubscriptionCost.toLocaleString('tr-TR')} TL/ay). Kullanmadıklarınızı iptal edin.`);
    } else if (activeSubscriptions.length === 0) {
      recommendations.push("Abonelik kaydınız yok. Düzenli ödemelerinizi takip etmek için ekleyin.");
    }
    
    // Analyze loans
    if (financialData.loans?.length > 0) {
      const totalLoanDebt = financialData.loans.reduce((sum: number, loan: any) => 
        sum + (loan.remainingAmount || 0), 0);
      if (totalLoanDebt > 50000) {
        recommendations.push(`Toplam kredi borcunuz ${totalLoanDebt.toLocaleString('tr-TR')} TL. Erken ödeme seçeneklerini değerlendirin.`);
      }
    }
    
    // Fill with default recommendations if not enough specific ones
    while (recommendations.length < 3) {
      const defaults = [
        "Acil durum fonu oluşturun. 3-6 aylık harcamanız kadar para biriktirin.",
        "Yatırım portföyünüzü çeşitlendirin. Farklı varlık sınıflarına yatırım yapın.",
        "Finansal hedeflerinizi belirleyin ve bunlar için bütçe oluşturun."
      ];
      const remaining = defaults.filter(rec => !recommendations.includes(rec));
      if (remaining.length > 0) {
        recommendations.push(remaining[0]);
      } else {
        break;
      }
    }
    
    return recommendations.slice(0, 3);
  } catch (error) {
    console.error("Error generating smart fallback recommendations:", error);
    return getDefaultRecommendations();
  }
};

// Export aiService object for backward compatibility
export const aiService = {
  generateText,
  generateStructuredOutput,
  startChat,
  getUserApplications,
  getUserSupportTickets,
  getUserOrders,
  getUserCargos,
  getUserWarranties,
  getUserFinancialData,
  queryUserStatus,
  getAIRecommendations
};