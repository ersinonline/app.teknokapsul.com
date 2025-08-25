import { xai } from "@ai-sdk/xai";
import { generateText as aiGenerateText, streamText, generateObject } from "ai";
import { z } from "zod";

// Export types for use in other services
export interface ObjectSchemaInterface {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

import { app, db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getAllSupportTickets } from "./support.service";
import { getUserCargoTrackings } from "./cargo.service";

// XAI Grok-2 modelini oluştur
const model = xai("grok-2-1212");

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const result = await aiGenerateText({
      model,
      prompt,
      temperature: 0.7,
    });
    return result.text;
  } catch (error) {
    console.error("Error generating text:", error);
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

export const getAIRecommendations = async (financialData: any): Promise<string[]> => {
  try {
    const prompt = `Finansal verilerime göre 3 kısa ve net öneri ver. Her öneri tek satırda olsun ve şu formatı kullan:
    
    * [Öneri metni]
    
    Örnek:
    * Yüksek kredi yükü: Çok sayıda kredi ve kredi kartı borcunuz var. Bu, finansal durumunuz üzerinde ciddi bir baskı oluşturuyor.
    * Market kategorisinde harcamalarınızı azaltmaya odaklanın.
    * Günü geçmiş ödemelerinize dikkat edin ve öncelikle bunları kapatın.
    
    Finansal veriler: ${JSON.stringify(financialData)}`;
    
    const result = await generateText(prompt);
    const recommendations = result
      .split('\n')
      .filter(line => line.trim().startsWith('*'))
      .map(line => line.trim().substring(1).trim())
      .slice(0, 3);
    
    return recommendations.length > 0 ? recommendations : [
      "Yüksek kredi yükü: Çok sayıda kredi ve kredi kartı borcunuz var. Bu, finansal durumunuz üzerinde ciddi bir baskı oluşturuyor.",
      "Market kategorisinde harcamalarınızı azaltmaya odaklanın.",
      "Günü geçmiş ödemelerinize dikkat edin ve öncelikle bunları kapatın."
    ];
  } catch (error) {
    console.error("AI önerileri alma hatası:", error);
    return [
      "Yüksek kredi yükü: Çok sayıda kredi ve kredi kartı borcunuz var. Bu, finansal durumunuz üzerinde ciddi bir baskı oluşturuyor.",
      "Market kategorisinde harcamalarınızı azaltmaya odaklanın.",
      "Günü geçmiş ödemelerinize dikkat edin ve öncelikle bunları kapatın."
    ];
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