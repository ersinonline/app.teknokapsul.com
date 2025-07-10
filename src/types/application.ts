export interface Application {
  id: string;
  applicationNumber: string; // TK1234 formatında
  userId: string;
  serviceType: string;
  serviceName: string;
  serviceCategory: string;
  applicantInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    identityNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  services: Service[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  applicationUrl?: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'internet-tv',
    name: '📡 İnternet & TV Hizmetleri',
    icon: '📡',
    services: [
      { id: 'superonline', name: 'Superonline', category: 'internet-tv', description: 'Fiber internet ve TV paketleri' },
      { id: 'digiturk', name: 'Digitürk', category: 'internet-tv', description: 'Dijital TV ve internet hizmetleri' },
      { id: 'dsmart', name: 'D-Smart', category: 'internet-tv', description: 'TV ve internet paketleri' },
      { id: 'kablonet', name: 'KabloNET / KabloTV', category: 'internet-tv', description: 'Kablo internet ve TV' },
      { id: 'millenicom', name: 'Millenicom', category: 'internet-tv', description: 'Taahhütsüz internet çözümleri' },
      { id: 'turktelekom-internet', name: 'Türk Telekom', category: 'internet-tv', description: 'Fiber internet ve IPTV' },
      { id: 'extranet', name: 'Extranet', category: 'internet-tv', description: 'Ekonomik internet paketleri' },
      { id: 'soknet', name: 'Şoknet', category: 'internet-tv', description: 'Taahhütsüz internet hizmetleri' },
      { id: 'teknosanet', name: 'Teknosanet', category: 'internet-tv', description: 'Hızlı internet çözümleri' },
      { id: 'fibimnet', name: 'Fibimnet', category: 'internet-tv', description: 'Fiber internet hizmetleri' }
    ]
  },
  {
    id: 'gsm',
    name: '📱 GSM Operatörleri',
    icon: '📱',
    services: [
      { id: 'vodafone', name: 'Vodafone', category: 'gsm', description: 'Mobil hat ve internet paketleri' },
      { id: 'turkcell', name: 'Turkcell', category: 'gsm', description: 'GSM hat ve mobil internet' },
      { id: 'turktelekom-gsm', name: 'Türk Telekom', category: 'gsm', description: 'Mobil hat ve data paketleri' }
    ]
  },
  {
    id: 'technical-service',
    name: '🛠️ Teknik Servis (Cihaz Tamiri)',
    icon: '🛠️',
    services: [
      { id: 'apple-service', name: 'Apple Teknik Servis', category: 'technical-service', description: 'iPhone, iPad, Mac tamiri' },
      { id: 'samsung-service', name: 'Samsung Teknik Servis', category: 'technical-service', description: 'Samsung cihaz tamiri' },
      { id: 'xiaomi-service', name: 'Xiaomi Teknik Servis', category: 'technical-service', description: 'Xiaomi telefon tamiri' },
      { id: 'huawei-service', name: 'Huawei Teknik Servis', category: 'technical-service', description: 'Huawei cihaz tamiri' },
      { id: 'oppo-service', name: 'OPPO Teknik Servis', category: 'technical-service', description: 'OPPO telefon tamiri' }
    ]
  },
  {
    id: 'cleaning-transport',
    name: '🚚 Temizlik & Nakliyat Hizmetleri',
    icon: '🚚',
    services: [
      { id: 'nakliyat', name: 'Nakliyat Hizmetleri', category: 'cleaning-transport', description: 'Ev ve ofis taşıma' },
      { id: 'sehirlerarasi-nakliyat', name: 'Şehirler Arası Nakliyat', category: 'cleaning-transport', description: 'Uzun mesafe taşıma' },
      { id: 'parca-esya', name: 'Parça Eşya Taşıma', category: 'cleaning-transport', description: 'Küçük eşya taşıma' },
      { id: 'temizlik', name: 'Temizlik Hizmetleri', category: 'cleaning-transport', description: 'Profesyonel temizlik' },
      { id: 'ev-temizlik', name: 'Ev Temizliği', category: 'cleaning-transport', description: 'Ev temizlik hizmetleri' },
      { id: 'ofis-temizlik', name: 'Ofis Temizliği', category: 'cleaning-transport', description: 'Ofis temizlik hizmetleri' }
    ]
  },
  {
    id: 'security',
    name: '🛡️ Güvenlik Hizmetleri',
    icon: '🛡️',
    services: [
      { id: 'pronet', name: 'Pronet', category: 'security', description: 'Ev ve işyeri güvenlik sistemleri' },
      { id: 'secom', name: 'Secom Güvenlik', category: 'security', description: 'Güvenlik ve alarm sistemleri' },
      { id: 'kale', name: 'Kale Güvenlik', category: 'security', description: 'Güvenlik çözümleri' }
    ]
  },
  {
    id: 'e-services',
    name: '📄 E-Hizmetler (Dijital Çözümler)',
    icon: '📄',
    services: [
      { id: 'e-imza', name: 'E-İmza Başvurusu', category: 'e-services', description: 'Dijital imza hizmetleri' },
      { id: 'kep', name: 'KEP Adresi', category: 'e-services', description: 'Kayıtlı elektronik posta' },
      { id: 'e-fatura', name: 'E-Fatura', category: 'e-services', description: 'Elektronik fatura sistemi' }
    ]
  },
  {
    id: 'ev-charging',
    name: '🔌 Elektrikli Araç Şarj İstasyonları',
    icon: '🔌',
    services: [
      { id: 'ac-sarj', name: 'AC Şarj İstasyonu', category: 'ev-charging', description: 'Alternatif akım şarj istasyonu' },
      { id: 'dc-sarj', name: 'DC Şarj İstasyonu', category: 'ev-charging', description: 'Doğru akım hızlı şarj' },
      { id: 'ac-dc-sarj', name: 'AC/DC Şarj İstasyonu', category: 'ev-charging', description: 'Hibrit şarj çözümleri' }
    ]
  },
  {
    id: 'home-services',
    name: '🏡 Diğer Ev Hizmetleri',
    icon: '🏡',
    services: [
      { id: 'ilaclat', name: 'İlaçlat Böcek İlaçlama', category: 'home-services', description: 'Böcek ve haşere ilaçlama' },
      { id: 'kia-su', name: 'Kia Su Arıtma', category: 'home-services', description: 'Su arıtma sistemleri' }
    ]
  }
];

export const APPLICATION_STATUS = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı'
} as const;