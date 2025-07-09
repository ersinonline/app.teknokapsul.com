import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PortfolioItem, PortfolioSummary, AIRecommendation, PortfolioAnalysis, PORTFOLIO_CATEGORIES } from '../types/portfolio';

import { exchangeRateService } from './exchange-rate.service';

class PortfolioService {

  // Manuel fiyat güncelleme - API kullanılmıyor
  // Fiyatlar sadece kullanıcı tarafından manuel olarak güncellenecek

  // Tüm güncel kurları alma
  async getAllCurrentRates() {
    try {
      return await exchangeRateService.getAllCurrentRates();
    } catch (error) {
      console.error('Error getting all current rates:', error);
      return [];
    }
  }

  // Portfolio CRUD Operations
  async addPortfolioItem(userId: string, item: Omit<PortfolioItem, 'id' | 'currentPrice' | 'totalValue' | 'totalReturn' | 'returnPercentage' | 'lastUpdated'>): Promise<string> {
    try {
      // Başlangıçta alış fiyatını güncel fiyat olarak kullan
      const currentPrice = item.purchasePrice;
      const totalValue = item.quantity * currentPrice;
      const totalInvestment = item.quantity * item.purchasePrice;
      const totalReturn = totalValue - totalInvestment; // Başlangıçta 0 olacak
      const returnPercentage = 0; // Başlangıçta 0

      const portfolioItem: Omit<PortfolioItem, 'id'> = {
        ...item,
        userId: item.userId || userId,
        currentPrice,
        totalValue,
        totalReturn,
        returnPercentage,
        createdAt: item.createdAt || new Date(),
        updatedAt: item.updatedAt || new Date(),
        lastUpdated: new Date()
      };

      const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'portfolio'), portfolioItem);
      return docRef.id;
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      throw error;
    }
  }

  async getPortfolioItems(userId: string): Promise<PortfolioItem[]> {
    try {
      const q = query(
        collection(db, 'teknokapsul', userId, 'portfolio'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: PortfolioItem[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        // Veritabanında kayıtlı currentPrice'ı kullan, yoksa alış fiyatını kullan
        const currentPrice = data.currentPrice || data.purchasePrice;
        
        const totalValue = data.quantity * currentPrice;
        const totalInvestment = data.quantity * data.purchasePrice;
        const totalReturn = totalValue - totalInvestment;
        const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        


        items.push({
          id: docSnap.id,
          ...data,
          currentPrice,
          totalValue,
          totalReturn,
          returnPercentage,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as PortfolioItem);
      }
      
      return items;
    } catch (error) {
      console.error('Error getting portfolio items:', error);
      return [];
    }
  }

  async updatePortfolioItem(id: string, userId: string, updates: Partial<PortfolioItem>): Promise<void> {
    try {
      const docRef = doc(db, 'teknokapsul', userId, 'portfolio', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating portfolio item:', error);
      throw error;
    }
  }

  async deletePortfolioItem(id: string, userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teknokapsul', userId, 'portfolio', id));
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      throw error;
    }
  }

  // Aynı sembol türündeki tüm yatırımları toplu güncelleme
  async updatePortfolioItemsBySymbol(userId: string, symbol: string, newPrice: number): Promise<void> {
    try {
      const q = query(
        collection(db, 'teknokapsul', userId, 'portfolio'),
        where('symbol', '==', symbol)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const quantity = data.quantity;
        const purchasePrice = data.purchasePrice;
        
        const totalValue = quantity * newPrice;
        const totalInvestment = quantity * purchasePrice;
        const totalReturn = totalValue - totalInvestment;
        const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        
        const updatePromise = updateDoc(doc(db, 'teknokapsul', userId, 'portfolio', docSnap.id), {
          currentPrice: newPrice,
          totalValue,
          totalReturn,
          returnPercentage,
          lastUpdated: new Date(),
          updatedAt: new Date()
        });
        
        updatePromises.push(updatePromise);
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating portfolio items by symbol:', error);
      throw error;
    }
  }

  // Aynı sembol türündeki yatırımları birleştir (grafik için)
  consolidatePortfolioBySymbol(items: PortfolioItem[]): PortfolioItem[] {
    const symbolMap = new Map<string, PortfolioItem>();
    
    items.forEach(item => {
      const existing = symbolMap.get(item.symbol);
      
      if (existing) {
        // Mevcut yatırımla birleştir
        const totalQuantity = existing.quantity + item.quantity;
        const totalInvestment = (existing.quantity * existing.purchasePrice) + (item.quantity * item.purchasePrice);
        const avgPurchasePrice = totalInvestment / totalQuantity;
        const totalValue = totalQuantity * item.currentPrice;
        const totalReturn = totalValue - totalInvestment;
        const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        
        symbolMap.set(item.symbol, {
          ...existing,
          quantity: totalQuantity,
          purchasePrice: avgPurchasePrice,
          totalValue,
          totalReturn,
          returnPercentage,
          // En son güncellenen tarihi kullan
          updatedAt: item.updatedAt > existing.updatedAt ? item.updatedAt : existing.updatedAt,
          lastUpdated: item.lastUpdated > existing.lastUpdated ? item.lastUpdated : existing.lastUpdated
        });
      } else {
        symbolMap.set(item.symbol, { ...item });
      }
    });
    
    return Array.from(symbolMap.values());
  }

  // Portfolio Analysis
  calculatePortfolioSummary(items: PortfolioItem[]): PortfolioSummary {
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const totalInvestment = items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    const totalReturn = totalValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
    
    const bestPerformer = items.reduce((best, item) => 
      !best || item.returnPercentage > best.returnPercentage ? item : best, null as PortfolioItem | null
    );
    
    const worstPerformer = items.reduce((worst, item) => 
      !worst || item.returnPercentage < worst.returnPercentage ? item : worst, null as PortfolioItem | null
    );

    // Calculate category breakdown
    const categoryMap = new Map<string, { value: number; count: number }>();
    items.forEach(item => {
      const categoryName = PORTFOLIO_CATEGORIES[item.type] || item.type;
      const existing = categoryMap.get(categoryName) || { value: 0, count: 0 };
      categoryMap.set(categoryName, {
        value: existing.value + item.totalValue,
        count: existing.count + 1
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count
    }));

    return {
      totalValue,
      totalCost: totalInvestment,
      totalInvestment,
      totalReturn,
      totalGainLoss: totalReturn,
      totalGainLossPercentage: returnPercentage,
      returnPercentage,
      dayChange: 0, // Bu gerçek zamanlı veri gerektirir
      dayChangePercent: 0,
      bestPerformer,
      worstPerformer,
      lastUpdated: new Date(),
      totalItems: items.length,
      itemCount: items.length,
      categoryBreakdown
    };
  }

  async generateAIRecommendations(items: PortfolioItem[]): Promise<AIRecommendation[]> {
    try {
      const summary = this.calculatePortfolioSummary(items);
      
      // Basit AI önerileri oluştur (gerçek AI servisi olmadığı için)
      const recommendations: AIRecommendation[] = [];
      
      // Portföy analizi yaparak öneriler oluştur
      if (items.length === 0) {
        recommendations.push({
          id: Date.now().toString() + Math.random(),
          type: 'buy',
          title: 'İlk Yatırımınızı Yapın',
          description: 'Portföyünüzde henüz yatırım bulunmuyor. Çeşitlendirilmiş bir portföy oluşturmak için farklı varlık sınıflarından yatırım yapmayı düşünün.',
          priority: 'high',
          reasoning: 'Yatırıma başlamak için en iyi zaman şimdi. Erken başlamak compound faizin avantajını sağlar.',
          confidence: 90,
          risk: 'medium',
          expectedReturn: 8,
          createdAt: new Date()
        });
      } else {
        // Çeşitlendirme analizi
        const uniqueTypes = new Set(items.map(item => item.type)).size;
        if (uniqueTypes < 3) {
          recommendations.push({
            id: Date.now().toString() + Math.random(),
            type: 'diversify',
            title: 'Portföyünüzü Çeşitlendirin',
            description: 'Portföyünüzde sadece ${uniqueTypes} farklı varlık türü bulunuyor. Risk dağıtımı için daha fazla çeşitlendirme yapabilirsiniz.',
            priority: 'medium',
            reasoning: 'Çeşitlendirme riski azaltır ve daha istikrarlı getiri sağlar.',
            confidence: 85,
            risk: 'low',
            expectedReturn: 0,
            createdAt: new Date()
          });
        }
        
        // Performans analizi
        const bestPerformer = items.reduce((best, item) => 
          !best || item.returnPercentage > best.returnPercentage ? item : best
        );
        
        const worstPerformer = items.reduce((worst, item) => 
          !worst || item.returnPercentage < worst.returnPercentage ? item : worst
        );
        
        if (bestPerformer.returnPercentage > 20) {
          recommendations.push({
            id: Date.now().toString() + Math.random(),
            type: 'hold',
            title: `${bestPerformer.name} Pozisyonunu Koruyun`,
            description: `${bestPerformer.name} yatırımınız %${bestPerformer.returnPercentage.toFixed(2)} getiri sağlıyor. Bu güçlü performansı korumaya devam edin.`,
            priority: 'medium',
            reasoning: 'Güçlü performans gösteren yatırımları korumak portföy değerini artırır.',
            confidence: 80,
            risk: 'low',
            expectedReturn: bestPerformer.returnPercentage,
            createdAt: new Date()
          });
        }
        
        if (worstPerformer.returnPercentage < -15) {
          recommendations.push({
            id: Date.now().toString() + Math.random(),
            type: 'warning',
            title: `${worstPerformer.name} Pozisyonunu Gözden Geçirin`,
            description: `${worstPerformer.name} yatırımınız %${worstPerformer.returnPercentage.toFixed(2)} zarar ediyor. Bu pozisyonu gözden geçirmeyi düşünün.`,
            priority: 'high',
            reasoning: 'Sürekli zarar eden yatırımlar portföy performansını olumsuz etkiler.',
            confidence: 75,
            risk: 'high',
            expectedReturn: worstPerformer.returnPercentage,
            createdAt: new Date()
          });
        }
        
        // Genel portföy önerisi
        if (summary.returnPercentage > 0) {
          recommendations.push({
            id: Date.now().toString() + Math.random(),
            type: 'hold',
            title: 'Portföy Performansı Olumlu',
            description: `Portföyünüz %${summary.returnPercentage.toFixed(2)} getiri sağlıyor. Mevcut stratejinizi sürdürmeye devam edin.`,
            priority: 'low',
            reasoning: 'Pozitif getiri sağlayan portföylerde mevcut stratejiyi korumak mantıklıdır.',
            confidence: 70,
            risk: 'low',
            expectedReturn: summary.returnPercentage,
            createdAt: new Date()
          });
        }
      }
      
      return recommendations.slice(0, 5); // Maksimum 5 öneri
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return [];
    }
  }

  async analyzePortfolio(items: PortfolioItem[]): Promise<PortfolioAnalysis> {
    try {
      const recommendations = await this.generateAIRecommendations(items);
      
      // Asset allocation calculation
      const assetAllocation: { [key: string]: number } = {};
      const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
      
      items.forEach(item => {
        const percentage = totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0;
        assetAllocation[item.type] = (assetAllocation[item.type] || 0) + percentage;
      });

      // Diversification score (simple calculation)
      const uniqueTypes = new Set(items.map(item => item.type)).size;
      const diversificationScore = Math.min((uniqueTypes / 4) * 100, 100); // Max 4 types

      // Risk level based on volatility and concentration
      const maxConcentration = Math.max(...Object.values(assetAllocation));
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (maxConcentration > 70) riskLevel = 'high';
      else if (maxConcentration > 50) riskLevel = 'medium';

      // Calculate stability score based on diversification and risk
      const stabilityScore = Math.max(0, Math.min(100, diversificationScore - (riskLevel === 'high' ? 30 : riskLevel === 'medium' ? 15 : 0)));
      
      // Generate suggestions based on analysis
      const suggestions = [
        diversificationScore < 50 ? 'Portföyünüzü daha fazla çeşitlendirmeyi düşünün' : '',
        maxConcentration > 60 ? 'Tek bir varlık türüne fazla yoğunlaşmış durumdasınız' : '',
        items.length < 3 ? 'Daha fazla yatırım aracı eklemeyi değerlendirin' : ''
      ].filter(Boolean);
      
      // Identify strengths
      const strengths = [
        diversificationScore >= 70 ? 'İyi çeşitlendirilmiş portföy' : '',
        riskLevel === 'low' ? 'Düşük risk seviyesi' : '',
        items.some(item => item.returnPercentage > 10) ? 'Güçlü performans gösteren yatırımlar mevcut' : ''
      ].filter(Boolean);
      
      // Identify weaknesses
      const weaknesses = [
        diversificationScore < 40 ? 'Yetersiz çeşitlendirme' : '',
        riskLevel === 'high' ? 'Yüksek risk konsantrasyonu' : '',
        items.some(item => item.returnPercentage < -10) ? 'Düşük performanslı yatırımlar mevcut' : ''
      ].filter(Boolean);

      return {
        diversificationScore,
        riskLevel,
        recommendations,
        sectorAllocation: {}, // Bu hisse senetleri için gerekli
        assetAllocation,
        performanceMetrics: {
          sharpeRatio: 0, // Karmaşık hesaplama gerektirir
          volatility: 0,
          maxDrawdown: 0
        },
        stabilityScore,
        suggestions,
        strengths,
        weaknesses
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();
export default portfolioService;