import { Expense } from '../types/expense';
import { generateStructuredOutput, ObjectSchemaInterface } from './ai.service';
import { SchemaType } from '@firebase/ai';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export interface MerchantInfo {
  name: string;
  category: string;
  location?: string;
}

class CategorizationService {
  private categoryKeywords: Record<string, string[]> = {
    'Yemek & İçecek': [
      'restoran', 'cafe', 'kahve', 'pizza', 'burger', 'döner', 'kebap',
      'market', 'bakkal', 'şarküteri', 'kasap', 'manav', 'migros', 'carrefour',
      'bim', 'a101', 'şok', 'getir', 'yemeksepeti', 'trendyol yemek'
    ],
    'Ulaşım': [
      'benzin', 'motorin', 'lpg', 'otobüs', 'metro', 'taksi', 'uber',
      'bitaksi', 'otopark', 'köprü', 'otoyol', 'havayolu', 'thy',
      'pegasus', 'onur air', 'anadolujet'
    ],
    'Alışveriş': [
      'mağaza', 'alışveriş', 'giyim', 'ayakkabı', 'elektronik', 'teknosa',
      'vatan', 'media markt', 'n11', 'hepsiburada', 'trendyol', 'amazon'
    ],
    'Sağlık': [
      'eczane', 'hastane', 'doktor', 'diş', 'veteriner', 'ilaç',
      'sağlık', 'tıbbi', 'muayene', 'tahlil'
    ],
    'Eğlence': [
      'sinema', 'tiyatro', 'konser', 'bar', 'pub', 'kulüp', 'oyun',
      'netflix', 'spotify', 'youtube', 'steam', 'playstation'
    ],
    'Faturalar': [
      'elektrik', 'su', 'doğalgaz', 'internet', 'telefon', 'turkcell',
      'vodafone', 'türk telekom', 'superonline', 'ttnet'
    ],
    'Eğitim': [
      'okul', 'üniversite', 'kurs', 'kitap', 'kırtasiye', 'eğitim',
      'öğrenim', 'dershane', 'özel ders'
    ],
    'Ev & Yaşam': [
      'kira', 'aidat', 'temizlik', 'mobilya', 'dekorasyon', 'bahçe',
      'ev', 'yatak', 'mutfak', 'banyo'
    ],
    'Spor & Fitness': [
      'spor', 'fitness', 'gym', 'yoga', 'pilates', 'yüzme', 'koşu',
      'bisiklet', 'futbol', 'basketbol'
    ],
    'Güzellik & Bakım': [
      'kuaför', 'berber', 'güzellik', 'makyaj', 'cilt', 'saç',
      'masaj', 'spa', 'kozmetik'
    ],
    'Sigorta': [
      'sigorta', 'kasko', 'trafik', 'sağlık sigortası', 'hayat sigortası',
      'konut sigortası', 'dask'
    ],
    'Vergi & Resmi': [
      'vergi', 'harç', 'ceza', 'trafik cezası', 'belediye', 'noter',
      'mahkeme', 'icra'
    ],
    'Yatırım': [
      'hisse', 'borsa', 'altın', 'döviz', 'bitcoin', 'kripto',
      'yatırım fonu', 'tahvil'
    ],
    'Bağış & Yardım': [
      'bağış', 'yardım', 'sadaka', 'zakat', 'fitre', 'kurban',
      'dernek', 'vakıf'
    ],
    'Diğer': []
  };

  private merchantDatabase: { [key: string]: MerchantInfo } = {
    'migros': { name: 'Migros', category: 'Yemek & İçecek' },
    'carrefour': { name: 'CarrefourSA', category: 'Yemek & İçecek' },
    'bim': { name: 'BİM', category: 'Yemek & İçecek' },
    'a101': { name: 'A101', category: 'Yemek & İçecek' },
    'şok': { name: 'ŞOK', category: 'Yemek & İçecek' },
    'teknosa': { name: 'Teknosa', category: 'Alışveriş' },
    'vatan': { name: 'Vatan Bilgisayar', category: 'Alışveriş' },
    'media markt': { name: 'Media Markt', category: 'Alışveriş' },
    'turkcell': { name: 'Turkcell', category: 'Faturalar' },
    'vodafone': { name: 'Vodafone', category: 'Faturalar' },
    'türk telekom': { name: 'Türk Telekom', category: 'Faturalar' }
  };

  async categorizeExpense(expense: Expense): Promise<CategorySuggestion> {
    try {
      // First try rule-based categorization
      const ruleBasedResult = this.categorizeByRules(expense);
      if (ruleBasedResult.confidence > 0.8) {
        return ruleBasedResult;
      }

      // If rule-based is not confident enough, use AI
      const aiResult = await this.categorizeWithAI(expense);
      
      // Combine results, preferring AI if it's more confident
      if (aiResult.confidence > ruleBasedResult.confidence) {
        return aiResult;
      }
      
      return ruleBasedResult;
    } catch (error) {
      console.error('Error categorizing expense:', error);
      return {
        category: 'Diğer',
        confidence: 0.1,
        reason: 'Kategorizasyon hatası'
      };
    }
  }

  private categorizeByRules(expense: Expense): CategorySuggestion {
    const description = expense.description?.toLowerCase() || '';
    const amount = expense.amount || 0;
    
    // Check merchant database first
    for (const [key, merchant] of Object.entries(this.merchantDatabase)) {
      if (description.includes(key.toLowerCase())) {
        return {
          category: merchant.category,
          confidence: 0.9,
          reason: `${merchant.name} mağazası tespit edildi`
        };
      }
    }

    // Check category keywords
    let bestMatch = { category: 'Diğer', confidence: 0, matchCount: 0 };
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (description.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
      
      if (matchCount > bestMatch.matchCount) {
        bestMatch = {
          category,
          confidence: Math.min(0.8, matchCount * 0.3),
          matchCount
        };
      }
    }

    // Amount-based rules
    if (amount > 1000 && description.includes('kira')) {
      return {
        category: 'Ev & Yaşam',
        confidence: 0.85,
        reason: 'Yüksek tutar ve kira kelimesi'
      };
    }

    if (amount < 50 && (description.includes('kahve') || description.includes('çay'))) {
      return {
        category: 'Yemek & İçecek',
        confidence: 0.8,
        reason: 'Düşük tutar ve içecek'
      };
    }

    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      reason: bestMatch.matchCount > 0 ? 
        `${bestMatch.matchCount} anahtar kelime eşleşmesi` : 
        'Otomatik kategorizasyon yapılamadı'
    };
  }

  private async categorizeWithAI(expense: Expense): Promise<CategorySuggestion> {
    try {
      const schema: ObjectSchemaInterface = {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            description: 'Harcama kategorisi'
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: 'Güven skoru (0-1 arası)'
          },
          reason: {
            type: SchemaType.STRING,
            description: 'Kategorizasyon nedeni'
          }
        },
        required: ['category', 'confidence', 'reason']
      };

      const prompt = `
        Aşağıdaki harcamayı kategorize et:
        Açıklama: ${expense.description || 'Belirtilmemiş'}
        Tutar: ${expense.amount} TL
        
        Mevcut kategoriler:
        ${Object.keys(this.categoryKeywords).join(', ')}
        
        En uygun kategoriyi seç ve güven skorunu belirle.
      `;

      const result = await generateStructuredOutput<{
        category: string;
        confidence: number;
        reason: string;
      }>(prompt, schema);
      
      return {
        category: result.category || 'Diğer',
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        reason: result.reason || 'AI analizi'
      };
    } catch (error) {
      console.error('AI categorization failed:', error);
      return {
        category: 'Diğer',
        confidence: 0.1,
        reason: 'AI analizi başarısız'
      };
    }
  }

  async batchCategorize(expenses: Expense[]): Promise<{ [id: string]: CategorySuggestion }> {
    const results: { [id: string]: CategorySuggestion } = {};
    
    for (const expense of expenses) {
      if (expense.id) {
        results[expense.id] = await this.categorizeExpense(expense);
      }
    }
    
    return results;
  }

  getAvailableCategories(): string[] {
    return Object.keys(this.categoryKeywords);
  }

  addCustomKeyword(category: string, keyword: string): void {
    if (this.categoryKeywords[category]) {
      this.categoryKeywords[category].push(keyword.toLowerCase());
    }
  }

  addMerchant(key: string, merchantInfo: MerchantInfo): void {
    this.merchantDatabase[key.toLowerCase()] = merchantInfo;
  }
}

export const categorizationService = new CategorizationService();
export default categorizationService;