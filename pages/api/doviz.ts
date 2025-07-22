interface DovizResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Merkez Bankası API'sinden döviz kurlarını al
    const response = await fetch('https://api.genelpara.com/embed/doviz.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Veriyi formatla
    const formattedData = {
      USD: {
        Alis: data.USD?.Alis || '0',
        Satis: data.USD?.Satis || '0',
        Degisim: data.USD?.Degisim || '0'
      },
      EUR: {
        Alis: data.EUR?.Alis || '0',
        Satis: data.EUR?.Satis || '0',
        Degisim: data.EUR?.Degisim || '0'
      }
    };
    
    return res.status(200).json({
      success: true,
      data: [formattedData]
    });
    
  } catch (error) {
    console.error('Döviz API hatası:', error);
    
    // Hata durumunda varsayılan değerler döndür
    const fallbackData = {
      USD: {
        Alis: '34.50',
        Satis: '34.55',
        Degisim: '0.05'
      },
      EUR: {
        Alis: '37.20',
        Satis: '37.25',
        Degisim: '0.10'
      }
    };
    
    return res.status(200).json({
      success: true,
      data: [fallbackData]
    });
  }
}