import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { scrapeGoldPrices, scrapeUSDPrices, scrapeEURPrices } from './scrapers';

interface PriceData {
  symbol: string;
  type: 'gold' | 'currency';
  buyPrice?: string;
  sellPrice?: string;
  change?: string;
  lastUpdated?: string;
}



// Altın fiyatlarını çeken fonksiyon
const getGoldPrices = async (): Promise<PriceData> => {
  try {
    const result = await scrapeGoldPrices();
    
    return {
      symbol: 'GOLD',
      type: 'gold',
      buyPrice: result['Gram Altın Alış'] || '',
      sellPrice: result['Gram Altın Satış'] || '',
      change: result['Gram Altın Değişim'] || '',
      lastUpdated: result['Gram Altın Güncelleme Saati'] || new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching gold prices:', error);
    throw error;
  }
};

// Dolar fiyatlarını çeken fonksiyon
const getUSDPrices = async (): Promise<PriceData> => {
  try {
    const result = await scrapeUSDPrices();
    
    return {
      symbol: 'USD',
      type: 'currency',
      buyPrice: result['ABD Doları Alış'] || '',
      sellPrice: result['ABD Doları Satış'] || '',
      change: result['ABD Doları Değişim'] || '',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching USD prices:', error);
    throw error;
  }
};

// Euro fiyatlarını çeken fonksiyon
const getEURPrices = async (): Promise<PriceData> => {
  try {
    const result = await scrapeEURPrices();
    
    return {
      symbol: 'EUR',
      type: 'currency',
      buyPrice: result['Euro Alış'] || '',
      sellPrice: result['Euro Satış'] || '',
      change: result['Euro Değişim'] || '',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching EUR prices:', error);
    throw error;
  }
};

// Ana endpoint
export const updatePrices = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB'
  },
  async (request, response) => {
    try {
      const { symbols } = request.body;
      const results: { [key: string]: PriceData } = {};
      const errors: { [key: string]: string } = {};

      // Eğer belirli semboller belirtilmişse sadece onları güncelle
      const symbolsToUpdate = symbols || ['GOLD', 'USD', 'EUR'];

      // Paralel olarak tüm fiyatları çek
      const promises = symbolsToUpdate.map(async (symbol: string) => {
        try {
          let priceData: PriceData;
          
          switch (symbol) {
            case 'GOLD':
              priceData = await getGoldPrices();
              break;
            case 'USD':
              priceData = await getUSDPrices();
              break;
            case 'EUR':
              priceData = await getEURPrices();
              break;
            default:
              throw new Error(`Unsupported symbol: ${symbol}`);
          }
          
          results[symbol] = priceData;
        } catch (error) {
          logger.error(`Error updating ${symbol}:`, error);
          errors[symbol] = error instanceof Error ? error.message : 'Unknown error';
        }
      });

      await Promise.all(promises);

      // Sonuçları döndür
      response.status(200).json({
        success: true,
        data: results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in updatePrices function:', error);
      response.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Tek bir sembol için fiyat güncelleme endpoint'i
export const updateSinglePrice = onRequest(
  {
    cors: true,
    timeoutSeconds: 30,
    memory: '256MiB'
  },
  async (request, response) => {
    try {
      const { symbol } = request.body;
      
      if (!symbol || !['GOLD', 'USD', 'EUR'].includes(symbol.toUpperCase())) {
        response.status(400).json({
          success: false,
          error: 'Invalid symbol. Supported symbols: GOLD, USD, EUR'
        });
        return;
      }

      let priceData: PriceData;
      
      switch (symbol.toUpperCase()) {
        case 'GOLD':
          priceData = await getGoldPrices();
          break;
        case 'USD':
          priceData = await getUSDPrices();
          break;
        case 'EUR':
          priceData = await getEURPrices();
          break;
        default:
          throw new Error(`Unsupported symbol: ${symbol}`);
      }

      response.status(200).json({
        success: true,
        data: priceData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in updateSinglePrice function:', error);
      response.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);