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
import { offlineService } from './offline.service';

class PortfolioService {

  // Borsa API'si ile hisse fiyatlarını güncelleme
  async updateStockPricesFromAPI(userId: string): Promise<void> {
    try {
      // Borsa verilerini çek
      const response = await fetch('https://doviz-api.onrender.com/api/borsaAll');
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Borsa verileri alınamadı');
      }
      
      // Kullanıcının portföyündeki hisseleri al
      const portfolioItems = await this.getPortfolioItems(userId);
      const stockItems = portfolioItems.filter(item => item.type === 'stock');
      
      // Her hisse için güncel fiyatı bul ve güncelle
      for (const stockItem of stockItems) {
        const stockData = data.data.find((stock: any) => 
          stock.name.toLowerCase().includes(stockItem.symbol.toLowerCase()) ||
          stockItem.name.toLowerCase().includes(stock.name.toLowerCase())
        );
        
        if (stockData) {
          // Türkçe fiyat formatını sayıya çevir ("4.459,25" -> 4459.25)
          const currentPrice = this.parseTurkishPrice(stockData.price);
          const totalValue = stockItem.quantity * currentPrice;
          const totalInvestment = stockItem.quantity * stockItem.purchasePrice;
          const totalReturn = totalValue - totalInvestment;
          const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
          
          await this.updatePortfolioItem(userId, stockItem.id, {
            currentPrice,
            totalValue,
            totalReturn,
            returnPercentage,
            lastUpdated: new Date()
          });
          
          console.log(`${stockItem.symbol} fiyatı güncellendi: ${currentPrice} TL`);
        }
      }
      
      console.log('Hisse fiyatları başarıyla güncellendi');
    } catch (error) {
      console.error('Hisse fiyatları güncellenirken hata:', error);
      throw error;
    }
  }
  
  // Türkçe fiyat formatını sayıya çevirme fonksiyonu
  private parseTurkishPrice(priceStr: string): number {
    // "4.459,25" -> 4459.25
    return parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
  }
  
  // Belirli bir hisse için güncel fiyat alma
  async getStockCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch('https://doviz-api.onrender.com/api/borsaAll');
      const data = await response.json();
      
      if (!data.success || !data.data) {
        return null;
      }
      
      const stockData = data.data.find((stock: any) => 
        stock.name.toLowerCase().includes(symbol.toLowerCase())
      );
      
      if (stockData) {
        return this.parseTurkishPrice(stockData.price);
      }
      
      return null;
    } catch (error) {
      console.error('Hisse fiyatı alınırken hata:', error);
      return null;
    }
  }

  // Tüm fiyatları güncelleme (hisse, döviz, altın)
  async updateAllPricesFromAPI(userId: string): Promise<void> {
    try {
      // Hisse fiyatlarını güncelle
      await this.updateStockPricesFromAPI(userId);
      
      // Döviz, altın ve vadeli hesap fiyatlarını güncelle (kripto ve fonlar hariç)
      const portfolioItems = await this.getPortfolioItems(userId);
      const currencyAndGoldItems = portfolioItems.filter(item => 
        item.type === 'currency' || item.type === 'gold' || item.type === 'deposit'
      );
      
      for (const item of currencyAndGoldItems) {
        try {
          let apiUrl = '';
          
          if (item.type === 'currency') {
            if (item.symbol === 'USD') {
              apiUrl = 'https://doviz-api.onrender.com/api/usd';
            } else if (item.symbol === 'EUR') {
              apiUrl = 'https://doviz-api.onrender.com/api/eur';
            }
          } else if (item.type === 'gold') {
            if (item.symbol === 'GOLD') {
              apiUrl = 'https://doviz-api.onrender.com/api/gold';
            } else if (item.symbol === 'GRAM') {
              apiUrl = 'https://doviz-api.onrender.com/api/gram';
            }
          }
          
          if (apiUrl) {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success && data.data?.selling) {
              const currentPrice = parseFloat(data.data.selling.replace(',', '.'));
              const totalValue = item.quantity * currentPrice;
              const totalInvestment = item.quantity * item.purchasePrice;
              const totalReturn = totalValue - totalInvestment;
              const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
              
              await this.updatePortfolioItem(userId, item.id, {
                currentPrice,
                totalValue,
                totalReturn,
                returnPercentage,
                lastUpdated: new Date()
              });
              
              console.log(`${item.symbol} fiyatı güncellendi: ${currentPrice} TL`);
            }
          }
        } catch (error) {
          console.error(`${item.symbol} fiyatı güncellenirken hata:`, error);
        }
      }
      
      console.log('Tüm fiyatlar başarıyla güncellendi');
    } catch (error) {
      console.error('Fiyatlar güncellenirken hata:', error);
      throw error;
    }
  }

  // Vadeli hesap için otomatik getiri hesaplama
  async calculateDailyReturn(portfolioItem: PortfolioItem): Promise<number> {
    if (!portfolioItem.metadata?.annualInterestRate || !portfolioItem.metadata?.taxExemptPercentage) {
      return 0;
    }

    const annualRate = portfolioItem.metadata.annualInterestRate;
    const taxExemptPercentage = portfolioItem.metadata.taxExemptPercentage;
    const totalAmount = portfolioItem.quantity * portfolioItem.purchasePrice;
    
    // Faiz işlemeyecek kısım (ana paradan düşülür)
    const exemptAmount = totalAmount * (taxExemptPercentage / 100);
    
    // Faiz işleyecek kısım
    const taxableAmount = totalAmount - exemptAmount;
    
    // Günlük brüt faiz hesaplama (faiz işleyecek kısımdan)
    const dailyGrossInterest = taxableAmount * (annualRate / 100) / 365;
    
    // %17.5 stopaj vergisi
    const withholdingTax = dailyGrossInterest * 0.175;
    
    // Günlük net getiri
    const dailyReturn = dailyGrossInterest - withholdingTax;
    
    return dailyReturn;
  }

  // Vadeli hesap için günlük getiri ekleme
  async addDailyReturnToDeposit(userId: string, portfolioItemId: string): Promise<void> {
    try {
      const items = await this.getPortfolioItems(userId);
      const depositItem = items.find(item => item.id === portfolioItemId && item.type === 'deposit');
      
      if (!depositItem) {
        throw new Error('Vadeli hesap bulunamadı');
      }

      // Vade tarihi kontrolü
      if (depositItem.metadata?.maturityDate) {
        const maturityDate = new Date(depositItem.metadata.maturityDate);
        const today = new Date();
        if (today > maturityDate) {
          console.log(`Vadeli hesap ${depositItem.name} vade tarihi geçmiş, getiri eklenmedi.`);
          return;
        }
      }

      const dailyReturn = await this.calculateDailyReturn(depositItem);
      
      if (dailyReturn <= 0) {
        console.log(`Vadeli hesap ${depositItem.name} için geçerli getiri hesaplanamadı.`);
        return;
      }

      const newTotalValue = depositItem.totalValue + dailyReturn;
      const newCurrentPrice = newTotalValue / depositItem.quantity;
      
      const totalInvestment = depositItem.quantity * depositItem.purchasePrice;
      const totalReturn = newTotalValue - totalInvestment;
      const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

      await this.updatePortfolioItem(userId, portfolioItemId, {
        currentPrice: newCurrentPrice,
        totalValue: newTotalValue,
        totalReturn,
        returnPercentage,
        lastUpdated: new Date()
      });

      console.log(`Vadeli hesap ${depositItem.name} günlük getiri eklendi: ${dailyReturn.toFixed(2)} TL`);
    } catch (error) {
      console.error('Vadeli hesap günlük getiri ekleme hatası:', error);
      throw error;
    }
  }

  // Tüm vadeli hesaplar için günlük getiri ekleme
  async addDailyReturnToAllDeposits(userId: string): Promise<void> {
    try {
      const items = await this.getPortfolioItems(userId);
      const depositItems = items.filter(item => item.type === 'deposit');
      
      console.log(`${depositItems.length} vadeli hesap için günlük getiri hesaplanıyor...`);
      
      for (const depositItem of depositItems) {
        await this.addDailyReturnToDeposit(userId, depositItem.id);
      }
      
      console.log('Tüm vadeli hesaplar için günlük getiri ekleme tamamlandı.');
    } catch (error) {
      console.error('Tüm vadeli hesaplar için günlük getiri ekleme hatası:', error);
      throw error;
    }
  }

  // Vadeli hesap bilgilerini güncelleme
  async updateDepositInfo(userId: string, portfolioItemId: string, metadata: any): Promise<void> {
    try {
      const items = await this.getPortfolioItems(userId);
      const depositItem = items.find(item => item.id === portfolioItemId && item.type === 'deposit');
      
      if (!depositItem) {
        throw new Error('Vadeli hesap bulunamadı');
      }

      await this.updatePortfolioItem(userId, portfolioItemId, {
        metadata: {
          ...depositItem.metadata,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Vadeli hesap bilgi güncelleme hatası:', error);
      throw error;
    }
  }

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

      if (navigator.onLine) {
        const docRef = await addDoc(collection(db, 'teknokapsul', userId, 'portfolio'), portfolioItem);
        
        // Save to offline storage
        const itemWithId = { id: docRef.id, ...portfolioItem };
        await offlineService.saveData('portfolioItems', itemWithId);
        
        return docRef.id;
      } else {
        // Generate temporary ID for offline
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const itemWithId = { id: tempId, ...portfolioItem };
        
        // Save to offline storage and queue for sync
        await offlineService.saveData('portfolioItems', itemWithId);
        await offlineService.addToSyncQueue('create', 'portfolio', itemWithId, userId);
        
        return tempId;
      }
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      throw error;
    }
  }

  async getPortfolioItems(userId: string): Promise<PortfolioItem[]> {
    try {
      // Try to get from Firebase first
      if (navigator.onLine) {
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
          
          console.log(`💰 Portföy öğesi hesaplaması:`, {
            symbol: data.symbol,
            quantity: data.quantity,
            purchasePrice: data.purchasePrice,
            currentPrice: currentPrice,
            totalValue: totalValue,
            dbCurrentPrice: data.currentPrice
          });
          
          const item = {
            id: docSnap.id,
            ...data,
            currentPrice,
            totalValue,
            totalReturn,
            returnPercentage,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date()
          } as PortfolioItem;

          items.push(item);
          
          // Save to offline storage
          await offlineService.saveData('portfolioItems', item);
        }
        
        return items;
      } else {
        // Get from offline storage
        const offlineItems = await offlineService.getData('portfolioItems');
        return offlineItems || [];
      }
    } catch (error) {
      console.error('Error getting portfolio items:', error);
      // Fallback to offline data
      const offlineItems = await offlineService.getData('portfolioItems');
      return offlineItems || [];
    }
  }

  async updatePortfolioItem(userId: string, id: string, updates: Partial<PortfolioItem>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (navigator.onLine) {
        const docRef = doc(db, 'teknokapsul', userId, 'portfolio', id);
        await updateDoc(docRef, updateData);
        
        // Update offline storage
        const existingItem = await offlineService.getData('portfolioItems', id);
        if (existingItem) {
          await offlineService.saveData('portfolioItems', { ...existingItem, ...updateData });
        }
      } else {
        // Save to offline storage and queue for sync
        const existingItem = await offlineService.getData('portfolioItems', id);
        if (existingItem) {
          await offlineService.saveData('portfolioItems', { ...existingItem, ...updateData });
        }
        await offlineService.addToSyncQueue('update', 'portfolio', { id, ...updateData }, userId);
      }
    } catch (error) {
      console.error('Error updating portfolio item:', error);
      throw error;
    }
  }

  async deletePortfolioItem(userId: string, id: string): Promise<void> {
    try {
      if (navigator.onLine) {
        await deleteDoc(doc(db, 'teknokapsul', userId, 'portfolio', id));
        // Remove from offline storage
        await offlineService.deleteData('portfolioItems', id);
      } else {
        // Remove from offline storage and queue for sync
        await offlineService.deleteData('portfolioItems', id);
        await offlineService.addToSyncQueue('delete', 'portfolio', { id }, userId);
      }
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
    console.log('🔄 Consolidation başlıyor, gelen items:', items.length);
    const symbolMap = new Map<string, PortfolioItem>();
    
    items.forEach((item, index) => {
      console.log(`🔄 İşlenen item ${index + 1}:`, {
        symbol: item.symbol,
        type: item.type,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        currentPrice: item.currentPrice,
        totalValue: item.totalValue
      });
      
      const existing = symbolMap.get(item.symbol);
      
      if (existing) {
        console.log(`🔄 ${item.symbol} için mevcut item bulundu, birleştiriliyor...`);
        
        // Vadeli hesaplar için özel mantık
        if (item.type === 'deposit') {
          console.log(`🔄 ${item.symbol} vadeli hesap - özel birleştirme mantığı`);
          // Vadeli hesaplarda quantity aslında miktar (TL), adet değil
          // Bu yüzden totalValue'ları direkt toplarız
          const totalValue = existing.totalValue + item.totalValue;
          const totalInvestment = existing.totalValue + item.totalValue; // Vadeli hesapta investment = current value
          const totalReturn = 0; // Vadeli hesapta getiri ayrı hesaplanır
          const returnPercentage = 0;
          
          console.log(`🔄 ${item.symbol} vadeli hesap birleştirme sonucu:`, {
            totalValue,
            totalInvestment
          });
          
          symbolMap.set(item.symbol, {
            ...existing,
            quantity: totalValue, // Vadeli hesapta quantity = toplam miktar
            purchasePrice: 1, // Vadeli hesapta birim fiyat 1 TL
            currentPrice: 1,
            totalValue,
            totalReturn,
            returnPercentage,
            updatedAt: item.updatedAt > existing.updatedAt ? item.updatedAt : existing.updatedAt,
            lastUpdated: item.lastUpdated > existing.lastUpdated ? item.lastUpdated : existing.lastUpdated
          });
        } else {
          // Normal yatırımlar için mevcut mantık
          const totalQuantity = existing.quantity + item.quantity;
          const totalInvestment = (existing.quantity * existing.purchasePrice) + (item.quantity * item.purchasePrice);
          const avgPurchasePrice = totalInvestment / totalQuantity;
          const totalValue = totalQuantity * item.currentPrice;
          const totalReturn = totalValue - totalInvestment;
          const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
          
          console.log(`🔄 ${item.symbol} normal yatırım birleştirme sonucu:`, {
            totalQuantity,
            avgPurchasePrice,
            currentPrice: item.currentPrice,
            totalValue,
            totalInvestment
          });
          
          symbolMap.set(item.symbol, {
            ...existing,
            quantity: totalQuantity,
            purchasePrice: avgPurchasePrice,
            totalValue,
            totalReturn,
            returnPercentage,
            updatedAt: item.updatedAt > existing.updatedAt ? item.updatedAt : existing.updatedAt,
            lastUpdated: item.lastUpdated > existing.lastUpdated ? item.lastUpdated : existing.lastUpdated
          });
        }
      } else {
        console.log(`🔄 ${item.symbol} için yeni item ekleniyor`);
        symbolMap.set(item.symbol, { ...item });
      }
    });
    
    const result = Array.from(symbolMap.values());
    console.log('🔄 Consolidation tamamlandı, sonuç:', result.length, 'item');
    return result;
  }

  // Portfolio Analysis
  calculatePortfolioSummary(items: PortfolioItem[]): PortfolioSummary {
    console.log('📊 Portfolio Summary Hesaplaması Başlıyor...');
    console.log('📊 Gelen items:', items.length, 'adet');
    
    // Her bir item'ın detaylarını logla
    items.forEach((item, index) => {
      console.log(`📊 Item ${index + 1}:`, {
        symbol: item.symbol,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        currentPrice: item.currentPrice,
        totalValue: item.totalValue,
        calculated: item.quantity * (item.currentPrice || item.purchasePrice)
      });
    });
    
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    console.log('📊 Hesaplanan toplam değer:', totalValue);
    
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