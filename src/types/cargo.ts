export interface CargoTracking {
  id: string;
  name: string;
  trackingNumber: string;
  company: string;
  isDelivered: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CargoCompany {
  id: string;
  name: string;
  url: string;
  type: 'popup' | 'iframe';
  logo: string;
}

export const CARGO_COMPANIES: Record<string, CargoCompany> = {
  'aras': { 
    id: 'aras', 
    name: 'Aras Kargo', 
    url: 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Faras-logo.webp&w=640&q=75'
  },
  'dhl': { 
    id: 'dhl', 
    name: 'DHL Kargo', 
    url: 'https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${trackingNumber}', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fdhl-ecommerce.webp&w=640&q=75'
  },
  'ptt-kargo': { 
    id: 'ptt-kargo', 
    name: 'PTT Kargo', 
    url: 'https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNumber}', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fptt-logo.webp&w=640&q=75'
  },
  'ups': { 
    id: 'ups', 
    name: 'UPS Kargo', 
    url: 'https://www.ups.com.tr/WaybillSorgu.aspx?Waybill=${trackingNumber}', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fups-logo.webp&w=640&q=75'
  },
  'kolay-gelsin': { 
    id: 'kolay-gelsin', 
    name: 'Kolay Gelsin', 
    url: 'https://esube.kolaygelsin.com/shipments/?trackingId=${trackingNumber}&lang=TR', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fkolaygelsin-logo.webp&w=640&q=75'
  },
  'sendeo-kargo': { 
    id: 'sendeo-kargo', 
    name: 'Sendeo Kargo', 
    url: 'https://sendeo.com.tr/tracking?q=${trackingNumber}', 
    type: 'popup',
    logo: '/api/placeholder/120/40'
  },
  'jetizz': { 
    id: 'jetizz', 
    name: 'Jetizz', 
    url: 'https://app.jetizz.com/gonderi-takip?q=${trackingNumber}', 
    type: 'popup',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fjetizz-logo.webp&w=640&q=75'
  },
  'yurtici': { 
    id: 'yurtici', 
    name: 'Yurtiçi Kargo', 
    url: 'https://yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fyurtici-logo.webp&w=640&q=75'
  },
  'kargomsende': { 
    id: 'kargomsende', 
    name: 'Kargomsende', 
    url: 'https://esube.kargomsende.com/kargom/takip/${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fkargomsende.webp&w=640&q=75'
  },
  'kargoist': { 
    id: 'kargoist', 
    name: 'Kargoist', 
    url: 'https://kargotakip.kargoist.com/tracking?har_kod=${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fkargoist-logo.webp&w=640&q=75'
  },
  'suratkargo': { 
    id: 'suratkargo', 
    name: 'Sürat Kargo', 
    url: 'https://suratkargo.com.tr/KargoTakip/?KARGOTAKIPNO=${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fsurat-logo.webp&w=640&q=75'
  },
  'hepsijet': { 
    id: 'hepsijet', 
    name: 'HepsiJet', 
    url: 'https://hepsijet.com/gonderi-takibi/${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Fhepsijet-logo.webp&w=640&q=75'
  },
  'tex': { 
    id: 'tex', 
    name: 'Trendyol Express', 
    url: 'https://kargotakip.trendyol.com/?orderNumber=${trackingNumber}', 
    type: 'iframe',
    logo: 'https://kargomnerede.com.tr/_next/image?url=%2Fimg%2Ftrendyolexpress-logo.webp&w=640&q=75'
  }
};