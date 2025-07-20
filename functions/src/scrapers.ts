import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from 'firebase-functions';

interface ScrapedData {
  [key: string]: string;
}

// Bigpara'dan altın fiyatlarını çeken fonksiyon
export const scrapeGoldPrices = async (): Promise<ScrapedData> => {
  try {
    const url = 'https://bigpara.hurriyet.com.tr/altin/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const result: ScrapedData = {};
    
    // Gram altın verilerini çek
    const gramAltinRow = $('tr').filter((_, el) => {
      return $(el).find('td').first().text().includes('Gram Altın');
    }).first();
    
    if (gramAltinRow.length > 0) {
      const cells = gramAltinRow.find('td');
      result['Gram Altın Alış'] = cells.eq(1).text().trim();
      result['Gram Altın Satış'] = cells.eq(2).text().trim();
      result['Gram Altın Değişim'] = cells.eq(4).text().trim();
      result['Gram Altın Güncelleme Saati'] = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    logger.info('Altın verileri başarıyla çekildi:', result);
    return result;
  } catch (error) {
    logger.error('Altın verileri çekilirken hata:', error);
    throw error;
  }
};

// Bigpara'dan dolar fiyatlarını çeken fonksiyon
export const scrapeUSDPrices = async (): Promise<ScrapedData> => {
  try {
    const url = 'https://bigpara.hurriyet.com.tr/doviz/dolar/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const result: ScrapedData = {};
    
    // Dolar verilerini çek
    const dolerRow = $('tr').filter((_, el) => {
      return $(el).find('td').first().text().includes('ABD Doları');
    }).first();
    
    if (dolerRow.length > 0) {
      const cells = dolerRow.find('td');
      result['ABD Doları Alış'] = cells.eq(1).text().trim();
      result['ABD Doları Satış'] = cells.eq(2).text().trim();
      result['ABD Doları Değişim'] = cells.eq(4).text().trim();
    }
    
    logger.info('Dolar verileri başarıyla çekildi:', result);
    return result;
  } catch (error) {
    logger.error('Dolar verileri çekilirken hata:', error);
    throw error;
  }
};

// Bigpara'dan euro fiyatlarını çeken fonksiyon
export const scrapeEURPrices = async (): Promise<ScrapedData> => {
  try {
    const url = 'https://bigpara.hurriyet.com.tr/doviz/euro/';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const result: ScrapedData = {};
    
    // Euro verilerini çek
    const euroRow = $('tr').filter((_, el) => {
      return $(el).find('td').first().text().includes('Euro');
    }).first();
    
    if (euroRow.length > 0) {
      const cells = euroRow.find('td');
      result['Euro Alış'] = cells.eq(1).text().trim();
      result['Euro Satış'] = cells.eq(2).text().trim();
      result['Euro Değişim'] = cells.eq(4).text().trim();
    }
    
    logger.info('Euro verileri başarıyla çekildi:', result);
    return result;
  } catch (error) {
    logger.error('Euro verileri çekilirken hata:', error);
    throw error;
  }
};